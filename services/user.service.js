import client from "../config/db.js";

export class UserService {
  // CREATE user with address
  async createUser(userData, addressData = null) {
    try {
      await client.query("BEGIN");

      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (names, email, password, phone, gender, role, is_active, photo_url)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING user_id, names, email, phone, gender, role, is_active, photo_url, created_date, updated_date`,
        [
          userData.names,
          userData.email,
          userData.password,
          userData.phone,
          userData.gender,
          userData.role || "farmer",
          userData.is_active !== undefined ? userData.is_active : true,
          userData.url
        ]
      );

      const newUser = userResult.rows[0];

      console.log(addressData);
      
      
      // Insert address if provided
      if (addressData) {
        await client.query(
          `INSERT INTO user_addresses (user_id, street_address, suburb, city, province, country)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            newUser.user_id,
            addressData.street_address,
            addressData.suburb,
            addressData.city,
            addressData.province,
            addressData.country || "South Africa",
          ]
        );
      }

      await client.query("COMMIT");

      // Return user with address
      return await this.findUserById(newUser.user_id);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Create user error:", error);
      throw new Error("Failed to create user");
    }
  }

  // READ user by email
  async findUserByEmail(email) {
    try {
      const result = await client.query(
        `SELECT u.*, ua.street_address, ua.suburb, ua.city, ua.province, ua.country
                 FROM users u
                 LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
                 WHERE u.email = $1`,
        [email]
      );      

      if (result.rows.length === 0) return null;

      return this.formatUserWithAddress(result.rows[0]);
    } catch (error) {
      console.error("Find user by email error:", error);
      throw new Error("Failed to fetch user by email");
    }
  }

  // READ user by ID
  async findUserById(id) {
    try {
      const result = await client.query(
        `SELECT u.*, ua.street_address, ua.suburb, ua.city, ua.province, ua.country
                 FROM users u
                 LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
                 WHERE u.user_id = $1`,
        [id]
      );

      if (result.rows.length === 0) return null;

      return this.formatUserWithAddress(result.rows[0]);
    } catch (error) {
      console.error("Find user by ID error:", error);
      throw new Error("Failed to fetch user by ID");
    }
  }

  // READ all users with optional filters
  async findAllUsers(filters = {}) {
    try {
      let query = `
                SELECT u.*, ua.street_address, ua.suburb, ua.city, ua.province, ua.country
                FROM users u
                LEFT JOIN user_addresses ua ON u.user_id = ua.user_id
            `;

      const conditions = [];
      const values = [];
      let paramCount = 0;

      // Add filters
      if (filters.role) {
        paramCount++;
        conditions.push(`u.role = $${paramCount}`);
        values.push(filters.role);
      }

      if (filters.is_active !== undefined) {
        paramCount++;
        conditions.push(`u.is_active = $${paramCount}`);
        values.push(filters.is_active);
      }

      if (filters.gender) {
        paramCount++;
        conditions.push(`u.gender = $${paramCount}`);
        values.push(filters.gender);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }

      query += ` ORDER BY u.created_date DESC`;

      const result = await client.query(query, values);

      return result.rows.map((row) => this.formatUserWithAddress(row));
    } catch (error) {
      console.error("Find all users error:", error);
      throw new Error("Failed to fetch users");
    }
  }

  // Check phone exists
  async checkPhoneExists(phone) {
    try {
      const { rows } = await client.query(
        `SELECT EXISTS(SELECT 1 FROM users WHERE phone = $1) AS "exists"`,
        [phone]
      );

      // rows[0].exists will be true or false
      return rows[0].exists;
    } catch (error) {
      console.error("Check phone exists error:", error);
      throw new Error("Failed to check phone exists");
    }
  }

  // UPDATE user
  async updateUser(id, updates) {
    try {
      await client.query("BEGIN");

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      const allowedFields = [
        "names",
        "email",
        "password",
        "phone",
        "gender",
        "role",
        "is_active",
      ];

      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          updateFields.push(`"${key}" = $${paramCount}`);
          values.push(value);
        }
      }

      // Always update the updated_date
      paramCount++;
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length === 0) {
        throw new Error("No valid fields to update");
      }

      paramCount++;
      values.push(id);

      const userResult = await client.query(
        `UPDATE users 
                 SET ${updateFields.join(", ")}
                 WHERE user_id = $${paramCount}
                 RETURNING user_id, names, email, phone, gender, role, is_active, created_date, updated_date`,
        values
      );

      if (userResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      await client.query("COMMIT");

      // Return updated user with address
      return await this.findUserById(id);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Update user error:", error);
      throw new Error("Failed to update user");
    }
  }

  // UPDATE user address
  async updateUserAddress(userId, addressData) {
    try {
      // Check if address exists
      const existingAddress = await client.query(
        "SELECT id FROM user_addresses WHERE userId = $1",
        [userId]
      );

      if (existingAddress.rows.length > 0) {
        // Update existing address
        await client.query(
          `UPDATE user_addresses 
                     SET street_address = $1, suburb = $2, city = $3, province = $4, country = $5
                     WHERE userId = $6`,
          [
            addressData.streetAddress,
            addressData.suburb,
            addressData.city,
            addressData.province,
            addressData.country,
            userId,
          ]
        );
      } else {
        // Insert new address
        await client.query(
          `INSERT INTO user_addresses (userId, street_address, suburb, city, province, country)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            addressData.streetAddress,
            addressData.suburb,
            addressData.city,
            addressData.province,
            addressData.country || "South Africa",
          ]
        );
      }

      return await this.findUserById(userId);
    } catch (error) {
      console.error("Update user address error:", error);
      throw new Error("Failed to update user address");
    }
  }

  // DELETE user
  async deleteUser(id) {
    try {
      await client.query("BEGIN");

      // Delete address first (due to foreign key constraint)
      await client.query("DELETE FROM user_addresses WHERE user_id = $1", [id]);

      // Delete user
      const result = await client.query(
        "DELETE FROM users WHERE user_id = $1 RETURNING user_id",
        [id]
      );

      await client.query("COMMIT");

      return result.rows.length > 0;
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Delete user error:", error);
      throw new Error("Failed to delete user");
    }
  }

  // DEACTIVATE user (soft delete)
  async deactivateUser(id) {
    try {
      const result = await client.query(
        `UPDATE users 
                 SET is_active = false, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1
                 RETURNING user_id, names, email, is_active`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Deactivate user error:", error);
      throw new Error("Failed to deactivate user");
    }
  }

  // ACTIVATE user
  async activateUser(id) {
    try {
      const result = await client.query(
        `UPDATE users 
                 SET is_active = true, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = $1
                 RETURNING user_id, names, email, is_active`,
        [id]
      );

      return result.rows[0] || null;
    } catch (error) {
      console.error("Activate user error:", error);
      throw new Error("Failed to activate user");
    }
  }

  // COUNT users by role
  async countUsersByRole() {
    try {
      const result = await client.query(
        `SELECT role, COUNT(*) as count
                 FROM users
                 WHERE is_active = true
                 GROUP BY role
                 ORDER BY role`
      );

      return result.rows;
    } catch (error) {
      console.error("Count users by role error:", error);
      throw new Error("Failed to count users by role");
    }
  }

  // Helper method to format user with address
  formatUserWithAddress(row) {
    const user = {
      user_id: row.user_id,
      names: row.names,
      email: row.email,
      password: row.password,
      phone: row.phone,
      gender: row.gender,
      role: row.role,
      is_active: row.is_active,
      photo_url: row.photo_url,
      created_date: row.created_date,
      updated_date: row.updated_date,
    };

    // Add address fields if they exist
    if (row.street_address) {
      user.address = {
        street_address: row.street_address,
        suburb: row.suburb,
        city: row.city,
        province: row.province,
        country: row.country,
      };
    }

    return user;
  }

  // Search users by name or email
  async searchUsers(searchTerm, filters = {}) {
    try {
      let query = `
                SELECT u.*, ua.street_address, ua.suburb, ua.city, ua.province, ua.country
                FROM users u
                LEFT JOIN user_addresses ua ON u.user_id = ua.userId
                WHERE (u.names ILIKE $1 OR u.email ILIKE $1)
            `;

      const values = [`%${searchTerm}%`];
      let paramCount = 1;

      // Add additional filters
      if (filters.role) {
        paramCount++;
        query += ` AND u.role = $${paramCount}`;
        values.push(filters.role);
      }

      if (filters.is_active !== undefined) {
        paramCount++;
        query += ` AND u.is_active = $${paramCount}`;
        values.push(filters.is_active);
      }

      query += ` ORDER BY u.created_date DESC`;

      const result = await client.query(query, values);

      return result.rows.map((row) => this.formatUserWithAddress(row));
    } catch (error) {
      console.error("Search users error:", error);
      throw new Error("Failed to search users");
    }
  }

  async getAdminUserIds() {
    try {
      const { rows } = await client.query(
        `SELECT user_id FROM users WHERE role = $1`,
        ["admin"]
      );
      return rows.map((row) => row.user_id);
    } catch (error) {
      console.error("Error fetching admin user IDs:", error);
      throw new Error("Failed to fetch admin user IDs");
    }
  }
}
