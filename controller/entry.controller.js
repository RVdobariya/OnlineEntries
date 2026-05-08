import Entry from "../model/entry.model.js";
import Design from "../model/design.model.js";
import Color from "../model/color.model.js";
import Type from "../model/type.model.js";
import Machine from "../model/machine.model.js";
import User from "../model/user.model.js";
import Period from "../model/period.model.js";
import mongoose from "mongoose";

const monthNames = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const parseMonthQuery = (monthQuery) => {
  if (!monthQuery || typeof monthQuery !== "string") {
    return null;
  }

  const parts = monthQuery.trim().toLowerCase().split(/[-/]/).map((str) => str.trim());
  if (parts.length !== 2) {
    return null;
  }

  let month = null;
  let year = null;

  const parseMonthPart = (part) => {
    if (monthNames[part]) {
      return monthNames[part];
    }
    const numeric = Number(part);
    return Number.isInteger(numeric) && numeric >= 1 && numeric <= 12 ? numeric : null;
  };

  const firstAsMonth = parseMonthPart(parts[0]);
  const secondAsMonth = parseMonthPart(parts[1]);
  const firstAsYear = Number(parts[0]);
  const secondAsYear = Number(parts[1]);

  if (firstAsMonth && secondAsYear && secondAsYear >= 1900) {
    month = firstAsMonth;
    year = secondAsYear;
  } else if (secondAsMonth && firstAsYear && firstAsYear >= 1900) {
    month = secondAsMonth;
    year = firstAsYear;
  } else {
    return null;
  }

  if (!month || !year) {
    return null;
  }

  return { month, year };
};

