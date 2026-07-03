import PressGalaEntry from "../model/press_gala.model.js";
import Period from "../model/period.model.js";
import mongoose from "mongoose";
import User from "../model/user.model.js";

const controller = {
  addEntry: async (req, res) => {
    try {
      const { date, name, pcs, rate, period } = req.body;

      // Validation - Required fields
      if (!date || !name || !pcs || !rate || !period) {
        return res.status(400).json({
          status: false,
          message: "Date, name, pcs, rate, and period are required fields",
        });
      }

      // Validate ObjectId
      if (!mongoose.Types.ObjectId.isValid(period)) {
        return res.status(400).json({ message: "Invalid period ID format" });
      }
      if (!mongoose.Types.ObjectId.isValid(name)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      const pressgalauser = await User.findById(name).populate("role");
      if (!pressgalauser) {
        return res.status(404).json({ message: "User not found" });
      }
      if (!pressgalauser.role || pressgalauser.role.name !== "press gala") {
        return res
          .status(400)
          .json({ message: "User does not have PressGala role" });
      }

      // Validate Period exists
      const periodExists = await Period.findById(period);
      if (!periodExists) {
        return res.status(404).json({ message: "Period not found" });
      }

      // Auto-calculate Total if not explicitly provided
      const total =
        req.body.total !== undefined
          ? req.body.total
          : Number(pcs) * Number(rate);

      // Create new entry
      const newEntry = new PressGalaEntry({
        date,
        name,
        pcs,
        rate,
        total,
        period,
      });

      await newEntry.save();

      res
        .status(201)
        .json({ message: "Entry added successfully", entry: newEntry });
    } catch (error) {
      console.error("Error adding other entry:", error.code, error.message);

      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  editEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const { date, name, pcs, rate, total, period } = req.body;

      // Validate entry exists
      const entry = await PressGalaEntry.findById(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Validate ObjectId for period and name if provided
      if (period && !mongoose.Types.ObjectId.isValid(period)) {
        return res.status(400).json({ message: "Invalid period ID format" });
      }
      if (name && !mongoose.Types.ObjectId.isValid(name)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }

      // Update fields if provided
      entry.date = date || entry.date;
      entry.name = name || entry.name;
      entry.pcs = pcs || entry.pcs;
      entry.rate = rate || entry.rate;
      entry.total = total !== undefined ? total : entry.total;
      entry.period = period || entry.period;

      await entry.save();

      res.status(200).json({ message: "Entry updated successfully", entry });
    } catch (error) {
      console.error("Error editing other entry:", error.code, error.message);

      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  getAllEntries: async (req, res) => {
    try {
      const periodId = req.query.periodId;
      const filter = periodId ? { period: periodId } : {};
      const entries = await PressGalaEntry.find(filter)
        .populate("name", "firstName lastName")
        .sort({ date: 1 }); // Ascending by date

      const entriesByDate = {};
      let totalPcs = 0;
      let totalAmount = 0;

      entries.forEach((entry) => {
        const dateKey = new Date(entry.date)
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-");

        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
        totalPcs += entry.pcs || 0;
        totalAmount += entry.total || 0;
      });

      res.status(200).json({
        totalEntries: entries.length,
        totalPcs,
        totalAmount,
        entries: entriesByDate,
      });
    } catch (error) {
      console.error("Error fetching entries:", error.message);

      // Duplicate key error
      if (error === 11000) {
        return res.status(400).json({
          status: false,
          message: `Duplicate ID Found: ${error.keyValue.id}`,
        });
      }

      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  getPressGalaTotalsByPeriod: async (req, res) => {
    try {
      const { periodId } = req.query;

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res
          .status(400)
          .json({ message: "Period ID must be a valid ObjectId" });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const aggregation = await PressGalaEntry.aggregate([
        {
          $match: {
            period: new mongoose.Types.ObjectId(periodId),
            isActive: true,
          },
        },
        {
          $group: {
            _id: "$name",
            totalEntries: { $sum: 1 },
            totalPcs: { $sum: "$pcs" },
            totalAmount: { $sum: "$total" },
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
            totalAmount: 1,
          },
        },
      ]);

      res.status(200).json({
        period: period.name,
        totals: aggregation,
      });
    } catch (error) {
      console.error("Error fetching press gala totals by period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntriesByPressGalaUser: async (req, res) => {
    try {
      const { periodId, userId } = req.query;

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res.status(400).json({ message: "Period ID must be a valid ObjectId" });
      }
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "User ID must be a valid ObjectId" });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const user = await User.findById(userId).populate("role", "name");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const entries = await PressGalaEntry.find({
        period: new mongoose.Types.ObjectId(periodId),
        name: new mongoose.Types.ObjectId(userId),
        isActive: true,
      })
        .populate("name", "firstName lastName")
        .sort({ date: 1 });

      const entriesByDate = {};
      let totalPcs = 0;
      let totalAmount = 0;

      entries.forEach((entry) => {
        const dateKey = new Date(entry.date)
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-");

        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
        totalPcs += entry.pcs || 0;
        totalAmount += entry.total || 0;
      });

      res.status(200).json({
        period: period.name,
        userId,
        userName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : undefined,
        summary: {
          totalEntries: entries.length,
          totalPcs,
          totalAmount,
        },
        entries: entriesByDate,
      });
    } catch (error) {
      console.error("Error fetching press gala entries by user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const entry = await PressGalaEntry.findByIdAndDelete(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }
      res.status(200).json({ message: "Entry deleted successfully" });
    } catch (error) {
      console.error("Error adding other entry:", error);

      // Duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          status: false,
          message: `Duplicate ID Found: ${error.keyValue.id}`,
        });
      }

      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },

  getLastEntryId: async (req, res) => {
    try {
      const lastEntry = await PressGalaEntry.findOne().sort({ id: -1 });

      if (!lastEntry) {
        return res.status(200).json({ lastId: 0 });
      }

      res.status(200).json({ lastId: lastEntry.id });
    } catch (error) {
      console.error("Error fetching last Press Gala ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default controller;
