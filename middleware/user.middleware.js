import JWTService from "../services/jwt.service.js";

class UserMiddleware {
  constructor() {
    this.jwtService = new JWTService();
  }

  authenticate() {
    return (req, res, next) => {
      try {
        
        const token = this.jwtService.extractTokenFromRequest(req, 'token');
        
        if (!token) {
          return res.status(401).json({ 
            success: false,
            message: 'Authentication token required' 
          });
        }

        const decoded = this.jwtService.verifyToken(token);
        req.user = decoded;
        next();
        
      } catch (error) {
        console.error('Authentication error:', error);
        
        // Handle different JWT error types
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            success: false,
            message: 'Token has expired' 
          });
        }
        
        if (error.name === 'JsonWebTokenError') {
          return res.status(401).json({ 
            success: false,
            message: 'Invalid token' 
          });
        }

        return res.status(500).json({ 
          success: false,
          message: 'Authentication failed' 
        });
      }
    };
  }

  authorize(roles = []) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          success: false,
          message: 'Insufficient permissions' 
        });
      }

      next();
    };
  }

  checkActive() {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ 
          success: false,
          message: 'Authentication required' 
        });
      }

      if (req.user.is_active === false) {
        return res.status(403).json({ 
          success: false,
          message: 'Account is deactivated' 
        });
      }

      next();
    };
  }
}

export default UserMiddleware;