const controller = {
  addEntry: async (req, res) => {
    try {
      const { date,period, lotNo, pcs, design, color, type, singer, rate, machineNo, overlockPerson, rate15, dhaga, note } = req.body;

      // Validation - Required fields
      if (!date || !period ||  !lotNo || !pcs || !design || !color || !type || !singer || !rate || !machineNo || !overlockPerson || !rate15 || !dhaga) {
        return res.status(400).json({ status : false, message: "All required fields must be provided" });
      }

      // Validate ObjectId fields
      const objectIdFields = { design, color, type, singer, machineNo, overlockPerson, dhaga };
      for (const [field, value] of Object.entries(objectIdFields)) {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return res.status(400).json({ message: `${field} must be a valid ObjectId` });
        }
      }

      // Check if LOT NO already exists
      const existingEntry = await Entry.findOne({ lotNo });
      if (existingEntry) {
        return res.status(400).json({ message: "LOT NO already exists" });
      }

      // Validate references
      const designExists = await Design.findById(design);
      if (!designExists) {
        return res.status(400).json({ message: "Design not found" });
      }

      const colorExists = await Color.findById(color);
      if (!colorExists) {
        return res.status(400).json({ message: "Color not found" });
      }

      const typeExists = await Type.findById(type);
      if (!typeExists) {
        return res.status(400).json({ message: "Type not found" });
      }

      const singerExists = await User.findById(singer).populate("role", "name");
      if (!singerExists) {
        return res.status(400).json({ message: "Singer not found" });
      }
      if(!singerExists.role || singerExists.role.name.toLowerCase() !== "singer") {
        return res.status(400).json({ message: "Provided singer is not a singer" });
      }

      const overlockPersonExists = await User.findById(overlockPerson).populate("role", "name");
      if (!overlockPersonExists) {
        return res.status(400).json({ message: "Overlock person not found" });
      }
      if(!overlockPersonExists.role || overlockPersonExists.role.name.toLowerCase() !== "overlock") {
        return res.status(400).json({ message: "Provided overlock person is not an overlock operator" });
      }

      const machineExists = await Machine.findById(machineNo);
      if (!machineExists) {
        return res.status(400).json({ message: "Machine not found" });
      }

      const dhagaExists = await User.findById(dhaga).populate("role", "name");
      if (!dhagaExists) {
        return res.status(400).json({ message: "Dhaga user not found" });
      }
      if(!dhagaExists.role || dhagaExists.role.name.toLowerCase() !== "dhaga") {
        return res.status(400).json({ message: "Provided dhaga user is not a dhaga operator" });
      }

      // Create new entry
      const newEntry = new Entry({
        date,
        period,
        lotNo,
        pcs,
        design,
        color,
        type,
        singer,
        rate,
        machineNo,
        overlockPerson,
        rate15,
        dhaga,
        note: note || "",
      });

      await newEntry.save();

      // Populate all references before returning
      await newEntry.populate(["design", "color", "type", "singer", "machineNo", "overlockPerson"], "name");

      res.status(201).json({ message: "Entry added successfully", entry: newEntry });
    } catch (error) {
      console.error("Error adding entry:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteEntry: async (req, res) => {
    try {
      const { id } = req.params;

      const entry = await Entry.findById(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      await Entry.findByIdAndDelete(id);

      res.status(200).json({ message: "Entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting entry:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntriesByPeriod: async (req, res) => {
    try {
      const { periodId } = req.query;

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res.status(400).json({ message: "Period ID must be a valid ObjectId" });
      }

      // Find period by ID
      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const { year, month: monthNumber } = period;
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);

      const entries = await Entry.find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
        .populate("design", "name")
        .populate("color", "name")
        .populate("type", "name")
        .populate("singer", "firstName lastName")
        .populate("machineNo", "name")
        .populate("overlockPerson", "firstName lastName")
        .populate("dhaga", "firstName lastName")
        .sort({ date: 1 });

      const totalEntries = entries.length;
      const totalPcs = entries.reduce((sum, entry) => sum + (entry.pcs || 0), 0);
      const totalRate = entries.reduce((sum, entry) => sum + (entry.rate || 0), 0);
      const totalRate15 = entries.reduce((sum, entry) => sum + (entry.rate15 || 0), 0);

      res.status(200).json({
        period: period.name,
        periodId: period._id,
        summary: {
          totalEntries,
          totalPcs,
          totalRate,
          totalRate15,
        },
        entries,
      });
    } catch (error) {
      console.error("Error fetching entries by period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getRoleTotalsByPeriod: async (req, res) => {
    try {
      const { periodId, role = "singer" } = req.query;
      const allowedRoles = ["singer", "overlockPerson", "dhaga"];

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res.status(400).json({ message: "Period ID must be a valid ObjectId" });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Role must be one of singer, overlockPerson, or dhaga" });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const { year, month: monthNumber } = period;
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);

      const aggregation = await Entry.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: `$${role}`,
            totalEntries: { $sum: 1 },
            totalPcs: { $sum: "$pcs" },
            totalRate: { $sum: "$rate" },
            totalRate15: { $sum: "$rate15" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "person",
          },
        },
        {
          $unwind: {
            path: "$person",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            personId: "$_id",
            name: {
              $concat: ["$person.firstName", " ", "$person.lastName"],
            },
            totalEntries: 1,
            totalPcs: 1,
            totalRate: 1,
            totalRate15: 1,
          },
        },
      ]);

      res.status(200).json({
        period: period.name,
        role,
        totals: aggregation,
      });
    } catch (error) {
      console.error("Error fetching role totals by period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getOverlockTotalsByPeriod: async (req, res) => {
    try {
      const { periodId } = req.query;

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res.status(400).json({ message: "Period ID must be a valid ObjectId" });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const { year, month: monthNumber } = period;
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);

      const aggregation = await Entry.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: "$overlockPerson",
            totalEntries: { $sum: 1 },
            totalPcs: { $sum: "$pcs" },
            totalRate: { $sum: "$rate" },
            totalRate15: { $sum: "$rate15" },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "person",
          },
        },
        {
          $unwind: {
            path: "$person",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            personId: "$_id",
            name: {
              $concat: ["$person.firstName", " ", "$person.lastName"],
            },
            totalEntries: 1,
            totalPcs: 1,
            totalRate: 1,
            totalRate15: 1,
          },
        },
      ]);

      res.status(200).json({
        period: period.name,
        totals: aggregation,
      });
    } catch (error) {
      console.error("Error fetching overlock totals by period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntriesByUserRole: async (req, res) => {
    try {
      const { periodId, role = "singer", userId } = req.query;
      const allowedRoles = ["singer", "overlockPerson", "dhaga"];

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res.status(400).json({ message: "Period ID must be a valid ObjectId" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "User ID must be a valid ObjectId" });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({ message: "Role must be one of singer, overlockPerson, or dhaga" });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const { year, month: monthNumber } = period;
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);

      const filter = {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        [role]: new mongoose.Types.ObjectId(userId),
      };

      const entries = await Entry.find(filter)
        .populate("design", "name")
        .populate("color", "name")
        .populate("type", "name")
        .populate("singer", "firstName lastName")
        .populate("machineNo", "name")
        .populate("overlockPerson", "firstName lastName")
        .populate("dhaga", "firstName lastName")
        .sort({ date: 1 });

      const totalEntries = entries.length;
      const totalPcs = entries.reduce((sum, entry) => sum + (entry.pcs || 0), 0);
      const totalRate = entries.reduce((sum, entry) => sum + (entry.rate || 0), 0);
      const totalRate15 = entries.reduce((sum, entry) => sum + (entry.rate15 || 0), 0);

      res.status(200).json({
        period: period.name,
        role,
        userId,
        summary: {
          totalEntries,
          totalPcs,
          totalRate,
          totalRate15,
        },
        entries,
      });
    } catch (error) {
      console.error("Error fetching entries by user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default controller;