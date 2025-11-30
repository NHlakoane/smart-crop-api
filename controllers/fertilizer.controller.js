import { FertilizerService } from "../services/fertilizer.service.js";

export class FertilizerController {
  constructor() {
    this.fertilizerService = new FertilizerService();
    this.createFertilizer = this.createFertilizer.bind(this);
    this.getFertilizerById = this.getFertilizerById.bind(this);
    this.getAllFertilizers = this.getAllFertilizers.bind(this);
    this.updateFertilizer = this.updateFertilizer.bind(this);
    this.deleteFertilizer = this.deleteFertilizer.bind(this);
    this.getCropFertilizers = this.getCropFertilizers.bind(this);
    this.getFieldFertilizers = this.getFieldFertilizers.bind(this);
    this.getManufacturerFertilizers =
      this.getManufacturerFertilizers.bind(this);
    this.getExpiredFertilizers = this.getExpiredFertilizers.bind(this);
    this.getExpiringFertilizers = this.getExpiringFertilizers.bind(this);
    this.getFertilizerStats = this.getFertilizerStats.bind(this);
    this.getRecentApplications = this.getRecentApplications.bind(this);
  }

  async createFertilizer(req, res) {
    try {
      const {
        fert_name,
        npk_ratio,
        size_kg,
        description,
        manufacturer,
        application_rate,
        expiration_date,
      } = req.body;

      if (!fert_name || !npk_ratio || !size_kg) {
        return res.status(400).json({
          success: false,
          message: "Fertilizer name, NPK ratio, and size are required",
        });
      }

      //   Fertilizer expiration date must be greater than 2 weeks
      const f_exp = new Date(expiration_date);
      f_exp.setDate(f_exp.getDate() + 14);

      console.log(
        "Incoming Fertilizer Expire Date: ",
        expiration_date,
        "Limit for Expire Date: ",
        f_exp
      );

      if (expiration_date < f_exp) {
        return res.status(400).json({
          success: false,
          message: "Fertilizer must expire after two weeks",
        });
      }

      const fertilizerData = {
        fert_name,
        npk_ratio,
        size_kg,
        description,
        manufacturer,
        application_rate,
        expiration_date,
      };

      const newFertilizer = await this.fertilizerService.createFertilizer(
        fertilizerData
      );

      return res.status(201).json({
        success: true,
        message: "Fertilizer created successfully",
        data: newFertilizer,
      });
    } catch (error) {
      console.error("Create fertilizer error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getFertilizerById(req, res) {
    try {
      const { id } = req.params;
      const fertilizer = await this.fertilizerService.findFertilizerById(
        parseInt(id)
      );

      if (!fertilizer) {
        return res.status(404).json({
          success: false,
          message: "Fertilizer not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: fertilizer,
      });
    } catch (error) {
      console.error("Get fertilizer by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAllFertilizers(req, res) {
    try {
      const { crop_id, field_id, manufacturer, npk_ratio } = req.query;
      const filters = {};

      if (crop_id) filters.crop_id = parseInt(crop_id);
      if (field_id) filters.field_id = parseInt(field_id);
      if (manufacturer) filters.manufacturer = manufacturer;
      if (npk_ratio) filters.npk_ratio = npk_ratio;

      const fertilizers = await this.fertilizerService.findAllFertilizers(
        filters
      );

      return res.status(200).json({
        success: true,
        data: fertilizers,
      });
    } catch (error) {
      console.error("Get all fertilizers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateFertilizer(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedFertilizer = await this.fertilizerService.updateFertilizer(
        parseInt(id),
        updates
      );

      if (!updatedFertilizer) {
        return res.status(404).json({
          success: false,
          message: "Fertilizer not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Fertilizer updated successfully",
        data: updatedFertilizer,
      });
    } catch (error) {
      console.error("Update fertilizer error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteFertilizer(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.fertilizerService.deleteFertilizer(
        parseInt(id)
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Fertilizer not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Fertilizer deleted successfully",
      });
    } catch (error) {
      console.error("Delete fertilizer error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getCropFertilizers(req, res) {
    try {
      const { cropId } = req.params;
      const fertilizers = await this.fertilizerService.findFertilizersByCropId(
        parseInt(cropId)
      );

      return res.status(200).json({
        success: true,
        data: fertilizers,
      });
    } catch (error) {
      console.error("Get crop fertilizers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getFieldFertilizers(req, res) {
    try {
      const { fieldId } = req.params;
      const fertilizers = await this.fertilizerService.findFertilizersByFieldId(
        parseInt(fieldId)
      );

      return res.status(200).json({
        success: true,
        data: fertilizers,
      });
    } catch (error) {
      console.error("Get field fertilizers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getManufacturerFertilizers(req, res) {
    try {
      const { manufacturer } = req.params;
      const fertilizers =
        await this.fertilizerService.findFertilizersByManufacturer(
          manufacturer
        );

      return res.status(200).json({
        success: true,
        data: fertilizers,
      });
    } catch (error) {
      console.error("Get manufacturer fertilizers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getExpiredFertilizers(req, res) {
    try {
      const fertilizers = await this.fertilizerService.findExpiredFertilizers();

      return res.status(200).json({
        success: true,
        data: fertilizers,
      });
    } catch (error) {
      console.error("Get expired fertilizers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getExpiringFertilizers(req, res) {
    try {
      const { days } = req.query;
      const fertilizers =
        await this.fertilizerService.findFertilizersExpiringSoon(
          parseInt(days) || 30
        );

      return res.status(200).json({
        success: true,
        data: fertilizers,
      });
    } catch (error) {
      console.error("Get expiring fertilizers error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getFertilizerStats(req, res) {
    try {
      const stats = await this.fertilizerService.getFertilizerStatistics();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get fertilizer stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getRecentApplications(req, res) {
    try {
      const { limit } = req.query;
      const applications =
        await this.fertilizerService.findRecentFertilizerApplications(
          parseInt(limit) || 10
        );

      return res.status(200).json({
        success: true,
        data: applications,
      });
    } catch (error) {
      console.error("Get recent applications error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async assignFertilizerToCrops(req, res) {
        try {
            const { fert_id, crop_ids, quantity_used } = req.body;

            if (!fert_id || !crop_ids || !quantity_used) {
                return res.status(400).json({
                    success: false,
                    message: "Fertilizer ID, crop IDs, and quantities are required"
                });
            }

            const assignments = await this.fertilizerService.assignFertilizerToCrops({
                fert_id,
                crop_ids,
                quantity_used
            });

            return res.status(200).json({
                success: true,
                message: "Fertilizer assigned to crops successfully",
                data: assignments
            });
        } catch (error) {
            console.error("Assign fertilizer to crops error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getAllCropFertilizerAssignments(req, res) {
        try {
            const assignments = await this.fertilizerService.findAllCropFertilizerAssignments();
            
            return res.status(200).json({
                success: true,
                data: assignments
            });
        } catch (error) {
            console.error("Get all crop-fertilizer assignments error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async deleteCropFertilizerAssignment(req, res) {
        try {
            const { cropId, fertId } = req.params;
            
            const deleted = await this.fertilizerService.deleteCropFertilizerAssignment(
                parseInt(cropId), 
                parseInt(fertId)
            );

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Crop-fertilizer assignment not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Assignment deleted successfully"
            });
        } catch (error) {
            console.error("Delete crop-fertilizer assignment error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}
