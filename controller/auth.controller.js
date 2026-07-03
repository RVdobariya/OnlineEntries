import User from "../model/user.model.js";
import Role from "../model/role.model.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import fs from "fs";
import e from "express";

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
      const {
        firstName,
        lastName,
        mobileNumber,
        email,
        password,
        confirmPassword,
        roleId,
      } = req.body;

      // const logMessage = `[${new Date().toISOString()}] Register API hit - mobileNumber: ${mobileNumber}, email: ${email}\n`;
      // fs.appendFileSync("api_logs.txt", logMessage);

      console.log(
        "Registering user with mobileNumber:",
        mobileNumber,
        "email:",
        email,
      );

      // Validation
      if (
        !firstName ||
        !lastName ||
        !password ||
        !confirmPassword ||
        !mobileNumber
      ) {
        return res.status(422).json({
          message:
            "First name, last name, mobile number, password, and confirm password are required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(422).json({ message: "Passwords do not match" });
      }

      if (password.length < 6) {
        return res
          .status(422)
          .json({ message: "Password must be at least 6 characters" });
      }

      const user = await User.findOne({ mobileNumber });

      console.log("Existing user with mobileNumber:", mobileNumber, "is", user);
      const user1 = email ? await User.findOne({ email }) : null;
      console.log("Existing user with email:", email, "is", user1);
      if (user || user1) {
        return res.status(409).json({
          message: "User with this mobile number or email already exists",
        });
      }

      // Validate role if provided
      let role = null;
      if (roleId) {
        role = await Role.findById(roleId);
        if (!role) {
          return res.status(404).json({ message: "Role does not exist" });
        }
      }

      // Hash password
      const hashedPassword = hashPassword(password);

      // Create new user
      const newUser = new User({
        firstName,
        lastName,
        email: email || undefined,
        mobileNumber: mobileNumber || undefined,
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
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, mobileNumber, roleId, isActive } =
        req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if(user.isActive === false){
        return res.status(403).json({ message: "Cannot update an inactive user" });
      }

      // Check for duplicate mobile number or email
      if (mobileNumber && mobileNumber !== user.mobileNumber) {
        const existingMobileUser = await User.findOne({ mobileNumber });
        if (existingMobileUser) {
          return res
            .status(409)
            .json({ message: "Another user with this mobile number already exists" });
        }
      }

      if (email && email !== user.email) {
        const existingEmailUser = await User.findOne({ email });
        if (existingEmailUser) {
          return res
            .status(409)
            .json({ message: "Another user with this email already exists" });
        }
      }

      // Validate role if provided
      let role = null;
      if (roleId) {
        role = await Role.findById(roleId);
        if (!role) {
          return res.status(404).json({ message: "Role does not exist" });
        }
      }

      // Update user fields
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.email = email || user.email;
      user.mobileNumber = mobileNumber || user.mobileNumber;
      user.role = roleId || user.role;

      await user.save();

      // Return updated user data without password
      const userResponse = user.toObject();
      delete userResponse.password;

      res.status(200).json({
        message: "User updated successfully",
        user: userResponse,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { mobileNumber, password } = req.body;

      // Validation
      if (!mobileNumber || !password) {
        return res.status(422).json({
          message: "Mobile number and password are required",
        });
      }

      const user = await User.findOne({
        mobileNumber,
      }).populate("role");


      if (!user) {
        return res.status(422).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }

      // Compare passwords
      if (!comparePasswords(password, user.password)) {
        
        return res
          .status(401)
          .json({ message: "Icorrect password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          mobileNumber: user.mobileNumber,
          role: user.role ? user.role.name : null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "365d" },
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

  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;

      // Assumes your authenticateToken middleware attaches the authenticated user to req.user
      const userId = req.user._id;

      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Old password and new password are required." });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      if(user.isActive === false){
        return res.status(403).json({ status : false, message: "User is InActive." });
      }

      const hashedOldPassword = hashPassword(oldPassword);
      if (user.password !== hashedOldPassword) {
        return res.status(401).json({ message: "Incorrect old password." });
      }

      user.password = hashPassword(newPassword);
      await user.save();

      return res
        .status(200)
        .json({ message: "Password changed successfully." });
    } catch (error) {
      console.error("Error in changePassword:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },

  updateUserStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isActive = isActive;
      await user.save();

      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        message: `User ${isActive ? 'activated' : 'inactivated'} successfully.`,
        user: userResponse,
      });
    } catch (error) {
      console.error("Error in updateUserStatus:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default authController;
