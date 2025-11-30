import jwt from'jsonwebtoken';

class JWTService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.tokenExpiry = process.env.JWT_ACCESS_EXPIRY;
    this.cookieOptions = {
      httpOnly: true,
    };
  }

  generateToken(payload, options = {}) {
    const { expiresIn = this.tokenExpiry } = options;
    
    return jwt.sign(payload, this.secret, { expiresIn });
  }

  setTokenCookie(res, token, tokenName = 'token', options = {}) {
    const cookieOptions = {
      ...this.cookieOptions,
      ...options,
    };

    res.cookie(tokenName, token, cookieOptions);
  }

  clearTokenCookie(res, tokenName = 'token') {
    res.clearCookie(tokenName, {
      httpOnly: true
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret);
    } catch (error) {
      throw new Error(this.getVerificationError(error));
    }
  }

  decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  getVerificationError(error) {
    switch (error.name) {
      case 'TokenExpiredError':
        return 'Token has expired';
      case 'JsonWebTokenError':
        return 'Invalid token';
      case 'NotBeforeError':
        return 'Token not yet valid';
      default:
        return 'Token verification failed';
    }
  }

  generateAndSetTokenCookie(res, payload) {
    const token = this.generateToken(payload, { expiresIn: this.tokenExpiry });

    this.setTokenCookie(res, token, 'token', {
      maxAge: 2 * 60 * 60 * 1000, 
    });

    return token;
  }

  clearAllTokenCookie(res) {
    this.clearTokenCookie(res, 'token');
  }

  extractTokenFromRequest(req, tokenName = 'token') {
    // Check cookies first
    if (req.cookies && req.cookies[tokenName]) {
      return req.cookies[tokenName];
    }

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    if (req.query && req.query[tokenName]) {
      return req.query[tokenName];
    }

    return null;
  }

  isTokenExpired(token) {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    return decoded.exp * 1000 < Date.now();
  }

}

export default JWTService;