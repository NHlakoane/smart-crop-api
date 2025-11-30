import { FieldService } from "../services/field.service.js";
import { uploadToCloudinary } from "../services/upload.service.js";

class FieldController {
  constructor() {
    this.fieldService = new FieldService();
  }

  async createField(req, res) {
    try {
      const {
        f_name,
        soil_type,
        max_farmers,
        area,
        perimeter,
        is_available,
        last_harvest_date,
      } = req.body;

      if (!f_name || !soil_type || !max_farmers || !area || !perimeter) {
        return res.status(400).json({
          success: false,
          message:
            "Field name, soil type, max farmers, area, and perimeter are required",
        });
      }

      console.log(req.file);
      

      const { url } = await uploadToCloudinary(req.file.buffer, "fields");

      const fieldData = {
        f_name,
        soil_type,
        max_farmers,
        area,
        perimeter,
        is_available,
        field_photo_url: url,
        last_harvest_date,
      };

      const newField = await this.fieldService.createField(fieldData);

      return res.status(201).json({
        success: true,
        message: "Field created successfully",
        data: newField,
      });
    } catch (error) {
      console.error("Create field error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getFieldById(req, res) {
    try {
      const { id } = req.params;
      const field = await this.fieldService.findFieldById(parseInt(id));

      if (!field) {
        return res.status(404).json({
          success: false,
          message: "Field not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: field,
      });
    } catch (error) {
      console.error("Get field by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAllFields(req, res) {
    try {
      const { is_available, soil_type } = req.query;
      const filters = {};

      if (is_available !== undefined)
        filters.is_available = is_available === "true";
      if (soil_type) filters.soil_type = soil_type;

      const fields = await this.fieldService.findAllFields(filters);

      return res.status(200).json({
        success: true,
        data: fields,
      });
    } catch (error) {
      console.error("Get all fields error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async updateField(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedField = await this.fieldService.updateField(
        parseInt(id),
        updates
      );

      if (!updatedField) {
        return res.status(404).json({
          success: false,
          message: "Field not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Field updated successfully",
        data: updatedField,
      });
    } catch (error) {
      console.error("Update field error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async deleteField(req, res) {
    try {
      const { id } = req.params;
      const deleted = await this.fieldService.deleteField(parseInt(id));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Field not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Field deleted successfully",
      });
    } catch (error) {
      console.error("Delete field error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  async getAvailableFields(req, res) {
    try {
      const fields = await this.fieldService.findAvailableFields();

      return res.status(200).json({
        success: true,
        data: fields,
      });
    } catch (error) {
      console.error("Get available fields error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export default FieldController;
