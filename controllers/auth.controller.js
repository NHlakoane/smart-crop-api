import JWTService from "../services/jwt.service.js";
import { UserService } from "../services/user.service.js";
import { compare } from "../utils/password.js";

export class AuthController {
  constructor() {
    this.userService = new UserService();
    this.jwtService = new JWTService();
    this.handleLogin = this.handleLogin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  async handleLogin(req, res) {
    const { email, password } = req.body;

    try {
      this.validateInput(email, password);

      const user = await this.authenticateUser(email, password);

      const token = this.jwtService.generateAndSetTokenCookie(res, {
        userId: user.user_id,
        role: user.role,
        names: user.names,
        email: user.email,
        phone: user.phone,
        gender: user.gender,
        is_active: user.is_active,
        created_date: user.created_date,
        updated_date: user.updated_date,
        address: user.address,
      });

      this.sendSuccessResponse(res, user, token);
    } catch (error) {
      this.handleError(res, error);
    }
  }

  handleLogout(req, res) {
    try {
      this.jwtService.clearAllTokenCookie(res);

      return res.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Something went wrong during logout",
      });
    }
  }

  validateInput(email, password) {
    if (!email || !password) {
      throw new InputValidationError("All fields are required");
    }
  }

  async authenticateUser(email, password) {
    const user = await this.userService.findUserByEmail(email);

    console.log(user);
    

    if (!user) {
      throw new AuthenticationError("Invalid credentials");
    }

    const isPasswordMatch = await compare(password, user.password);

    if (!isPasswordMatch) {
      throw new AuthenticationError("Invalid credentials");
    }

    // Remove password from user object
    const { password: pass, ...rest } = user;
    return rest;
  }

  sendSuccessResponse(res, user, authToken) {
    const tokenObj = {
      token: authToken,
    };
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: { user, ...tokenObj },
    });
  }

  handleError(res, error) {
    console.error(error);

    if (error instanceof InputValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error instanceof AuthenticationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong, try again later",
    });
  }
}

// Custom Error Classes
class InputValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "InputValidationError";
  }
}

class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = "AuthenticationError";
  }
}
