import client from "../config/db.js";

export class ReportService {
    // CREATE report
    async createReport(reportData) {
        try {
            const result = await client.query(
                `INSERT INTO reports (user_id, field_id, crop_id, stage, soil_moisture, 
                 soil_condition_notes, pest_outbreak, photo_url, soil_nutrients_level, 
                 crop_duration_days, report_summary, date_issued)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 RETURNING *`,
                [
                    reportData.user_id,
                    reportData.field_id,
                    reportData.crop_id,
                    reportData.stage,
                    reportData.soil_moisture,
                    reportData.soil_condition_notes,
                    reportData.pest_outbreak || false,
                    reportData.photo_url,
                    reportData.soil_nutrients_level,
                    reportData.crop_duration_days,
                    reportData.report_summary,
                    reportData.date_issued || new Date()
                ]
            );
            return result.rows[0];
        } catch (error) {
            console.error("Create report error:", error);
            throw new Error("Failed to create report");
        }
    }

    // READ report by ID
    async findReportById(id) {
        try {
            const result = await client.query(
                `SELECT r.*, 
                 u.names as user_name, u.email as user_email,
                 f.f_name as field_name, f.soil_type as field_soil_type,
                 c.c_name as crop_name, c.c_type as crop_type
                 FROM reports r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN fields f ON r.field_id = f.f_id
                 LEFT JOIN crops c ON r.crop_id = c.c_id
                 WHERE r.r_id = $1`,
                [id]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error("Find report by ID error:", error);
            throw new Error("Failed to fetch report by ID");
        }
    }

    // READ all reports with optional filters
    async findAllReports(filters = {}) {
        try {
            let query = `
                SELECT r.*, 
                 u.names as user_name,
                 f.f_name as field_name,
                 c.c_name as crop_name
                FROM reports r
                LEFT JOIN users u ON r.user_id = u.user_id
                LEFT JOIN fields f ON r.field_id = f.f_id
                LEFT JOIN crops c ON r.crop_id = c.c_id
            `;
            const conditions = [];
            const values = [];
            let paramCount = 0;

            if (filters.user_id) {
                paramCount++;
                conditions.push(`r.user_id = $${paramCount}`);
                values.push(filters.user_id);
            }

            if (filters.field_id) {
                paramCount++;
                conditions.push(`r.field_id = $${paramCount}`);
                values.push(filters.field_id);
            }

            if (filters.crop_id) {
                paramCount++;
                conditions.push(`r.crop_id = $${paramCount}`);
                values.push(filters.crop_id);
            }

            if (filters.stage) {
                paramCount++;
                conditions.push(`r.stage = $${paramCount}`);
                values.push(filters.stage);
            }

            if (filters.pest_outbreak !== undefined) {
                paramCount++;
                conditions.push(`r.pest_outbreak = $${paramCount}`);
                values.push(filters.pest_outbreak);
            }

            if (conditions.length > 0) {
                query += ` WHERE ${conditions.join(' AND ')}`;
            }

            query += ` ORDER BY r.date_issued DESC`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error("Find all reports error:", error);
            throw new Error("Failed to fetch reports");
        }
    }

    // UPDATE report
    async updateReport(id, updates) {
        try {
            const updateFields = [];
            const values = [];
            let paramCount = 0;

            const allowedFields = ['stage', 'soil_moisture', 'soil_condition_notes', 'pest_outbreak', 
                                 'photo_url', 'soil_nutrients_level', 'crop_duration_days', 'report_summary', 'date_issued'];
            
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
                `UPDATE reports 
                 SET ${updateFields.join(', ')}
                 WHERE r_id = $${paramCount}
                 RETURNING *`,
                values
            );

            return result.rows[0] || null;
        } catch (error) {
            console.error("Update report error:", error);
            throw new Error("Failed to update report");
        }
    }

