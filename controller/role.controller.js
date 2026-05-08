import express from "express";
const router = express.Router();
import Role from "../model/role.model.js";
import User from "../model/user.model.js";
import { get } from "mongoose";


const controller = {
  addRole: async (req, res) => {
    try {
      const { name } = req.body;

      // Check if the role already exists
      const existingRole = await Role.findOne({ name });
      if (existingRole) {
        return res.status(400).json({ message: "Role already exists" });
      }

      // Create a new role
      const newRole = new Role({ name });
      await newRole.save();

      res.status(201).json({ message: "Role added successfully", role: newRole });
    } catch (error) {
      console.error("Error adding role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllRoles: async (req, res) => {
    try {
      const roles = await Role.find();
      res.status(200).json({ roles });
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getRoleById: async (req, res) => {
    try {
      const { id } = req.params;
      const role = await Role.findById(id);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }
      res.status(200).json({ role });
    } catch (error) {
      console.error("Error fetching role by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      // Check if the role exists
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Update the role
      existingRole.name = name || existingRole.name;
      await existingRole.save();

      res.status(200).json({ message: "Role updated successfully", role: existingRole });
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteRole: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the role exists
      const existingRole = await Role.findById(id);
      if (!existingRole) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Delete the role
      await Role.findByIdAndDelete(id);

      res.status(200).json({ message: "Role deleted successfully" });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getUsersByRole: async (req, res) => {
    try {
      const { roleId } = req.params;

      // Check if the role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ message: "Role not found" });
      }

      // Find all users with this role
      const users = await User.find({ role: roleId }).populate("role").select("-password");

      res.status(200).json({
        message: "Users retrieved successfully",
        role: role.name,
        userCount: users.length,
        users,
      });
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllUsersWithRoles: async (req, res) => {
    try {
      // Get all roles
      const roles = await Role.find();

      // Build response with users grouped by role name as key
      const rolesWithUsers = {};
      for (const role of roles) {
        const users = await User.find({ role: role._id }).select("-password");
        rolesWithUsers[role.name] = users;
      }

      res.status(200).json(rolesWithUsers);
    } catch (error) {
      console.error("Error fetching all users with roles:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

};

export default controller;
