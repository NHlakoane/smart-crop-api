import client from "../config/db.js";

class PerformanceScoreService {
  constructor() {
    this.ratingThresholds = {
      perfect: 300,
      good: 200,
      moderate: 100,
      fair: 0,
    };

    this.client = client;
  }

  async calculateFarmerScore(farmerId, periodDays = 30) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    try {
      const tasksQuery = `
SELECT 
  COUNT(*) as total_tasks,
  SUM(expected_duration_minutes) * 60 as total_expected_seconds,
  SUM(actual_duration_minutes) * 60 as total_actual_seconds,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
FROM tasks 
WHERE assigned_to = $1 
  AND created_date >= $2
  AND (status = 'completed' OR status = 'in_progress')
      `;

      const result = await this.client.query(tasksQuery, [
        farmerId,
        periodStart,
      ]);

      if (!result.rows[0] || result.rows[0].total_tasks === "0") {
        return {
          score: 0,
          rating: "fair",
          tasks_completed: 0,
          total_tasks: 0,
        };
      }

      const row = result.rows[0];
      const totalExpected = parseFloat(row.total_expected_seconds) || 0;
      const totalActual = parseFloat(row.total_actual_seconds) || 0;
      const completedTasks = parseInt(row.completed_tasks) || 0;
      const totalTasks = parseInt(row.total_tasks) || 0;

      let efficiencyScore = 0;
      let totalScore = 0;

      if (totalExpected > 0 && totalActual > 0) {
        efficiencyScore = ((totalExpected - totalActual) / totalExpected) * 100;
        efficiencyScore = Math.max(0, Math.min(efficiencyScore, 100));

        const completionRate = (completedTasks / totalTasks) * 100;
        const bonusScore = completionRate * 0.5;

        totalScore = efficiencyScore + bonusScore;
      } else {
        totalScore = (completedTasks / totalTasks) * 100;
      }

      const rating = this.getRating(totalScore);

      return {
        score: Math.round(totalScore),
        rating,
        tasks_completed: completedTasks,
        total_tasks: totalTasks,
        efficiency_score: efficiencyScore,
        completion_rate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };
    } catch (error) {
      console.error("Error calculating farmer score:", error);
      throw error;
    }
  }

  async calculateManagerScore(managerId, periodDays = 30) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    try {
      // Get all farmers managed by this manager
      const farmersQuery = `
        SELECT user_id FROM users 
        WHERE user_id = $1 AND role = 'farmer' AND is_active = true
      `;

      const farmersResult = await this.client.query(farmersQuery, [managerId]);
      const farmerIds = farmersResult.rows.map((row) => row.user_id);

      if (farmerIds.length === 0) {
        return {
          score: 0,
          rating: "fair",
          team_size: 0,
          average_team_score: 0,
        };
      }

      // Calculate average score of all farmers
      let totalTeamScore = 0;
      let activeFarmers = 0;

      for (const farmerId of farmerIds) {
        const farmerScore = await this.calculateFarmerScore(
          farmerId,
          periodDays
        );
        if (farmerScore.total_tasks > 0) {
          totalTeamScore += farmerScore.score;
          activeFarmers++;
        }
      }

      // Get manager's task assignment efficiency
      const taskStatsQuery = `
  SELECT 
    COUNT(*) as total_tasks_assigned,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
    AVG(EXTRACT(EPOCH FROM assigned_date - created_date)) as avg_assignment_seconds
  FROM tasks 
  WHERE assigned_by = $1 
    AND created_date >= $2
`;

      const taskStatsResult = await this.client.query(taskStatsQuery, [
        managerId,
        periodStart,
      ]);
      const taskStats = taskStatsResult.rows[0];

      // Calculate manager score components
      const averageTeamScore =
        activeFarmers > 0 ? totalTeamScore / activeFarmers : 0;

      // Task assignment efficiency
      let assignmentEfficiency = 0;
      if (
        taskStats.avg_assignment_seconds &&
        taskStats.avg_assignment_seconds > 0
      ) {
        const maxExpectedSeconds = 24 * 60 * 60; // 24 hours in seconds
        assignmentEfficiency = Math.max(
          0,
          ((maxExpectedSeconds - taskStats.avg_assignment_seconds) /
            maxExpectedSeconds) *
            50
        );
      }

      // Completion rate bonus
      let completionBonus = 0;
      const totalTasksAssigned = parseInt(taskStats.total_tasks_assigned) || 0;
      if (totalTasksAssigned > 0) {
        const completedTasks = parseInt(taskStats.completed_tasks) || 0;
        const completionRate = (completedTasks / totalTasksAssigned) * 50;
        completionBonus = completionRate;
      }

      const totalScore =
        averageTeamScore * 0.6 + assignmentEfficiency + completionBonus;
      const rating = this.getRating(totalScore);

      return {
        score: Math.round(totalScore),
        rating,
        team_size: farmerIds.length,
        active_farmers: activeFarmers,
        average_team_score: parseFloat(averageTeamScore.toFixed(1)),
        tasks_assigned: totalTasksAssigned,
        completion_rate:
          totalTasksAssigned > 0
            ? parseFloat(((completionBonus / 50) * 100).toFixed(1))
            : 0,
      };
    } catch (error) {
      console.error("Error calculating manager score:", error);
      throw error;
    }
  }

  getRating(score) {
    if (score >= this.ratingThresholds.perfect) return "perfect";
    if (score >= this.ratingThresholds.good) return "good";
    if (score >= this.ratingThresholds.moderate) return "moderate";
    return "fair";
  }

  async updateUserPerformance(userId, role, periodDays = 30) {
    try {
      let result;

      if (role === "farmer") {
        result = await this.calculateFarmerScore(userId, periodDays);
      } else if (role === "manager") {
        result = await this.calculateManagerScore(userId, periodDays);
      } else {
        result = { score: 0, rating: "fair" };
      }

      // Update user record
      const updateQuery = `
        UPDATE users 
        SET performance_score = $1, 
            performance_rating = $2,
            updated_date = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING user_id, names, email, performance_score, performance_rating
      `;

      const updateResult = await this.client.query(updateQuery, [
        result.score,
        result.rating,
        userId,
      ]);

      // Save historical record
      await this.savePerformanceHistory(userId, result, role, periodDays);

      return {
        user: updateResult.rows[0],
        performance: result,
      };
    } catch (error) {
      console.error("Error updating user performance:", error);
      throw error;
    }
  }

  async savePerformanceHistory(userId, result, role, periodDays) {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    try {
      const insertQuery = `
        INSERT INTO performance_scores 
        (user_id, score, rating, calculation_method, period_start, period_end, 
         tasks_completed, total_tasks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING score_id
      `;

      await this.client.query(insertQuery, [
        userId,
        result.score,
        result.rating,
        `${role}_calculation`,
        periodStart,
        periodEnd,
        result.tasks_completed || 0,
        result.total_tasks || 0,
      ]);
    } catch (error) {
      console.error("Error saving performance history:", error);
      throw error;
    }
  }

  async getPerformanceHistory(userId) {
    try {
      const query = `
      SELECT 
        u.user_id, u.names, u.email, u.role,
        u.performance_score, u.performance_rating,
        p.tasks_completed, p.total_tasks
      FROM users u
      LEFT JOIN performance_scores p ON u.user_id = p.user_id
      WHERE u.user_id = $1
      ORDER BY p.created_date DESC
      LIMIT 1
    `;

      const result = await this.client.query(query, [userId]);

      return result.rows;
    } catch (error) {
      console.log("Error getting current performance:", error);
      throw error;
    }
  }

  async getLeaderboard(role = "farmer", limit = 10) {
    try {
      const query = `
      WITH task_counts AS (
        SELECT 
          assigned_to as user_id,
          COUNT(*) as total_tasks,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as tasks_completed
        FROM tasks 
        WHERE status IN ('completed', 'in_progress')
        GROUP BY assigned_to
      )
      SELECT DISTINCT ON (u.user_id) 
             u.user_id, u.names, u.email, u.role,
             COALESCE(p.score, u.performance_score, 0) as performance_score,
             COALESCE(p.rating, u.performance_rating, 'fair') as performance_rating,
             COALESCE(tc.tasks_completed, 0) as tasks_completed,
             COALESCE(tc.total_tasks, 0) as total_tasks
      FROM users AS u
      LEFT JOIN performance_scores AS p ON u.user_id = p.user_id
      LEFT JOIN task_counts tc ON u.user_id = tc.user_id
      WHERE u.role = $1 AND u.is_active = true
      ORDER BY u.user_id, p.created_date DESC NULLS LAST
      LIMIT $2
    `;

      const result = await this.client.query(query, [role, limit]);

      // Sort by performance score descending
      const sortedResults = result.rows.sort(
        (a, b) => (b.performance_score || 0) - (a.performance_score || 0)
      );

      return sortedResults;
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  async batchUpdatePerformance(role, periodDays = 30) {
    try {
      const usersQuery = `
        SELECT user_id FROM users 
        WHERE role = $1 AND is_active = true
      `;

      const usersResult = await this.client.query(usersQuery, [role]);
      const results = [];

      for (const row of usersResult.rows) {
        try {
          const result = await this.updateUserPerformance(
            row.user_id,
            role,
            periodDays
          );
          results.push(result);
        } catch (error) {
          console.error(
            `Error updating performance for user ${row.user_id}:`,
            error
          );
          results.push({ userId: row.user_id, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error("Error in batch update:", error);
      throw error;
    }
  }
}

export default PerformanceScoreService;
