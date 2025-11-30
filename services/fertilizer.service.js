import client from "../config/db.js";

export class FertilizerService {
    constructor() {
        this.client = client;
    }

    // CREATE fertilizer
    async createFertilizer(fertilizerData) {
        try {
            const result = await this.client.query(
                `INSERT INTO fertilizers (fert_name, npk_ratio, size_kg, description, 
                 manufacturer, application_rate, expiration_date)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING *`,
                [
                    fertilizerData.fert_name,
                    fertilizerData.npk_ratio,
                    fertilizerData.size_kg,
                    fertilizerData.description,
                    fertilizerData.manufacturer,
                    fertilizerData.application_rate,
                    fertilizerData.expiration_date,
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.log("Create fertilizer error:", error);
            throw new Error("Failed to create fertilizer");
        }
    }

    // READ fertilizer by ID
    async findFertilizerById(id) {
        try {
            const result = await this.client.query(
                `SELECT f.*, 
                 c.c_name as crop_name,
                 fi.f_name as field_name
                 FROM fertilizers f
                 LEFT JOIN crops c ON f.crop_id = c.c_id
                 LEFT JOIN fields fi ON f.field_id = fi.f_id
                 WHERE f.fert_id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.log("Find fertilizer by ID error:", error);
            throw new Error("Failed to fetch fertilizer by ID");
        }
    }

    // READ all fertilizers with optional filters
    async findAllFertilizers(filters = {}) {
        try {
            let query = `SELECT f.* FROM fertilizers f`;
            const conditions = [];
            const values = [];
            let paramCount = 0;

            if (filters.crop_id) {
                paramCount++;
                conditions.push(`f.crop_id = $${paramCount}`);
                values.push(filters.crop_id);
            }

            if (filters.field_id) {
                paramCount++;
                conditions.push(`f.field_id = $${paramCount}`);
                values.push(filters.field_id);
            }

            if (filters.manufacturer) {
                paramCount++;
                conditions.push(`f.manufacturer = $${paramCount}`);
                values.push(filters.manufacturer);
            }

            if (filters.npk_ratio) {
                paramCount++;
                conditions.push(`f.npk_ratio = $${paramCount}`);
                values.push(filters.npk_ratio);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            const result = await this.client.query(query, values);
            return result.rows;
        } catch (error) {
            console.log("Find all fertilizers error:", error);
            throw new Error("Failed to fetch fertilizers");
        }
    }

    // UPDATE fertilizer
    async updateFertilizer(id, updates) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 0;

            const allowedFields = ['fert_name', 'applied_at', 'npk_ratio', 'size_kg', 'description', 
                                 'manufacturer', 'application_rate', 'expiration_date', 'crop_id', 'field_id'];
            
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
            updateFields.push('updated_date = CURRENT_TIMESTAMP');
            values.push(id);

            const result = await this.client.query(
                `UPDATE fertilizers 
                 SET ${updateFields.join(', ')}
                 WHERE fert_id = $${paramCount}
                 RETURNING *`,
                values
            );

            return result.rows[0] || null;
        } catch (error) {
            console.log("Update fertilizer error:", error);
            throw new Error("Failed to update fertilizer");
        }
    }

    // DELETE fertilizer
    async deleteFertilizer(id) {
        try {
            const result = await this.client.query(
                `DELETE FROM fertilizers WHERE fert_id = $1 RETURNING fert_id`,
                [id]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.log("Delete fertilizer error:", error);
            throw new Error("Failed to delete fertilizer");
        }
    }

    // GET fertilizers by crop ID
    async findFertilizersByCropId(cropId) {
        try {
            const result = await this.client.query(
                `SELECT f.* 
                 FROM fertilizers f
                 WHERE f.crop_id = $1
                 ORDER BY f.applied_at DESC`,
                [cropId]
            );
            return result.rows;
        } catch (error) {
            console.log("Find fertilizers by crop ID error:", error);
            throw new Error("Failed to fetch fertilizers by crop");
        }
    }

    // GET fertilizers by field ID
    async findFertilizersByFieldId(fieldId) {
        try {
            const result = await this.client.query(
                `SELECT f.*, c.c_name as crop_name
                 FROM fertilizers f
                 LEFT JOIN crops c ON f.crop_id = c.c_id
                 WHERE f.field_id = $1
                 ORDER BY f.applied_at DESC`,
                [fieldId]
            );
            return result.rows;
        } catch (error) {
            console.log("Find fertilizers by field ID error:", error);
            throw new Error("Failed to fetch fertilizers by field");
        }
    }

    // GET fertilizers by manufacturer
    async findFertilizersByManufacturer(manufacturer) {
        try {
            const result = await this.client.query(
                `SELECT f.* 
                 FROM fertilizers f
                 WHERE f.manufacturer = $1
                 ORDER BY f.fert_name`,
                [manufacturer]
            );
            return result.rows;
        } catch (error) {
            console.log("Find fertilizers by manufacturer error:", error);
            throw new Error("Failed to fetch fertilizers by manufacturer");
        }
    }

    // GET expired fertilizers
    async findExpiredFertilizers() {
        try {
            const result = await this.client.query(
                `SELECT f.* 
                 FROM fertilizers f
                 WHERE f.expiration_date < NOW()
                 ORDER BY f.expiration_date DESC`
            );
            return result.rows;
        } catch (error) {
            console.log("Find expired fertilizers error:", error);
            throw new Error("Failed to fetch expired fertilizers");
        }
    }

    // GET fertilizers expiring soon
    async findFertilizersExpiringSoon(days = 30) {
        try {
            const result = await this.client.query(
                `SELECT f.* 
                 FROM fertilizers f
                 WHERE f.expiration_date BETWEEN NOW() AND NOW() + INTERVAL '${days} days'
                 ORDER BY f.expiration_date ASC`
            );
            return result.rows;
        } catch (error) {
            console.log("Find fertilizers expiring soon error:", error);
            throw new Error("Failed to fetch fertilizers expiring soon");
        }
    }

    // GET total fertilizer usage statistics
    async getFertilizerStatistics() {
        try {
            const result = await this.client.query(`
                SELECT 
                    COUNT(*) as total_fertilizers,
                    SUM(size_kg) as total_kg_used,
                    AVG(size_kg) as avg_kg_per_application,
                    manufacturer,
                    npk_ratio,
                    COUNT(*) FILTER (WHERE expiration_date < NOW()) as expired_count
                FROM fertilizers
                GROUP BY manufacturer, npk_ratio
                ORDER BY total_kg_used DESC
            `);
            return result.rows;
        } catch (error) {
            console.log("Get fertilizer statistics error:", error);
            throw new Error("Failed to fetch fertilizer statistics");
        }
    }

    // GET recent fertilizer applications
    async findRecentFertilizerApplications(limit = 10) {
        try {
            const result = await this.client.query(
                `SELECT f.*, c.c_name as crop_name, fi.f_name as field_name
                 FROM fertilizers f
                 LEFT JOIN crops c ON f.crop_id = c.c_id
                 LEFT JOIN fields fi ON f.field_id = fi.f_id
                 ORDER BY f.applied_at DESC
                 LIMIT $1`,
                [limit]
            );
            return result.rows;
        } catch (error) {
            console.log("Find recent fertilizer applications error:", error);
            throw new Error("Failed to fetch recent fertilizer applications");
        }
    }

    async assignFertilizerToCrops(assignmentData) {
        try {
            const { fert_id, crop_ids, quantity_used } = assignmentData;
            const results = [];

            for (const crop_id of crop_ids) {
                // Check if assignment already exists
                const existing = await this.client.query(
                    `SELECT * FROM crop_fertilizers 
                     WHERE crop_id = $1 AND fert_id = $2`,
                    [crop_id, fert_id]
                );

                if (existing.rows.length > 0) {
                    // Update existing assignment
                    const result = await this.client.query(
                        `UPDATE crop_fertilizers 
                         SET quantity_used = $1, updated_at = CURRENT_TIMESTAMP
                         WHERE crop_id = $2 AND fert_id = $3
                         RETURNING *`,
                        [quantity_used[crop_id], crop_id, fert_id]
                    );
                    results.push(result.rows[0]);
                } else {
                    // Create new assignment
                    const result = await this.client.query(
                        `INSERT INTO crop_fertilizers (crop_id, fert_id, quantity_used)
                         VALUES ($1, $2, $3)
                         RETURNING *`,
                        [crop_id, fert_id, quantity_used[crop_id]]
                    );
                    results.push(result.rows[0]);
                }
            }

            return results;
        } catch (error) {
            console.log("Assign fertilizer to crops error:", error);
            throw new Error("Failed to assign fertilizer to crops");
        }
    }

    // GET fertilizers for a specific crop
    async findFertilizersByCropId(cropId) {
        try {
            const result = await this.client.query(
                `SELECT f.*, cf.quantity_used, cf.applied_at
                 FROM fertilizers f
                 INNER JOIN crop_fertilizers cf ON f.fert_id = cf.fert_id
                 WHERE cf.crop_id = $1
                 ORDER BY cf.applied_at DESC`,
                [cropId]
            );
            return result.rows;
        } catch (error) {
            console.log("Find fertilizers by crop ID error:", error);
            throw new Error("Failed to fetch fertilizers by crop");
        }
    }

    // GET all crop-fertilizer assignments
    async findAllCropFertilizerAssignments() {
        try {
            const result = await this.client.query(`
                SELECT cf.*, 
                       c.c_name, c.c_type, c.field_name,
                       f.fert_name, f.npk_ratio, f.manufacturer
                FROM crop_fertilizers cf
                INNER JOIN crops c ON cf.crop_id = c.c_id
                INNER JOIN fertilizers f ON cf.fert_id = f.fert_id
                ORDER BY cf.applied_at DESC
            `);
            return result.rows;
        } catch (error) {
            console.log("Find all crop-fertilizer assignments error:", error);
            throw new Error("Failed to fetch crop-fertilizer assignments");
        }
    }

    // DELETE crop-fertilizer assignment
    async deleteCropFertilizerAssignment(cropId, fertId) {
        try {
            const result = await this.client.query(
                `DELETE FROM crop_fertilizers 
                 WHERE crop_id = $1 AND fert_id = $2 
                 RETURNING id`,
                [cropId, fertId]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.log("Delete crop-fertilizer assignment error:", error);
            throw new Error("Failed to delete crop-fertilizer assignment");
        }
    }
}