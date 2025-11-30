import PerformanceScoreService from "../services/performance-score.service.js";

class PerformanceController {
  constructor() {
    this.performanceService = new PerformanceScoreService();
  }

  async updateUserPerformance(req, res) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;

      const { periodDays = 1 } = req.body;

      const result = await this.performanceService.updateUserPerformance(
        parseInt(userId),
        role,
        periodDays
      );

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Error in updateUserPerformance:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getPerformanceHistory(req, res) {
    
    try {
      const userId = req.params.userId;
      const { limit = 999 } = req.query;

      const history = await this.performanceService.getPerformanceHistory(
        parseInt(userId),
        parseInt(limit)
      );

      if (history.length === 0) {
        return res.json({
          success: true,
          data: {
            performance_score: 0,
            performance_rating: "fair",
            tasks_completed: 0,
            total_tasks: 0,
          },
        });
      }

      return res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      console.error("Error in getPerformanceHistory:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  async getLeaderboard(req, res) {
    try {
      const role = req.user || "farmer";
      const { limit = 10 } = req.query;

      const leaderboard = await this.performanceService.getLeaderboard(
        role,
        parseInt(limit)
      );

      return res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      console.error("Error in getLeaderboard:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async batchUpdate(req, res) {
    try {
      const role = req.user;
      const { periodDays = 30 } = req.body;

      const results = await this.performanceService.batchUpdatePerformance(
        role,
        periodDays
      );

      return res.json({
        success: true,
        data: {
          total_updated: results.length,
          results,
        },
      });
    } catch (error) {
      console.error("Error in batchUpdate:", error);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default PerformanceController;
