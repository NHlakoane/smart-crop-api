import { ReportService } from "../services/report.service.js";

export class ReportController {
    constructor() {
        this.reportService = new ReportService();
        this.createReport = this.createReport.bind(this);
        this.getReport = this.getReport.bind(this);
        this.getAllReports = this.getAllReports.bind(this);
        this.updateReport = this.updateReport.bind(this);
        this.deleteReport = this.deleteReport.bind(this);
        this.getUserReports = this.getUserReports.bind(this);
        this.getFieldReports = this.getFieldReports.bind(this);
        this.getCropReports = this.getCropReports.bind(this);
        this.getReportsByStage = this.getReportsByStage.bind(this);
        this.getPestOutbreakReports = this.getPestOutbreakReports.bind(this);
        this.getReportsByDateRange = this.getReportsByDateRange.bind(this);
        this.getReportStats = this.getReportStats.bind(this);
        this.getLatestCropReport = this.getLatestCropReport.bind(this);
    }

    async createReport(req, res) {
        try {
            const { user_id, field_id, crop_id, stage, soil_moisture, soil_condition_notes, 
                   pest_outbreak, photo_url, soil_nutrients_level, crop_duration_days, report_summary, date_issued } = req.body;

            if (!user_id || !field_id || !crop_id || !stage || !report_summary) {
                return res.status(400).json({
                    success: false,
                    message: "User ID, field ID, crop ID, stage, and report summary are required"
                });
            }

            if (!['Pre-Harvest', 'Post-Harvest'].includes(stage)) {
                return res.status(400).json({
                    success: false,
                    message: "Stage must be either 'Pre-Harvest' or 'Post-Harvest'"
                });
            }

            const reportData = {
                user_id,
                field_id,
                crop_id,
                stage,
                soil_moisture,
                soil_condition_notes,
                pest_outbreak,
                photo_url,
                soil_nutrients_level,
                crop_duration_days,
                report_summary,
                date_issued
            };

            const newReport = await this.reportService.createReport(reportData);

            return res.status(201).json({
                success: true,
                message: "Report created successfully",
                data: newReport
            });

        } catch (error) {
            console.error("Create report error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getReport(req, res) {
        try {
            const { id } = req.params;
            const report = await this.reportService.findReportById(parseInt(id));

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }

            // Check if user has access to this report
            if (req.user.user_id !== report.user_id && req.user.role !== 'admin' && req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }

            return res.status(200).json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error("Get report error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getAllReports(req, res) {
        try {
            const { user_id, field_id, crop_id, stage, pest_outbreak } = req.query;
            const filters = {};

            if (user_id) filters.user_id = parseInt(user_id);
            if (field_id) filters.field_id = parseInt(field_id);
            if (crop_id) filters.crop_id = parseInt(crop_id);
            if (stage) filters.stage = stage;
            if (pest_outbreak !== undefined) filters.pest_outbreak = pest_outbreak === 'true';

            const reports = await this.reportService.findAllReports(filters);

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get all reports error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async updateReport(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const report = await this.reportService.findReportById(parseInt(id));
            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }

            // Check if user has access to update this report
            if (req.user.user_id !== report.user_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }

            const updatedReport = await this.reportService.updateReport(parseInt(id), updates);

            return res.status(200).json({
                success: true,
                message: "Report updated successfully",
                data: updatedReport
            });

        } catch (error) {
            console.error("Update report error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async deleteReport(req, res) {
        try {
            const { id } = req.params;
            const report = await this.reportService.findReportById(parseInt(id));

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }

            // Only admin or report owner can delete
            if (req.user.user_id !== report.user_id && req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }

            const deleted = await this.reportService.deleteReport(parseInt(id));

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Report not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Report deleted successfully"
            });

        } catch (error) {
            console.error("Delete report error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getUserReports(req, res) {
        try {
            const { userId } = req.params;
            
            // Check if user is accessing their own reports or is admin/manager
            if (req.user.user_id !== parseInt(userId) && req.user.role !== 'admin' && req.user.role !== 'manager') {
                return res.status(403).json({
                    success: false,
                    message: "Access denied"
                });
            }

            const reports = await this.reportService.findReportsByUserId(parseInt(userId));

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get user reports error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getFieldReports(req, res) {
        try {
            const { fieldId } = req.params;
            const reports = await this.reportService.findReportsByFieldId(parseInt(fieldId));

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get field reports error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getCropReports(req, res) {
        try {
            const { cropId } = req.params;
            const reports = await this.reportService.findReportsByCropId(parseInt(cropId));

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get crop reports error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getReportsByStage(req, res) {
        try {
            const { stage } = req.params;
            
            if (!['Pre-Harvest', 'Post-Harvest'].includes(stage)) {
                return res.status(400).json({
                    success: false,
                    message: "Stage must be either 'Pre-Harvest' or 'Post-Harvest'"
                });
            }

            const reports = await this.reportService.findReportsByStage(stage);

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get reports by stage error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getPestOutbreakReports(req, res) {
        try {
            const reports = await this.reportService.findPestOutbreakReports();

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get pest outbreak reports error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getReportsByDateRange(req, res) {
        try {
            const { startDate, endDate, userId, stage } = req.query;
            
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    message: "Start date and end date are required"
                });
            }

            const filters = {};
            if (userId) filters.user_id = parseInt(userId);
            if (stage) filters.stage = stage;

            const reports = await this.reportService.findReportsByDateRange(
                new Date(startDate),
                new Date(endDate),
                filters
            );

            return res.status(200).json({
                success: true,
                data: reports
            });

        } catch (error) {
            console.error("Get reports by date range error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getReportStats(req, res) {
        try {
            const stats = await this.reportService.getReportStatistics();

            return res.status(200).json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error("Get report stats error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getLatestCropReport(req, res) {
        try {
            const { cropId } = req.params;
            const report = await this.reportService.findLatestCropReport(parseInt(cropId));

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: "No reports found for this crop"
                });
            }

            return res.status(200).json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error("Get latest crop report error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}