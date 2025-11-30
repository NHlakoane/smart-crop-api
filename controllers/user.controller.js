import NotificationService from "../services/notification.service.js";
import { PasswordService } from "../services/password.service.js";
import { uploadToCloudinary } from "../services/upload.service.js";
import { UserService } from "../services/user.service.js";

class UserController {
  constructor() {
    this.userService = new UserService();
    this.passwordService = new PasswordService();
    this.notificationService = new NotificationService();
    this.createUser = this.createUser.bind(this);
    this.updateUser = this.updateUser.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.getAllUsers = this.getAllUsers.bind(this);
    this.getUserById = this.getUserById.bind(this);
  }

  // Create user with authorization checks
  async createUser(req, res) {
    try {
      const { names, email, password, phone, gender, role, address } = req.body;
      const currentUser = req.user;
      console.log(currentUser);
      

      // Validate required fields
      if (!names || !email || !password || !phone || !gender) {
        return res.status(400).json({
          success: false,
          message: "Names, email, password, phone, and gender are required",
        });
      }

      // Authorization checks
      if (role === "admin") {
        if (currentUser.role !== "admin") {
          return res.status(403).json({
            success: false,
            message: "Only admin can create admin users",
          });
        }
      } else if (role === "farmer") {
        if (currentUser.role !== "admin" && currentUser.role !== "manager") {
          return res.status(403).json({
            success: false,
            message: "Only admin can create manager users",
          });
        }
      } else if (role === "manager") {
        if (!["admin", "manager"].includes(currentUser.role)) {
          return res.status(403).json({
            success: false,
            message: "Only admin or manager can create farmer users",
          });
        }
      }

      // Check if email already exists
      const existingUser = await this.userService.findUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists",
        });
      }

      // Check phone exists
      const phoneExists = await this.userService.checkPhoneExists(phone);

      if (phoneExists) {
        return res.status(409).json({
          success: false,
          message: "Phone already exists",
        });
      }

      // Hash password
      const hashedPassword = await this.passwordService.hash(password);

      const { url } = await uploadToCloudinary(req.file.buffer, "avatar");

      // Create user
      const userData = {
        names,
        email,
        password: hashedPassword,
        phone,
        gender,
        role: role || "farmer",
        is_active: true,
        url,
      };

      const newUser = await this.userService.createUser(userData, address);

      // Remove password from response
      const { password: _, ...rest } = newUser;

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: rest,
      });
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Update user
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const currentUser = req.user;

      // Check if user exists
      const existingUser = await this.userService.findUserById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Authorization: Users can update themselves, admins can update anyone
      if (
        currentUser.user_id !== parseInt(id) &&
        currentUser.role !== "admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Prevent role escalation
      if (updates.role && currentUser.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only admin can change user roles",
        });
      }

      // Hash password if provided
      if (updates.password) {
        updates.password = await this.passwordService.hash(updates.password);
      }

      const updatedUser = await this.userService.updateUser(
        parseInt(id),
        updates
      );

      // Remove password from response
      const { password: _, ...rest } = updatedUser;

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: rest,
      });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Delete user
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Check if user exists
      const existingUser = await this.userService.findUserById(parseInt(id));
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Authorization: Only admin or manager can delete users
      if (currentUser.role !== "admin" && currentUser.role !== "manager") {
        return res.status(403).json({
          success: false,
          message: "Only admin or manager can delete users",
        });
      }

      // Avoid admin deletion
      if (existingUser.role === "admin") {
        return res.status(403).json({
          success: false,
          message: "System admin cannot be deleted",
        });
      }

      // Prevent self-deletion
      if (currentUser.userId === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete your own account",
        });
      }

      // Delete user
      await this.userService.deleteUser(parseInt(id));

      // 🔔 Notify all admins
      const adminIds = await this.userService.getAdminUserIds();
      if (adminIds.length > 0) {
        const notifications = adminIds.map((adminId) => ({
          user_id: adminId,
          message: `${existingUser.names}  was deleted`,
          is_read: false,
          created_at: new Date(),
        }));

        await this.notificationService.createMultipleNotifications(
          notifications
        );
      }

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get all users (with optional filtering)
  async getAllUsers(req, res) {
    try {
      const currentUser = req.user;

      if (!currentUser) {
        return res.status(403).json({
          success: false,
          message: "Access denied, Not Signed In",
        });
      }
      const { role, is_active } = req.query;

      // // Authorization: Only admin and managers can view all users
      // if (!["admin", "manager"].includes(currentUser.role)) {
      //   return res.status(403).json({
      //     success: false,
      //     message: "Access denied",
      //   });
      // }

      const filters = {};
      if (role) filters.role = role;
      if (is_active !== undefined) filters.is_active = is_active === "true";

      const users = await this.userService.findAllUsers(filters);

      // Remove passwords from response
      const usersWithoutPasswords = users.map((user) => {
        const { password, ...rest } = user;
        return rest;
      });

      return res.status(200).json({
        success: true,
        data: usersWithoutPasswords,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  // Get user by ID
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const currentUser = req.user;

      // Authorization: Users can view themselves, admins and managers can view anyone
      if (
        currentUser.userId !== parseInt(id) &&
        !["admin", "manager"].includes(currentUser.role)
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const user = await this.userService.findUserById(parseInt(id));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Remove password from response
      const { password: _, ...rest } = user;

      return res.status(200).json({
        success: true,
        data: rest,
      });
    } catch (error) {
      console.error("Get user by ID error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}

export default UserController;
