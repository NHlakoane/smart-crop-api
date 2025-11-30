import client from "../config/db.js";

class StatsController {
    constructor() {
        this.client = client;
    }
  async getCropStats(_req, res) {
    try {
      let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_harvested = true THEN 1 END) as harvested,
                COUNT(CASE WHEN is_harvested = false AND exp_harvest > NOW() THEN 1 END) as growing,
                COUNT(CASE WHEN is_harvested = false AND exp_harvest < NOW() THEN 1 END) as overdue,
                COUNT(CASE WHEN is_harvested = false AND exp_harvest BETWEEN NOW() AND NOW() + INTERVAL '7 days' THEN 1 END) as due_soon
            FROM crops
        `;

      const result = await this.client.query(query);

      const stats = {
        total: parseInt(result.rows[0].total),
        harvested: parseInt(result.rows[0].harvested),
        growing: parseInt(result.rows[0].growing),
        overdue: parseInt(result.rows[0].overdue),
        dueSoon: parseInt(result.rows[0].due_soon),
      };

      return res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.log("Get crop stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch crop statistics",
      });
    }
  }

async getTaskStats(req, res) {
    try {
        const days = parseInt(req.query.days) || 30;
        
        const result = await this.client.query(`
            SELECT 
                DATE(created_date) as date,
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress
            FROM tasks
            WHERE created_date >= NOW() - INTERVAL '${days} days'
            GROUP BY DATE(created_date)
            ORDER BY date
        `);

        const stats = result.rows.map(row => ({
            date: row.date,
            total: parseInt(row.total),
            completed: parseInt(row.completed),
            pending: parseInt(row.pending),
            in_progress: parseInt(row.in_progress)
        }));

        return res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.log("Get task stats error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch task statistics"
        });
    }
}
}

export default StatsController;