    // DELETE report
    async deleteReport(id) {
        try {
            const result = await client.query(
                `DELETE FROM reports WHERE r_id = $1 RETURNING r_id`,
                [id]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error("Delete report error:", error);
            throw new Error("Failed to delete report");
        }
    }

    // GET reports by user ID
    async findReportsByUserId(userId) {
        try {
            const result = await client.query(
                `SELECT r.*, f.f_name as field_name, c.c_name as crop_name
                 FROM reports r
                 LEFT JOIN fields f ON r.field_id = f.f_id
                 LEFT JOIN crops c ON r.crop_id = c.c_id
                 WHERE r.user_id = $1
                 ORDER BY r.date_issued DESC`,
                [userId]
            );
            return result.rows;
        } catch (error) {
            console.error("Find reports by user ID error:", error);
            throw new Error("Failed to fetch reports by user");
        }
    }

    // GET reports by field ID
    async findReportsByFieldId(fieldId) {
        try {
            const result = await client.query(
                `SELECT r.*, u.names as user_name, c.c_name as crop_name
                 FROM reports r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN crops c ON r.crop_id = c.c_id
                 WHERE r.field_id = $1
                 ORDER BY r.date_issued DESC`,
                [fieldId]
            );
            return result.rows;
        } catch (error) {
            console.error("Find reports by field ID error:", error);
            throw new Error("Failed to fetch reports by field");
        }
    }

    // GET reports by crop ID
    async findReportsByCropId(cropId) {
        try {
            const result = await client.query(
                `SELECT r.*, u.names as user_name, f.f_name as field_name
                 FROM reports r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN fields f ON r.field_id = f.f_id
                 WHERE r.crop_id = $1
                 ORDER BY r.date_issued DESC`,
                [cropId]
            );
            return result.rows;
        } catch (error) {
            console.error("Find reports by crop ID error:", error);
            throw new Error("Failed to fetch reports by crop");
        }
    }

    // GET reports by stage
    async findReportsByStage(stage) {
        try {
            const result = await client.query(
                `SELECT r.*, u.names as user_name, f.f_name as field_name, c.c_name as crop_name
                 FROM reports r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN fields f ON r.field_id = f.f_id
                 LEFT JOIN crops c ON r.crop_id = c.c_id
                 WHERE r.stage = $1
                 ORDER BY r.date_issued DESC`,
                [stage]
            );
            return result.rows;
        } catch (error) {
            console.error("Find reports by stage error:", error);
            throw new Error("Failed to fetch reports by stage");
        }
    }

    // GET reports with pest outbreaks
    async findPestOutbreakReports() {
        try {
            const result = await client.query(
                `SELECT r.*, u.names as user_name, f.f_name as field_name, c.c_name as crop_name
                 FROM reports r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN fields f ON r.field_id = f.f_id
                 LEFT JOIN crops c ON r.crop_id = c.c_id
                 WHERE r.pest_outbreak = true
                 ORDER BY r.date_issued DESC`
            );
            return result.rows;
        } catch (error) {
            console.error("Find pest outbreak reports error:", error);
            throw new Error("Failed to fetch pest outbreak reports");
        }
    }

    // GET reports by date range
    async findReportsByDateRange(startDate, endDate, filters = {}) {
        try {
            let query = `
                SELECT r.*, u.names as user_name, f.f_name as field_name, c.c_name as crop_name
                FROM reports r
                LEFT JOIN users u ON r.user_id = u.user_id
                LEFT JOIN fields f ON r.field_id = f.f_id
                LEFT JOIN crops c ON r.crop_id = c.c_id
                WHERE r.date_issued BETWEEN $1 AND $2
            `;
            const values = [startDate, endDate];
            let paramCount = 2;

            if (filters.user_id) {
                paramCount++;
                query += ` AND r.user_id = $${paramCount}`;
                values.push(filters.user_id);
            }

            if (filters.stage) {
                paramCount++;
                query += ` AND r.stage = $${paramCount}`;
                values.push(filters.stage);
            }

            query += ` ORDER BY r.date_issued DESC`;

            const result = await client.query(query, values);
            return result.rows;
        } catch (error) {
            console.error("Find reports by date range error:", error);
            throw new Error("Failed to fetch reports by date range");
        }
    }

    // GET report statistics
    async getReportStatistics() {
        try {
            const result = await client.query(`
                SELECT 
                    COUNT(*) as total_reports,
                    COUNT(*) FILTER (WHERE stage = 'Pre-Harvest') as pre_harvest_count,
                    COUNT(*) FILTER (WHERE stage = 'Post-Harvest') as post_harvest_count,
                    COUNT(*) FILTER (WHERE pest_outbreak = true) as pest_outbreak_count,
                    COUNT(DISTINCT user_id) as unique_users,
                    COUNT(DISTINCT field_id) as unique_fields,
                    COUNT(DISTINCT crop_id) as unique_crops,
                    AVG(soil_moisture) as avg_soil_moisture,
                    AVG(soil_nutrients_level) as avg_soil_nutrients
                FROM reports
            `);
            return result.rows[0];
        } catch (error) {
            console.error("Get report statistics error:", error);
            throw new Error("Failed to fetch report statistics");
        }
    }

    // GET latest report for a crop
    async findLatestCropReport(cropId) {
        try {
            const result = await client.query(
                `SELECT r.*, u.names as user_name, f.f_name as field_name
                 FROM reports r
                 LEFT JOIN users u ON r.user_id = u.user_id
                 LEFT JOIN fields f ON r.field_id = f.f_id
                 WHERE r.crop_id = $1
                 ORDER BY r.date_issued DESC
                 LIMIT 1`,
                [cropId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error("Find latest crop report error:", error);
            throw new Error("Failed to fetch latest crop report");
        }
    }
}