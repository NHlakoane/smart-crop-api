import client from "../config/db.js";

export class PesticideService {
  constructor() {
    this.client = client;
  }
  // CREATE pesticide
  async createPesticide(pesticideData) {
    try {
      const result = await this.client.query(
        `INSERT INTO pesticides (p_name, pesticide_type, size, user_id)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
        [
          pesticideData.p_name,
          pesticideData.pesticide_type,
          pesticideData.size,
          pesticideData.user_id,
        ]
      );
      return result.rows[0];
    } catch (error) {
      console.log("Create pesticide error:", error);
      throw new Error("Failed to create pesticide");
    }
  }

  // READ pesticide by ID
  async findPesticideById(id) {
    try {
      const result = await this.client.query(
        `SELECT p.*, 
                 u.names as user_name, u.email as user_email
                 FROM pesticides p
                 LEFT JOIN users u ON p.user_id = u.user_id
                 WHERE p.p_id = $1`,
        [id]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.log("Find pesticide by ID error:", error);
      throw new Error("Failed to fetch pesticide by ID");
    }
  }

  // READ all pesticides with optional filters
  async findAllPesticides(filters = {}) {
    try {
      let query = `
            SELECT p.*, 
             u.names as user_name
            FROM pesticides p
            LEFT JOIN users u ON p.user_id = u.user_id
        `;

      const conditions = [];
      const values = [];
      let paramCount = 0;

      // Size filter
      if (filters.size) {
        paramCount++;
        conditions.push(`p.size = $${paramCount}`);
        values.push(filters.size);
      }

      // Pesticide type filter
      if (filters.pesticide_type) {
        paramCount++;
        conditions.push(`p.pesticide_type = $${paramCount}`);
        values.push(filters.pesticide_type);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      const result = await this.client.query(query, values);
      return result.rows;
    } catch (error) {
      console.log("Find all pesticides error:", error);
      throw new Error("Failed to fetch pesticides");
    }
  }

  // UPDATE pesticide
  async updatePesticide(id, updates) {
    try {
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      const allowedFields = [
        "p_name",
        "pesticide_type",
        "size"
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error("No valid fields to update");
      }

      paramCount++;
      updateFields.push("updated_date = CURRENT_TIMESTAMP");
      values.push(id);

      const result = await this.client.query(
        `UPDATE pesticides 
                 SET ${updateFields.join(", ")}
                 WHERE p_id = $${paramCount}
                 RETURNING *`,
        values
      );

      return result.rows[0] || null;
    } catch (error) {
      console.log("Update pesticide error:", error);
      throw new Error("Failed to update pesticide");
    }
  }

  // DELETE pesticide
  async deletePesticide(id) {
    try {
      const result = await this.client.query(
        `DELETE FROM pesticides WHERE p_id = $1 RETURNING p_id`,
        [id]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.log("Delete pesticide error:", error);
      throw new Error("Failed to delete pesticide");
    }
  }

  // GET pesticides by user ID
  async findPesticidesByUserId(userId) {
    try {
      const result = await this.client.query(
        `SELECT p.*, c.c_name as crop_name
                 FROM pesticides p
                 LEFT JOIN crops c ON p.crop_id = c.c_id
                 WHERE p.user_id = $1
                 ORDER BY p.applied_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.log("Find pesticides by user ID error:", error);
      throw new Error("Failed to fetch pesticides by user");
    }
  }

  // GET pesticides by crop ID
  async findPesticidesByCropId(cropId) {
    try {
      const result = await this.client.query(
        `SELECT p.*, u.names as user_name
                 FROM pesticides p
                 LEFT JOIN users u ON p.user_id = u.user_id
                 WHERE p.crop_id = $1
                 ORDER BY p.applied_at DESC`,
        [cropId]
      );
      return result.rows;
    } catch (error) {
      console.log("Find pesticides by crop ID error:", error);
      throw new Error("Failed to fetch pesticides by crop");
    }
  }

  // GET pesticides by type
  async findPesticidesByType(pesticideType) {
    try {
      const result = await this.client.query(
        `SELECT p.*, u.names as user_name, c.c_name as crop_name
                 FROM pesticides p
                 LEFT JOIN users u ON p.user_id = u.user_id
                 LEFT JOIN crops c ON p.crop_id = c.c_id
                 WHERE p.pesticide_type = $1
                 ORDER BY p.applied_at DESC`,
        [pesticideType]
      );
      return result.rows;
    } catch (error) {
      console.log("Find pesticides by type error:", error);
      throw new Error("Failed to fetch pesticides by type");
    }
  }

  // GET recent pesticide applications
  async findRecentPesticideApplications(limit = 10) {
    try {
      const result = await this.client.query(
        `SELECT p.*, u.names as user_name, c.c_name as crop_name
                 FROM pesticides p
                 LEFT JOIN users u ON p.user_id = u.user_id
                 LEFT JOIN crops c ON p.crop_id = c.c_id
                 ORDER BY p.applied_at DESC
                 LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.log("Find recent pesticide applications error:", error);
      throw new Error("Failed to fetch recent pesticide applications");
    }
  }

  // GET total pesticide usage statistics
  async getPesticideStatistics() {
    try {
      const result = await this.client.query(`
                SELECT 
                    COUNT(*) as total_applications,
                    SUM(size) as total_size_used,
                    AVG(size) as avg_size_per_application,
                    pesticide_type,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT crop_id) as unique_crops
                FROM pesticides
                GROUP BY pesticide_type
                ORDER BY total_size_used DESC
            `);
      return result.rows;
    } catch (error) {
      console.log("Get pesticide statistics error:", error);
      throw new Error("Failed to fetch pesticide statistics");
    }
  }

  // GET pesticide usage by user
  async getPesticideUsageByUser() {
    try {
      const result = await this.client.query(`
                SELECT 
                    u.user_id,
                    u.names as user_name,
                    u.email as user_email,
                    COUNT(p.p_id) as total_applications,
                    SUM(p.size) as total_size_used,
                    COUNT(DISTINCT p.pesticide_type) as unique_pesticide_types
                FROM pesticides p
                LEFT JOIN users u ON p.user_id = u.user_id
                GROUP BY u.user_id, u.names, u.email
                ORDER BY total_size_used DESC
            `);
      return result.rows;
    } catch (error) {
      console.log("Get pesticide usage by user error:", error);
      throw new Error("Failed to fetch pesticide usage by user");
    }
  }

  // GET pesticide usage by crop
  async getPesticideUsageByCrop() {
    try {
      const result = await this.client.query(`
                SELECT 
                    c.c_id,
                    c.c_name as crop_name,
                    COUNT(p.p_id) as total_applications,
                    SUM(p.size) as total_size_used,
                    COUNT(DISTINCT p.pesticide_type) as unique_pesticide_types
                FROM pesticides p
                LEFT JOIN crops c ON p.crop_id = c.c_id
                GROUP BY c.c_id, c.c_name
                ORDER BY total_size_used DESC
            `);
      return result.rows;
    } catch (error) {
      console.log("Get pesticide usage by crop error:", error);
      throw new Error("Failed to fetch pesticide usage by crop");
    }
  }
}
