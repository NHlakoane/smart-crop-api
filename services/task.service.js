import client from "../config/db.js";
import PerformanceScoreService from "./performance-score.service.js";

class TaskService {
  constructor() {
    this.client = client;
    this.performanceService = new PerformanceScoreService();
  }

  async createTask(taskData) {
    const {
      title,
      description,
      assigned_to,
      assigned_by,
      priority,
      due_date,
      crop_id,
      field_id,
      expected_duration_minutes, 
    } = taskData;

    const query = `
            INSERT INTO tasks (
                title, description, assigned_to, assigned_by, 
                priority, due_date, crop_id, field_id, expected_duration_minutes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

    const values = [
      title,
      description,
      assigned_to,
      assigned_by,
      priority,
      due_date,
      crop_id,
      field_id,
      expected_duration_minutes || null,
    ];

    const result = await this.client.query(query, values);

    // Update performance score for the assigned user
    try {
      await this.performanceService.updateUserPerformance(
        assigned_to,
        "farmer"
      );
    } catch (error) {
      console.warn("Failed to update performance score:", error.message);
    }

    return result.rows[0];
  }

  async getTaskById(taskId) {
    const query = `
            SELECT t.*, 
                   u_assigned.names as assigned_to_name,
                   u_assigned.performance_score as assigned_to_score,
                   u_assigned.performance_rating as assigned_to_rating,
                   u_assigner.names as assigned_by_name,
                   c.c_name as crop_name,
                   f.f_name as field_name
            FROM tasks t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.user_id
            LEFT JOIN users u_assigner ON t.assigned_by = u_assigner.user_id
            LEFT JOIN crops c ON t.crop_id = c.c_id
            LEFT JOIN fields f ON t.field_id = f.f_id
            WHERE t.task_id = $1
        `;

    const result = await this.client.query(query, [taskId]);
    return result.rows[0];
  }

  async getTasksByUser(userId, filters = {}) {
    let query = `
            SELECT t.*, 
                   u_assigned.names as assigned_to_name,
                   u_assigned.performance_score as assigned_to_score,
                   u_assigned.performance_rating as assigned_to_rating,
                   u_assigner.names as assigned_by_name,
                   c.c_name as crop_name,
                   f.f_name as field_name
            FROM tasks t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.user_id
            LEFT JOIN users u_assigner ON t.assigned_by = u_assigner.user_id
            LEFT JOIN crops c ON t.crop_id = c.c_id
            LEFT JOIN fields f ON t.field_id = f.f_id
            WHERE t.assigned_to = $1
        `;

    const values = [userId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND t.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.priority) {
      query += ` AND t.priority = $${paramCount}`;
      values.push(filters.priority);
      paramCount++;
    }

    query += ` ORDER BY t.due_date ASC, t.created_date DESC`;

    const result = await this.client.query(query, values);
    return result.rows;
  }

  async getTasksAssignedByUser(userId, filters = {}) {
    let query = `
            SELECT t.*, 
                   u_assigned.names as assigned_to_name,
                   u_assigned.performance_score as assigned_to_score,
                   u_assigned.performance_rating as assigned_to_rating,
                   u_assigner.names as assigned_by_name,
                   c.c_name as crop_name,
                   f.f_name as field_name
            FROM tasks t
            LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.user_id
            LEFT JOIN users u_assigner ON t.assigned_by = u_assigner.user_id
            LEFT JOIN crops c ON t.crop_id = c.c_id
            LEFT JOIN fields f ON t.field_id = f.f_id
            WHERE t.assigned_by = $1
        `;

    const values = [userId];
    let paramCount = 2;

    if (filters.status) {
      query += ` AND t.status = $${paramCount}`;
      values.push(filters.status);
      paramCount++;
    }

    if (filters.priority) {
      query += ` AND t.priority = $${paramCount}`;
      values.push(filters.priority);
      paramCount++;
    }

    query += ` ORDER BY t.due_date ASC, t.created_date DESC`;

    const result = await this.client.query(query, values);
    return result.rows;
  }

  async updateTask(taskId, updates) {
    const allowedFields = [
      "title",
      "description",
      "status",
      "priority",
      "due_date",
      "crop_id",
      "field_id",
      "expected_duration_minutes",
      "actual_duration_minutes",
    ];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    updateFields.push("updated_date = CURRENT_TIMESTAMP");

    // Handle status-specific updates
    if (updates.status === "in_progress") {
      updateFields.push("started_at = CURRENT_TIMESTAMP");
    } else if (updates.status === "completed") {
      updateFields.push("completed_at = CURRENT_TIMESTAMP");

      // Calculate actual duration in minutes using EXTRACT(EPOCH)
      updateFields.push(`
        actual_duration_minutes = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - COALESCE(started_at, created_date))) / 60
      `);
    }

    values.push(taskId);
    const query = `UPDATE tasks 
                 SET ${updateFields.join(", ")} 
                 WHERE task_id = $${paramCount} 
                 RETURNING *`;

    const result = await this.client.query(query, values);
    const updatedTask = result.rows[0];

    // Update performance score when task status changes
    if (
      updates.status &&
      ["completed", "in_progress"].includes(updates.status)
    ) {
      try {
        await this.performanceService.updateUserPerformance(
          updatedTask.assigned_to,
          "farmer"
        );

        if (updates.status === "completed") {
          await this.performanceService.updateUserPerformance(
            updatedTask.assigned_by,
            "manager"
          );
        }
      } catch (error) {
        console.log("Failed to update performance score:", error.message);
      }
    }

    return updatedTask;
  }
  async deleteTask(taskId) {
    // Get task info before deletion for performance update
    const task = await this.getTaskById(taskId);

    const query = "DELETE FROM tasks WHERE task_id = $1 RETURNING *";
    const result = await this.client.query(query, [taskId]);
    const deletedTask = result.rows[0];

    // Update performance score after deletion
    try {
      await this.performanceService.updateUserPerformance(
        task.assigned_to,
        "farmer"
      );
    } catch (error) {
      console.warn(
        "Failed to update performance score after deletion:",
        error.message
      );
    }

    return deletedTask;
  }

  async addTaskComment(taskId, userId, comment) {
    const query = `
            INSERT INTO task_comments (task_id, user_id, comment)
            VALUES ($1, $2, $3)
            RETURNING *, 
            (SELECT names FROM users WHERE user_id = $2) as user_name
        `;

    const result = await this.client.query(query, [taskId, userId, comment]);
    return result.rows[0];
  }

  async getTaskComments(taskId) {
    const query = `
            SELECT tc.*, u.names as user_name
            FROM task_comments tc
            JOIN users u ON tc.user_id = u.user_id
            WHERE tc.task_id = $1
            ORDER BY tc.created_date ASC
        `;

    const result = await this.client.query(query, [taskId]);
    return result.rows;
  }

  async getOverdueTasks() {
    const query = `
            SELECT t.*, u.names as assigned_to_name
            FROM tasks t
            JOIN users u ON t.assigned_to = u.user_id
            WHERE t.due_date < CURRENT_TIMESTAMP 
            AND t.status NOT IN ('completed', 'cancelled')
        `;

    const result = await this.client.query(query);
    return result.rows;
  }

  async calculateTaskEfficiency(taskId) {
    const task = await this.getTaskById(taskId);

    if (!task.expected_duration_minutes || !task.actual_duration_minutes) {
      return null;
    }

    // Use minutes directly for calculation
    const expectedMinutes = parseInt(task.expected_duration_minutes) || 0;
    const actualMinutes = parseInt(task.actual_duration_minutes) || 0;

    if (expectedMinutes === 0) return null;

    // Efficiency formula: ((expected - actual) / expected) * 100
    const efficiency =
      ((expectedMinutes - actualMinutes) / expectedMinutes) * 100;
    return Math.max(0, efficiency); // Don't allow negative efficiency
  }

  async getTaskPerformanceMetrics(userId, periodDays = 30) {
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - periodDays);

    const query = `
            SELECT 
                COUNT(*) as total_tasks,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                AVG(actual_duration_minutes) as avg_actual_minutes,
                AVG(expected_duration_minutes) as avg_expected_minutes
            FROM tasks 
            WHERE assigned_to = $1 
            AND created_at >= $2
            AND (status = 'completed' OR status = 'in_progress')
        `;

    const result = await this.client.query(query, [
      userId,
      periodStart.toISOString(),
    ]);
    return result.rows[0];
  }

  async getTaskTemplates() {
    const { rows } = await this.client.query("SELECT * FROM task_templates ORDER BY title ASC");

    return rows || []
  }
}

export default TaskService;
