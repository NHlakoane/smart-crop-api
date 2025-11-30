import { PesticideService } from "../services/pesticide.service.js";

export class PesticideController {
  constructor() {
    this.pesticideService = new PesticideService();
  }

  async createPesticide(req, res) {
    const user_id = req.user.userId;
    console.log(user_id);
    
    try {
      const { p_name, pesticide_type, size } =
        req.body;

      if (!p_name || !pesticide_type || !size || !user_id) {
        return res.status(400).json({
          success: false,
          message:
            "Pesticide name, type, size, and user ID are required",
        });
      }

      const pesticideData = {
        p_name,
        pesticide_type,
        size,
        user_id
      };

      const newPesticide = await this.pesticideService.createPesticide(
        pesticideData
      );

      return res.status(201).json({
        success: true,
        message: "Pesticide application recorded successfully",
        data: newPesticide,
      });
    } catch (error) {
      console.error("Create pesticide error:", error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong, try again later",
      });
    }
  }

  async getPesticideById(req, res) {
    try {
      const { id } = req.params;
      const pesticide = await this.pesticideService.findPesticideById(
        parseInt(id)
      );

      if (!pesticide) {
        return res.status(404).json({
          success: false,
          message: "Pesticide application not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: pesticide,
      });
    } catch (error) {
      console.error("Get pesticide by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAllPesticides(req, res) {
    try {
      const { user_id, crop_id, pesticide_type } = req.query;
      const filters = {};

      if (user_id) filters.user_id = parseInt(user_id);
      if (crop_id) filters.crop_id = parseInt(crop_id);
      if (pesticide_type) filters.pesticide_type = pesticide_type;

      const pesticides = await this.pesticideService.findAllPesticides(filters);

      return res.status(200).json({
        success: true,
        data: pesticides,
      });
    } catch (error) {
      console.log("Get all pesticides error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updatePesticide(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedPesticide = await this.pesticideService.updatePesticide(
        parseInt(id),
        updates
      );

      if (!updatedPesticide) {
        return res.status(404).json({
          success: false,
          message: "Pesticide application not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Pesticide application updated successfully",
        data: updatedPesticide,
      });
    } catch (error) {
      console.error("Update pesticide error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deletePesticide(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.pesticideService.deletePesticide(parseInt(id));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Pesticide application not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Pesticide application deleted successfully",
      });
    } catch (error) {
      console.error("Delete pesticide error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getUserPesticides(req, res) {
    try {
      const { userId } = req.params;
      const pesticides = await this.pesticideService.findPesticidesByUserId(
        parseInt(userId)
      );

      return res.status(200).json({
        success: true,
        data: pesticides,
      });
    } catch (error) {
      console.error("Get user pesticides error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getCropPesticides(req, res) {
    try {
      const { cropId } = req.params;
      const pesticides = await this.pesticideService.findPesticidesByCropId(
        parseInt(cropId)
      );

      return res.status(200).json({
        success: true,
        data: pesticides,
      });
    } catch (error) {
      console.error("Get crop pesticides error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getPesticidesByType(req, res) {
    try {
      const { type } = req.params;
      const pesticides = await this.pesticideService.findPesticidesByType(type);

      return res.status(200).json({
        success: true,
        data: pesticides,
      });
    } catch (error) {
      console.error("Get pesticides by type error:", error);
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
        await this.pesticideService.findRecentPesticideApplications(
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

  async getPesticideStats(req, res) {
    try {
      const stats = await this.pesticideService.getPesticideStatistics();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Get pesticide stats error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getUsageByUser(req, res) {
    try {
      const usage = await this.pesticideService.getPesticideUsageByUser();

      return res.status(200).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      console.error("Get pesticide usage by user error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getUsageByCrop(req, res) {
    try {
      const usage = await this.pesticideService.getPesticideUsageByCrop();

      return res.status(200).json({
        success: true,
        message: "Pesticide usage by crop retrieved successfully",
        data: usage,
      });
    } catch (error) {
      console.error("Get pesticide usage by crop error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
