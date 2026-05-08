import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");

    // Find user and populate role
    const user = await User.findById(decoded.userId).populate("role");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Enter valid access token" });
    }
    if (error.name === "NotBeforeError") {
      return res.status(401).json({ message: "Enter valid access token" });
    }
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Check if user has admin role
  if (!req.user.role || req.user.role.name !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

export { authenticateToken, requireAdmin };
