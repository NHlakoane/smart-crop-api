import { CropService } from "../services/crop.service.js";
import { FieldService } from "../services/field.service.js";
import { PesticideService } from "../services/pesticide.service.js";
import { UserService } from "../services/user.service.js";

export class CropController {
    constructor() {
        this.cropService = new CropService();
        this.userService = new UserService();
        this.fieldService = new FieldService();
        this.pesticideService = new PesticideService();
    }

    async createCrop(req, res) {
        const userId = req.user.userId;
        
        try {
            const { c_name, c_type, exp_harvest, planted_at, harvest_income, 
                   harvest_size, total_profit, crop_photo_url, exp_harvest_size, field_id  } = req.body;

            if (!c_name || !c_type || !exp_harvest || !exp_harvest_size) {
                return res.status(400).json({
                    success: false,
                    message: "Crop name, type, expected harvest, expected harvest size, user ID, and field ID are required"
                });
            }

            // Check if user is found
            const user = await this.userService.findUserById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User is not found" });
            }

            // Check if field is found
            const field = await this.fieldService.findFieldById(field_id);

            if (!field) {
                return res.status(404).json({ success: false, message: "Field is not found" });
            }

            const cropData = {
                c_name,
                c_type,
                exp_harvest,
                planted_at,
                harvest_income,
                harvest_size,
                total_profit,
                crop_photo_url,
                exp_harvest_size,
                user_id: userId,
                field_id
            };

            const newCrop = await this.cropService.createCrop(cropData);

            return res.status(201).json({
                success: true,
                message: "Crop created successfully",
                data: newCrop
            });

        } catch (error) {
            console.log("Create crop error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getCropById(req, res) {
        try {
            const { id } = req.params;
            const crop = await this.cropService.findCropById(parseInt(id));

            if (!crop) {
                return res.status(404).json({
                    success: false,
                    message: "Crop not found"
                });
            }

            return res.status(200).json({
                success: true,
                data: crop
            });

        } catch (error) {
            console.log("Get crop by ID error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getAllCrops(req, res) {
        try {
            const { user_id, field_id, c_type } = req.query;
            const filters = {};

            if (user_id) filters.user_id = parseInt(user_id);
            if (field_id) filters.field_id = parseInt(field_id);
            if (c_type) filters.c_type = c_type;

            const crops = await this.cropService.findAllCrops(filters);

            return res.status(200).json({
                success: true,
                data: crops
            });

        } catch (error) {
            console.log("Get all crops error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async updateCrop(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const userId = req.user.userId;
            console.log(updates);
            

             // Check if user is found
            const user = await this.userService.findUserById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: "User is not found" });
            }

            // Check if field is found
            const field = await this.fieldService.findFieldById(id);

            if (!field) {
                return res.status(404).json({ success: false, message: "Field is not found" });
            }

            const updatedCrop = await this.cropService.updateCrop(parseInt(id), updates);

            if (!updatedCrop) {
                return res.status(404).json({
                    success: false,
                    message: "Crop not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Crop updated successfully",
                data: updatedCrop
            });

        } catch (error) {
            console.log("Update crop error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async deleteCrop(req, res) {
        try {
            const { id } = req.params;
            const deleted = await this.cropService.deleteCrop(parseInt(id));

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Crop not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Crop deleted successfully"
            });

        } catch (error) {
            console.log("Delete crop error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getUserCrops(req, res) {
        try {
            const { userId } = req.params;
            const crops = await this.cropService.findCropsByUserId(parseInt(userId));

            return res.status(200).json({
                success: true,
                data: crops
            });

        } catch (error) {
            console.log("Get user crops error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getFieldCrops(req, res) {
        try {
            const { fieldId } = req.params;
            const crops = await this.cropService.findCropsByFieldId(parseInt(fieldId));

            return res.status(200).json({
                success: true,
                data: crops
            });

        } catch (error) {
            console.log("Get field crops error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getUpcomingHarvests(req, res) {
        try {
            const { days } = req.query;
            const crops = await this.cropService.findUpcomingHarvests(parseInt(days) || 7);

            return res.status(200).json({
                success: true,
                data: crops
            });

        } catch (error) {
            console.log("Get upcoming harvests error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async addPesticide(req, res) {
        try {
            const crop_id = req.params.cropId;
            const { pesticide_id, quantity_used } = req.body;

            if (!pesticide_id || !quantity_used) {
                return res.status(400).json({
                    success: false,
                    message: "Pesticide ID and quantity used are required"
                });
            }

            // Get pesticide by id
            const pesticide = await this.pesticideService.findPesticideById(pesticide_id);

            if (!pesticide) {
                return res.status(404).json({
                    success: false,
                    message: "Pesticide Not Found"
                })
            }

            // Get crop size
            const pesticide_size = pesticide.size;

            if (quantity_used > pesticide_size) {  
                return res.status(400).json({
                    success: false,
                    message: "Insufficient quantity"
                });
            }

             if (parseInt(quantity_used) === parseInt(pesticide_size)) {  
                return res.status(400).json({
                    success: false,
                    message: `Insufficient quantity, only ${pesticide_size - 1} units available`
                });
            }

            // Subtract quantity used
            const new_pesticide_size = parseInt(pesticide.size) - parseInt(quantity_used);
            await this.pesticideService.updatePesticide(pesticide_id, { size: new_pesticide_size });

            const application = await this.cropService.addPesticideApplication(
                parseInt(crop_id),
                parseInt(pesticide_id),
                parseFloat(quantity_used)
            );

            return res.status(201).json({
                success: true,
                message: "Pesticide application recorded successfully",
                data: application
            });

        } catch (error) {
            console.log("Add pesticide error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }

    async getCropPesticides(req, res) {
        try {
            const { cropId } = req.params;
            const applications = await this.cropService.getPesticideApplications(parseInt(cropId));

            return res.status(200).json({
                success: true,
                data: applications
            });

        } catch (error) {
            console.log("Get crop pesticides error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal server error"
            });
        }
    }
}