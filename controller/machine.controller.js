import Machine from "../model/machine.model.js";
import Role from "../model/role.model.js";
import User from "../model/user.model.js";
import crypto from "crypto";

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const controller = {
  addMachine: async (req, res) => {
    try {
      const { machineNo, name, overlockPerson, status } = req.body;

      if (!machineNo) {
        return res.status(400).json({ message: "Machine No is required" });
      }

      // Check if machine already exists
      const existingMachine = await Machine.findOne({ machineNo });
      if (existingMachine) {
        return res.status(400).json({ message: "Machine No already exists" });
      }

      let attachedOverlockUser = null;
      if (overlockPerson) {
        const user = await User.findById(overlockPerson).populate("role", "name");

        console.log("Overlock user found:", user);
        if (!user) {
          return res.status(404).json({ message: "Overlock user not found" });
        }

        if (!user.role || user.role.name.toLowerCase() !== "overlockperson") {
          return res
            .status(400)
            .json({ message: "Provided user is not an overlock operator" });
        }

        attachedOverlockUser = user;
      }

      const newMachine = new Machine({
        machineNo,
        name: name || machineNo,
        overlockPerson: attachedOverlockUser ? attachedOverlockUser._id : null,
        status: status || "active",
      });

      await newMachine.save();

      res.status(201).json({
        message: "Machine added successfully",
        machine: newMachine,
        overlockPerson: attachedOverlockUser
          ? {
              _id: attachedOverlockUser._id,
              firstName: attachedOverlockUser.firstName,
              lastName: attachedOverlockUser.lastName,
              mobileNumber: attachedOverlockUser.mobileNumber,
              email: attachedOverlockUser.email,
              role: attachedOverlockUser.role.name,
              isActive: attachedOverlockUser.isActive,
            }
          : null,
      });
    } catch (error) {
      console.error("Error adding machine:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllMachines: async (req, res) => {
    try {
      const machines = await Machine.find().populate({
        path: "overlockPerson",
        select: "firstName lastName mobileNumber email role isActive",
      });
      res.status(200).json({ machines });
    } catch (error) {
      console.error("Error fetching machines:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getMachineById: async (req, res) => {
    try {
      const { id } = req.params;
      const machine = await Machine.findById(id).populate({
        path: "overlockPerson",
        select: "firstName lastName mobileNumber email role isActive",
      });
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }
      res.status(200).json({ machine });
    } catch (error) {
      console.error("Error fetching machine:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateMachine: async (req, res) => {
    try {
      const { id } = req.params;
      const { machineNo, name, overlockPerson, status } = req.body;

      const machine = await Machine.findById(id);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      // Check unique machineNo if changed
      if (machineNo && machineNo !== machine.machineNo) {
        const existing = await Machine.findOne({ machineNo });
        if (existing) {
          return res.status(400).json({ message: "Machine No already exists" });
        }
      }

      // Check overlock user if it's being updated
      if (overlockPerson !== undefined) {
        if (overlockPerson === null || overlockPerson === "") {
          machine.overlockPerson = null;
        } else {
          const user = await User.findById(overlockPerson).populate("role", "name");
          if (!user) {
            return res.status(404).json({ message: "Overlock user not found" });
          }

          if (!user.role || user.role.name.toLowerCase() !== "overlockperson") {
            return res
              .status(400)
              .json({ message: "Provided user is not an overlock operator" });
          }
          machine.overlockPerson = user._id;
        }
      }

      machine.machineNo = machineNo || machine.machineNo;
      machine.name = name !== undefined ? name : machine.name;
      machine.status = status !== undefined ? status : machine.status;

      await machine.save();

      res
        .status(200)
        .json({ message: "Machine updated successfully", machine });
    } catch (error) {
      console.error("Error updating machine:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteMachine: async (req, res) => {
    try {
      const { id } = req.params;

      const machine = await Machine.findById(id);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      await Machine.findByIdAndDelete(id);

      res.status(200).json({ message: "Machine deleted successfully" });
    } catch (error) {
      console.error("Error deleting machine:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default controller;
