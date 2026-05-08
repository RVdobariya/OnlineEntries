import User from "../model/user.model.js";
import Role from "../model/role.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";

// Helper function to hash password using crypto
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

// Helper function to compare passwords
const comparePasswords = (password, hash) => {
  return hashPassword(password) === hash;
};

const authController = {
  register: async (req, res) => {
    try {
      const { firstName, lastName, mobileNumber, email, password, confirmPassword, roleId } = req.body;

      // Validation
      if (!firstName || !lastName || !email || !password || !confirmPassword || !mobileNumber) {
        return res.status(400).json({ message: "First name, last name, email, mobile number, password, and confirm password are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({
        $or: [
          mobileNumber ? { mobileNumber } : null,
          { email: normalizedEmail },
        ].filter(Boolean),
      });

      if (existingUser) {
        return res.status(400).json({ message: "User with this mobile number or email already exists" });
      }

      // Validate role if provided
      let role = null;
      if (roleId) {
        role = await Role.findById(roleId);
        if (!role) {
          return res.status(400).json({ message: "Role does not exist" });
        }
      }

      // Hash password
      const hashedPassword = hashPassword(password);

      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email: normalizedEmail,
        mobileNumber: mobileNumber || null,
        password: hashedPassword,
        role: roleId || null,
      });

      await newUser.save();

      // Return user data without password
      const userResponse = newUser.toObject();
      delete userResponse.password;

      res.status(201).json({
        message: "User registered successfully",
        user: userResponse,
      });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { mobileNumber, email, password } = req.body;

      console.log("Login attempt with mobileNumber:", mobileNumber, "email:", email);

      // Validation
      if ((!mobileNumber && !email) || !password) {
        return res.status(400).json({ message: "Mobile number or email and password are required" });
      }

      const normalizedEmail = email ? email.toLowerCase().trim() : null;
      const user = await User.findOne({
        $or: [
          mobileNumber ? { mobileNumber } : null,
          normalizedEmail ? { email: normalizedEmail } : null,
        ].filter(Boolean),
      }).populate("role");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      // Compare passwords
      if (!comparePasswords(password, user.password)) {
        console.log("Login failed for mobileNumber:", mobileNumber, "email:", email);
        return res.status(401).json({ message: "Invalid mobile number or password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, mobileNumber: user.mobileNumber, role: user.role ? user.role.name : null },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "365d" }
      );

      // Return user data without password
      const userResponse = user.toObject();
      delete userResponse.password;

      // Build response with role details and token
      let responseData = {
        message: "Login successful",
        token: token,
        user: userResponse,
      };


      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error logging in user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default authController;
