import client from "../config/db.js";

export class FieldService {
    // CREATE field
    async createField(fieldData) {
         if (!fieldData.field_photo_url) {
            throw new Error("Field photo URL is required");
        }

        try {
            const result = await client.query(
                `INSERT INTO fields (f_name, soil_type, max_farmers, area, perimeter, is_available, field_photo_url, last_harvest_date)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING f_id, f_name, soil_type, max_farmers, area, perimeter, is_available, field_photo_url, last_harvest_date, created_date, updated_date`,
                [
                    fieldData.f_name,
                    fieldData.soil_type,
                    fieldData.max_farmers,
                    fieldData.area,
                    fieldData.perimeter,
                    fieldData.is_available !== undefined ? fieldData.is_available : true,
                    fieldData.field_photo_url,
                    fieldData.last_harvest_date
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Create field error:", error);
            throw new Error("Failed to create field");
        }
    }

    // READ field by ID
    async findFieldById(id) {
        try {
            const result = await client.query(
                `SELECT * FROM fields WHERE f_id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error("Find field by ID error:", error);
            throw new Error("Failed to fetch field by ID");
        }
    }

    // READ all fields with optional filters
    async findAllFields(filters = {}) {
        try {
            let query = `SELECT * FROM fields`;
            const conditions = [];
            const values = [];
            let paramCount = 0;

            if (filters.is_available !== undefined) {
                paramCount++;
                conditions.push(`is_available = $${paramCount}`);
                values.push(filters.is_available);
            }

            if (filters.soil_type) {
                paramCount++;
                conditions.push(`soil_type = $${paramCount}`);
                values.push(filters.soil_type);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY created_date DESC`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error("Find all fields error:", error);
            throw new Error("Failed to fetch fields");
        }
    }

    // UPDATE field
    async updateField(id, updates) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 0;

            const allowedFields = ['f_name', 'soil_type', 'max_farmers', 'area', 'perimeter', 'is_available', 'field_photo_url', 'last_harvest_date'];
            
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

            const result = await client.query(
                `UPDATE fields 
                 SET ${updateFields.join(', ')}
                 WHERE f_id = $${paramCount}
                 RETURNING f_id, f_name, soil_type, max_farmers, area, perimeter, is_available, field_photo_url, last_harvest_date, created_date, updated_date`,
                values
            );

            return result.rows[0] || null;
        } catch (error) {
            console.error("Update field error:", error);
            throw new Error("Failed to update field");
        }
    }

    // DELETE field
    async deleteField(id) {
        try {
            const result = await client.query(
                `DELETE FROM fields WHERE f_id = $1 RETURNING f_id`,
                [id]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error("Delete field error:", error);
            throw new Error("Failed to delete field");
        }
    }

    // GET available fields
    async findAvailableFields() {
        try {
            const result = await client.query(
                `SELECT * FROM fields WHERE is_available = true ORDER BY f_name`
            );
            return result.rows;
        } catch (error) {
            console.error("Find available fields error:", error);
            throw new Error("Failed to fetch available fields");
        }
    }

    // GET fields by soil type
    async findFieldsBySoilType(soilType) {
        try {
            const result = await client.query(
                `SELECT * FROM fields WHERE soil_type = $1 ORDER BY f_name`,
                [soilType]
            );
            return result.rows;
        } catch (error) {
            console.error("Find fields by soil type error:", error);
            throw new Error("Failed to fetch fields by soil type");
        }
    }

    // UPDATE field availability
    async updateFieldAvailability(id, isAvailable) {
        try {
            const result = await client.query(
                `UPDATE fields 
                 SET is_available = $1, updated_date = CURRENT_TIMESTAMP
                 WHERE f_id = $2
                 RETURNING f_id, f_name, is_available`,
                [isAvailable, id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error("Update field availability error:", error);
            throw new Error("Failed to update field availability");
        }
    }

    // COUNT fields by soil type
    async countFieldsBySoilType() {
        try {
            const result = await client.query(
                `SELECT soil_type, COUNT(*) as count, 
                        SUM(area) as total_area,
                        AVG(area) as avg_area
                 FROM fields 
                 WHERE is_available = true
                 GROUP BY soil_type
                 ORDER BY soil_type`
            );
            return result.rows;
        } catch (error) {
            console.error("Count fields by soil type error:", error);
            throw new Error("Failed to count fields by soil type");
        }
    }
}