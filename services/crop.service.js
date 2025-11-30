import client from "../config/db.js";

export class CropService {
    // CREATE crop
    async createCrop(cropData) {
        console.log(cropData);
        
        try {
            const result = await client.query(
                `INSERT INTO crops (c_name, c_type, exp_harvest, planted_at, harvest_income, 
                 harvest_size, total_profit, crop_photo_url, exp_harvest_size, user_id, field_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                 RETURNING *`,
                [
                    cropData.c_name,
                    cropData.c_type,
                    cropData.exp_harvest,
                    cropData.planted_at || new Date(),
                    cropData.harvest_income,
                    cropData.harvest_size,
                    cropData.total_profit,
                    cropData.crop_photo_url,
                    cropData.exp_harvest_size,
                    cropData.user_id,
                    cropData.field_id,
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Create crop error:", error);
            throw new Error("Failed to create crop");
        }
    }

    // READ crop by ID
    async findCropById(id) {
        try {
            const result = await client.query(
                `SELECT c.*, 
                 u.names as farmer_name, u.email as farmer_email,
                 f.f_name as field_name, f.soil_type as field_soil_type
                 FROM crops c
                 LEFT JOIN users u ON c.user_id = u.user_id
                 LEFT JOIN fields f ON c.field_id = f.f_id
                 WHERE c.c_id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error("Find crop by ID error:", error);
            throw new Error("Failed to fetch crop by ID");
        }
    }

    // READ all crops with optional filters
    async findAllCrops(filters = {}) {
        try {
            let query = `
                SELECT c.*, 
                 u.names as farmer_name,
                 f.f_name as field_name
                FROM crops c
                LEFT JOIN users u ON c.user_id = u.user_id
                LEFT JOIN fields f ON c.field_id = f.f_id
            `;
            const conditions = [];
            const values = [];
            let paramCount = 0;

            if (filters.user_id) {
                paramCount++;
                conditions.push(`c.user_id = $${paramCount}`);
                values.push(filters.user_id);
            }

            if (filters.field_id) {
                paramCount++;
                conditions.push(`c.field_id = $${paramCount}`);
                values.push(filters.field_id);
            }

            if (filters.c_type) {
                paramCount++;
                conditions.push(`c.c_type = $${paramCount}`);
                values.push(filters.c_type);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY c.planted_at DESC`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error("Find all crops error:", error);
            throw new Error("Failed to fetch crops");
        }
    }

    // UPDATE crop
    async updateCrop(id, updates) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 0;

            const allowedFields = ['c_name', 'c_type', 'exp_harvest', 'harvest_income', 
                                 'harvest_size', 'total_profit', 'crop_photo_url', 
                                 'exp_harvest_size', 'user_id', 'field_id'];
            
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
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);

            const result = await client.query(
                `UPDATE crops 
                 SET ${updateFields.join(', ')}
                 WHERE c_id = $${paramCount}
                 RETURNING *`,
                values
            );

            return result.rows[0] || null;
        } catch (error) {
            console.error("Update crop error:", error);
            throw new Error("Failed to update crop");
        }
    }

    // DELETE crop
    async deleteCrop(id) {
        try {
            const result = await client.query(
                `DELETE FROM crops WHERE c_id = $1 RETURNING c_id`,
                [id]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error("Delete crop error:", error);
            throw new Error("Failed to delete crop");
        }
    }

    // GET crops by user ID
    async findCropsByUserId(userId) {
        try {
            const result = await client.query(
                `SELECT c.*, f.f_name as field_name
                 FROM crops c
                 LEFT JOIN fields f ON c.field_id = f.f_id
                 WHERE c.user_id = $1
                 ORDER BY c.planted_at DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error("Find crops by user ID error:", error);
            throw new Error("Failed to fetch crops by user");
        }
    }

    // GET crops by field ID
    async findCropsByFieldId(fieldId) {
        try {
            const result = await client.query(
                `SELECT c.*, u.names as farmer_name
                 FROM crops c
                 LEFT JOIN users u ON c.user_id = u.user_id
                 WHERE c.field_id = $1
                 ORDER BY c.planted_at DESC`,
                [fieldId]
            );
            return result.rows;
        } catch (error) {
            console.error("Find crops by field ID error:", error);
            throw new Error("Failed to fetch crops by field");
        }
    }

    // GET upcoming harvests
    async findUpcomingHarvests(days = 7) {
        try {
            const result = await client.query(
                `SELECT c.*, u.names as farmer_name, f.f_name as field_name
                 FROM crops c
                 LEFT JOIN users u ON c.user_id = u.user_id
                 LEFT JOIN fields f ON c.field_id = f.f_id
                 WHERE c.exp_harvest BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
                 ORDER BY c.exp_harvest ASC`
            );
            return result.rows;
        } catch (error) {
            console.error("Find upcoming harvests error:", error);
            throw new Error("Failed to fetch upcoming harvests");
        }
    }

    // ADD pesticide application
    async addPesticideApplication(cropId, pesticideId, quantityUsed) {
        try {
            const result = await client.query(
                `INSERT INTO crop_pesticides (crop_id, pesticide_id, quantity_used)
                 VALUES ($1, $2, $3)
                 RETURNING *`,
                [cropId, pesticideId, quantityUsed]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Add pesticide application error:", error);
            throw new Error("Failed to add pesticide application");
        }
    }

    // GET pesticide applications for crop
    async getPesticideApplications(cropId) {
        try {
            const result = await client.query(
                `SELECT cp.*, p.p_name, p.pesticide_type
                 FROM crop_pesticides cp
                 LEFT JOIN pesticides p ON cp.pesticide_id = p.p_id
                 WHERE cp.crop_id = $1
                 ORDER BY cp.application_date DESC`,
                [cropId]
            );
            return result.rows;
        } catch (error) {
            console.error("Get pesticide applications error:", error);
            throw new Error("Failed to fetch pesticide applications");
        }
    }

    // CALCULATE total profit for crop
    async calculateCropProfit(cropId) {
        try {
            const result = await client.query(
                `UPDATE crops 
                 SET total_profit = harvest_income - (
                     SELECT COALESCE(SUM(p.cost * cp.quantity_used), 0)
                     FROM crop_pesticides cp
                     LEFT JOIN pesticides p ON cp.pesticide_id = p.p_id
                     WHERE cp.crop_id = $1
                 )
                 WHERE c_id = $1
                 RETURNING total_profit`,
                [cropId]
            );
            return result.rows[0]?.total_profit;
        } catch (error) {
            console.error("Calculate crop profit error:", error);
            throw new Error("Failed to calculate crop profit");
        }
    }
}
