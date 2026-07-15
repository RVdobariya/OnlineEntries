import Entry from "../model/entry.model.js";
import Design from "../model/design.model.js";
import Color from "../model/color.model.js";
import Type from "../model/type.model.js";
import Machine from "../model/machine.model.js";
import User from "../model/user.model.js";
import Period from "../model/period.model.js";
import mongoose from "mongoose";
import LotNo from "../model/lot_no.model.js";
import ExcelJS from "exceljs";

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

  const parts = monthQuery
    .trim()
    .toLowerCase()
    .split(/[-/]/)
    .map((str) => str.trim());
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
    return Number.isInteger(numeric) && numeric >= 1 && numeric <= 12
      ? numeric
      : null;
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
      console.log("Add Entry API hit with body:", req.body);
      const {
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
        note,
      } = req.body;

      console.log("Add Entry API hit with data:");

      // Validation - Required fields
      if (
        !date ||
        !period ||
        !pcs ||
        !design ||
        !color ||
        !type ||
        !singer ||
        !rate ||
        !machineNo ||
        !rate15 ||
        !dhaga
      ) {
        return await res.status(409).json({
          status: false,
          message: "All required fields must be provided",
        });
      }

      // Validate ObjectId fields
      const objectIdFields = {
        lotNo,
        design,
        color,
        type,
        singer,
        machineNo,
        overlockPerson,
        dhaga,
      };
      for (const [field, value] of Object.entries(objectIdFields)) {
        if ((field === "lotNo" || field === "overlockPerson") && !value) {
          continue;
        }
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return res
            .status(400)
            .json({ message: `${field} must be a valid ObjectId` });
        }
      }

      // Validate references
      if (lotNo) {
        const lotNoExists = await LotNo.findById(lotNo);
        if (!lotNoExists) {
          return res.status(400).json({ message: "Lot not found" });
        }
      }

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
      if (
        !singerExists.role ||
        singerExists.role.name.toLowerCase() !== "singer"
      ) {
        return res
          .status(400)
          .json({ message: "Provided singer is not a singer" });
      }

      if (overlockPerson) {
        const overlockPersonExists = await User.findById(
          overlockPerson,
        ).populate("role", "name");
        if (!overlockPersonExists) {
          return res.status(400).json({ message: "Overlock person not found" });
        }
        if (
          !overlockPersonExists.role ||
          overlockPersonExists.role.name.toLowerCase() !== "overlockperson"
        ) {
          return res.status(400).json({
            message: "Provided overlock person is not an overlock operator",
          });
        }
      }
      const machineExists = await Machine.findById(machineNo);
      if (!machineExists) {
        return res.status(400).json({ message: "Machine not found" });
      }

      const dhagaExists = await User.findById(dhaga).populate("role", "name");
      if (!dhagaExists) {
        return res.status(400).json({ message: "Dhaga user not found" });
      }
      if (
        !dhagaExists.role ||
        dhagaExists.role.name.toLowerCase() !== "dhaga"
      ) {
        return res
          .status(400)
          .json({ message: "Provided dhaga user is not a dhaga operator" });
      }

      // Create new entry
      const newEntry = new Entry({
        date,
        period,
        lotNo: lotNo || null,
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
      await newEntry.populate(
        [
          "lotNo",
          "design",
          "color",
          "type",
          "singer",
          "machineNo",
          "overlockPerson",
          "dhaga",
        ],
        "name",
      );

      res
        .status(201)
        .json({ message: "Entry added successfully", entry: newEntry });
    } catch (error) {
      console.error("Error adding entry:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  editEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const {
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
        note,
      } = req.body;
      const entry = await Entry.findById(id);
      if (!entry) {
        return res.status(404).json({ message: "Entry not found" });
      }

      // Simple field updates
      if (date !== undefined) entry.date = date;
      if (pcs !== undefined) entry.pcs = pcs;
      if (rate !== undefined) entry.rate = rate;
      if (rate15 !== undefined) entry.rate15 = rate15;
      entry.note = note !== undefined ? note : entry.note;

      // Reference field updates with validation
      if (period !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(period))
          return res.status(400).json({ message: "Invalid period ID" });
        if (!(await Period.findById(period)))
          return res.status(404).json({ message: "Period not found" });
        entry.period = period;
      }

      if (lotNo !== undefined) {
        if (lotNo === null || lotNo === "") {
          entry.lotNo = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(lotNo))
            return res.status(400).json({ message: "Invalid lotNo ID" });
          if (!(await LotNo.findById(lotNo)))
            return res.status(404).json({ message: "LotNo not found" });
          entry.lotNo = lotNo;
        }
      }

      if (design !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(design))
          return res.status(400).json({ message: "Invalid design ID" });
        if (!(await Design.findById(design)))
          return res.status(404).json({ message: "Design not found" });
        entry.design = design;
      }

      if (color !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(color))
          return res.status(400).json({ message: "Invalid color ID" });
        if (!(await Color.findById(color)))
          return res.status(404).json({ message: "Color not found" });
        entry.color = color;
      }

      if (type !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(type))
          return res.status(400).json({ message: "Invalid type ID" });
        if (!(await Type.findById(type)))
          return res.status(404).json({ message: "Type not found" });
        entry.type = type;
      }

      if (machineNo !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(machineNo))
          return res.status(400).json({ message: "Invalid machineNo ID" });
        if (!(await Machine.findById(machineNo)))
          return res.status(404).json({ message: "Machine not found" });
        entry.machineNo = machineNo;
      }

      // User reference updates with role validation
      if (singer !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(singer))
          return res.status(400).json({ message: "Invalid singer ID" });
        const user = await User.findById(singer).populate("role", "name");
        if (!user) return res.status(404).json({ message: "Singer not found" });
        if (!user.role || user.role.name.toLowerCase() !== "singer")
          return res.status(400).json({ message: "User is not a singer" });
        entry.singer = singer;
      }

      if (dhaga !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(dhaga))
          return res.status(400).json({ message: "Invalid dhaga ID" });
        const user = await User.findById(dhaga).populate("role", "name");
        if (!user)
          return res.status(404).json({ message: "Dhaga user not found" });
        if (!user.role || user.role.name.toLowerCase() !== "dhaga")
          return res
            .status(400)
            .json({ message: "User is not a dhaga operator" });
        entry.dhaga = dhaga;
      }

      if (overlockPerson !== undefined) {
        if (overlockPerson === null || overlockPerson === "") {
          entry.overlockPerson = null;
        } else {
          if (!mongoose.Types.ObjectId.isValid(overlockPerson))
            return res
              .status(400)
              .json({ message: "Invalid overlockPerson ID" });
          const user = await User.findById(overlockPerson).populate(
            "role",
            "name",
          );
          if (!user)
            return res.status(404).json({ message: "Overlock user not found" });
          if (!user.role || user.role.name.toLowerCase() !== "overlockperson")
            return res
              .status(400)
              .json({ message: "User is not an overlock operator" });
          entry.overlockPerson = overlockPerson;
        }
      }

      await entry.save();

      // Populate all references before returning
      await entry.populate(
        [
          "lotNo",
          "design",
          "color",
          "type",
          "singer",
          "machineNo",
          "overlockPerson",
          "dhaga",
        ],
        "name",
      );

      res.status(200).json({ message: "Entry updated successfully", entry });
    } catch (error) {
      console.error("Error updating entry:", error);
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

      await Entry.findByIdAndUpdate(id, { isActive: false });

      res.status(200).json({ message: "Entry deleted successfully" });
    } catch (error) {
      console.error("Error deleting entry:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntriesByMonth: async (req, res) => {
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

      // Find period by ID
      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const entries = await Entry.find({
        period: periodId,
        isActive: true, // Only include active entries
      })
        .populate("lotNo", "name")
        .populate("design", "name")
        .populate("color", "name")
        .populate("type", "name")
        .populate("singer", "firstName lastName")
        .populate("machineNo", "name")
        .populate("overlockPerson", "firstName lastName")
        .populate("dhaga", "firstName lastName")
        .sort({ date: 1 });

      const entriesByDate = {};

      entries.forEach((entry) => {
        const dateKey = entry.date
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-");
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
      });

      const totalEntries = entries.length;
      const totalPcs = entries.reduce(
        (sum, entry) => sum + (entry.pcs || 0),
        0,
      );

      const totalAmountOfSigner = entries.reduce(
        (sum, entry) => sum + (entry.pcs || 0) * (entry.rate || 0),
        0,
      );
      const totalAmountOfOberLock = entries.reduce(
        (sum, entry) => sum + (entry.pcs || 0) * (entry.rate15 || 0),
        0,
      );

      res.status(200).json({
        period: period.name,
        periodId: period._id,
        summary: {
          totalEntries,
          totalPcs,
          totalAmountOfSigner,
          totalAmountOfOberLock,
        },
        entries: entriesByDate,
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
        return res
          .status(400)
          .json({ message: "Period ID must be a valid ObjectId" });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Role must be one of singer, overlockPerson, or dhaga",
        });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const groupStage = {
        _id: `$${role}`,
        totalEntries: { $sum: 1 },
        totalPcs: { $sum: "$pcs" },
      };

      if (role !== "dhaga") {
        groupStage.totalAmount = {
          $sum: {
            $cond: {
              if: { $eq: [role, "singer"] },
              then: { $multiply: ["$pcs", "$rate"] },
              else: { $multiply: ["$pcs", "$rate15"] },
            },
          },
        };
      }

      const projectStage = {
        _id: 0,
        personId: "$_id",
        name: {
          $concat: ["$person.firstName", " ", "$person.lastName"],
        },
        totalEntries: 1,
        totalPcs: 1,
      };

      if (role !== "dhaga") {
        projectStage.totalAmount = 1;
      }

      const aggregation = await Entry.aggregate([
        {
          $match: {
            period: new mongoose.Types.ObjectId(periodId),
            isActive: true, // Only include active entries
          },
        },
        {
          $group: groupStage,
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
          $project: projectStage,
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
        return res
          .status(400)
          .json({ message: "Period ID must be a valid ObjectId" });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const aggregation = await Entry.aggregate([
        {
          $match: {
            period: new mongoose.Types.ObjectId(periodId),
            isActive: true, // Only include active entries
          },
        },
        {
          $group: {
            _id: "$overlockPerson",
            totalEntries: { $sum: 1 },
            totalPcs: { $sum: "$pcs" },
            totalAmount: {
              $sum: {
                $multiply: ["$pcs", "$rate15"],
              },
            },
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
        return res
          .status(400)
          .json({ message: "Period ID must be a valid ObjectId" });
      }

      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res
          .status(400)
          .json({ message: "User ID must be a valid ObjectId" });
      }

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Role must be one of singer, overlockPerson, or dhaga",
        });
      }

      const period = await Period.findById(periodId);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      const { year, month: monthNumber } = period;
      const startDate = new Date(year, monthNumber - 1, 1);
      const endDate = new Date(year, monthNumber, 0, 23, 59, 59, 999);

      const filter = {
        period: {
          $eq: new mongoose.Types.ObjectId(periodId),
        },
        [role]: new mongoose.Types.ObjectId(userId),
      };
      filter.isActive = true;

      const entries = await Entry.find(filter)
        .populate("lotNo", "name")
        .populate("design", "name")
        .populate("color", "name")
        .populate("type", "name")
        .populate("singer", "firstName lastName")
        .populate("machineNo", "name")
        .populate("overlockPerson", "firstName lastName")
        .populate("dhaga", "firstName lastName")
        .sort({ date: 1 });

      // Group entries by date
      const entriesByDate = {};
      entries.forEach((entry) => {
        const dateKey = entry.date
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-");
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
      });

      const totalEntries = entries.length;
      const totalPcs = entries.reduce(
        (sum, entry) => sum + (entry.pcs || 0),
        0,
      );

      // Calculate totalAmount based on role
      const totalAmount = entries.reduce((sum, entry) => {
        const pcs = entry.pcs || 0;
        if (role === "singer") {
          return sum + pcs * (entry.rate || 0);
        } else if (role === "overlockPerson") {
          return sum + pcs * (entry.rate15 || 0);
        }
        return sum;
      }, 0);

      res.status(200).json({
        period: period.name,
        role,
        userId,
        summary: {
          totalEntries,
          totalPcs,
          totalAmount,
        },
        entries: entriesByDate,
      });
    } catch (error) {
      console.error("Error fetching entries by user role:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntriesByPeriodAndLot: async (req, res) => {
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

      const filter = { period: new mongoose.Types.ObjectId(periodId) };
      filter.isActive = true;

      // Check if user is admin
      const isAdmin =
        req.user && req.user.role && req.user.role.name === "admin";

      if (!isAdmin) {
        // If not admin, only show entries where this user is involved
        filter.$or = [
          { singer: req.user._id },
          { overlockPerson: req.user._id },
          { dhaga: req.user._id },
        ];
      }

      const entries = await Entry.find(filter)
        .populate("lotNo", "name")
        .populate("design", "name")
        .populate("color", "name")
        .populate("type", "name")
        .populate("singer", "firstName lastName")
        .populate("machineNo", "name")
        .populate("overlockPerson", "firstName lastName")
        .populate("dhaga", "firstName lastName")
        .sort({ date: 1 });

      // Group entries by date
      const entriesByDate = {};
      let totalPcs = 0;

      entries.forEach((entry) => {
        const dateKey = entry.date
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-");
        if (!entriesByDate[dateKey]) {
          entriesByDate[dateKey] = [];
        }
        entriesByDate[dateKey].push(entry);
        totalPcs += entry.pcs || 0;
      });

      res.status(200).json({
        period: period.name,
        periodId: period._id,
        totalEntries: entries.length,
        totalPcs,
        entries: entriesByDate,
      });
    } catch (error) {
      console.error("Error fetching entries by period and lot:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getDatesByPeriod: async (req, res) => {
    try {
      const { periodId, isAll } = req.query;

      const isAlls = isAll === "true" || isAll === true;

      console.log("isAlls value:", isAlls);

      if (!periodId) {
        return res.status(400).json({ message: "Period ID is required" });
      }

      if (!mongoose.Types.ObjectId.isValid(periodId)) {
        return res
          .status(400)
          .json({ message: "Period ID must be a valid ObjectId" });
      }

      const filter = { period: new mongoose.Types.ObjectId(periodId) };
      filter.isActive = true;

      const entries = await Entry.find(filter)
        .populate("lotNo", "name", "")
        .populate("design", "name", "")
        .populate("color", "name", "")
        .populate("type", "name", "")
        .populate("singer", "firstName lastName", "")
        .populate("machineNo", "name", "")
        .populate("overlockPerson", "firstName lastName", "")
        .populate("dhaga", "firstName lastName", "")

        .sort({ date: 1 });

      if (isAll === "true" || isAll === true) {
        return res.status(200).json({
          data: entries,
          message: "All entries fetched successfully",
        });
      }

      const dateTotalsMap = {};
      entries.forEach((entry) => {
        const dateKey = entry.date
          .toLocaleDateString("en-GB")
          .replace(/\//g, "-");
        if (!dateTotalsMap[dateKey]) {
          dateTotalsMap[dateKey] = 0;
        }
        dateTotalsMap[dateKey] += entry.pcs || 0;
      });

      const datesList = Object.keys(dateTotalsMap).map((date) => ({
        date,
        totalPcs: dateTotalsMap[date],
      }));

      res.status(200).json({
        dates: datesList,
      });
    } catch (error) {
      console.error("Error fetching dates by period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntriesBySpecificDate: async (req, res) => {
    try {
      const { date, periodId } = req.query;

      if (!date) {
        return res
          .status(400)
          .json({ message: "Date is required in format (DD-MM-YYYY)" });
      }

      const [day, month, year] = date.split("-");
      if (!day || !month || !year) {
        return res
          .status(400)
          .json({ message: "Invalid date format. Use DD-MM-YYYY" });
      }

      const filter = {};

      if (periodId && mongoose.Types.ObjectId.isValid(periodId)) {
        filter.period = new mongoose.Types.ObjectId(periodId);
      }

      // Filter entries specifically by the given date
      const parsedYear = Number(year);
      const parsedMonth = Number(month);
      const parsedDay = Number(day);

      const startDate = new Date(parsedYear, parsedMonth - 1, parsedDay);
      const endDate = new Date(
        parsedYear,
        parsedMonth - 1,
        parsedDay,
        23,
        59,
        59,
        999,
      );

      filter.date = {
        $gte: startDate,
        $lte: endDate,
      };
      filter.isActive = true; // Only fetch active entries

      const entries = await Entry.find(filter)
        .populate("lotNo", "name")
        .populate("design", "name")
        .populate("color", "name")
        .populate("type", "name")
        .populate("singer", "firstName lastName")
        .populate("machineNo", "name")
        .populate("overlockPerson", "firstName lastName")
        .populate("dhaga", "firstName lastName")
        .sort({ date: 1 });

      const totalPcs = entries.reduce(
        (sum, entry) => sum + (entry.pcs || 0),
        0,
      );

      res
        .status(200)
        .json({ date, totalEntries: entries.length, totalPcs, entries });
    } catch (error) {
      console.error("Error fetching entries by specific date:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getEntryCount: async (req, res) => {
    try {
      const totalEntries = await Entry.countDocuments();
      res.status(200).json({ totalEntries });
    } catch (error) {
      console.error("Error fetching entry count:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  exportAllEntriesToExcel: async (req, res) => {
    try {
      const entries = await Entry.find()
        .populate("period", "name _id")
        .populate("lotNo", "name _id")
        .populate("design", "name _id")
        .populate("color", "name _id")
        .populate("type", "name _id")
        .populate("singer", "firstName lastName _id")
        .populate("machineNo", "name _id")
        .populate("overlockPerson", "firstName lastName _id")
        .populate("dhaga", "firstName lastName _id")
        .sort({ date: 1 });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Entries");

      worksheet.columns = [
        { header: "Entry ID", key: "id", width: 25 },
        { header: "Date", key: "date", width: 15 },

        { header: "Period", key: "period", width: 15 },

        { header: "Lot No", key: "lotNo", width: 15 },
        { header: "Pcs", key: "pcs", width: 10 },

        { header: "Design", key: "design", width: 20 },

        { header: "Color", key: "color", width: 15 },

        { header: "Type", key: "type", width: 15 },

        { header: "Singer", key: "singer", width: 25 },
        { header: "Rate", key: "rate", width: 10 },

        { header: "Machine No", key: "machineNo", width: 15 },

        { header: "Overlock Person", key: "overlockPerson", width: 25 },
        { header: "Rate 15", key: "rate15", width: 10 },

        { header: "Dhaga", key: "dhaga", width: 25 },
        { header: "Note", key: "note", width: 30 },
        { header: "Period ID", key: "periodId", width: 25 },
        { header: "Lot No ID", key: "lotNoId", width: 25 },
        { header: "Design ID", key: "designId", width: 25 },
        { header: "Color ID", key: "colorId", width: 25 },
        { header: "Type ID", key: "typeId", width: 25 },
        { header: "Singer ID", key: "singerId", width: 25 },
        { header: "Machine No ID", key: "machineNoId", width: 25 },
        { header: "Overlock Person ID", key: "overlockPersonId", width: 25 },
        { header: "Dhaga ID", key: "dhagaId", width: 25 },
      ];

      entries.forEach((entry) => {
        worksheet.addRow({
          id: entry._id ? entry._id.toString() : "",
          date: entry.date
            ? new Date(entry.date)
                .toLocaleDateString("en-GB")
                .replace(/\//g, "-")
            : "",
          periodId: entry.period?._id ? entry.period._id.toString() : "",
          period: entry.period?.name || "",
          lotNoId: entry.lotNo?._id ? entry.lotNo._id.toString() : "-",
          lotNo: entry.lotNo?.name || "-",
          pcs: entry.pcs || 0,
          designId: entry.design?._id ? entry.design._id.toString() : "",
          design: entry.design?.name || "",
          colorId: entry.color?._id ? entry.color._id.toString() : "",
          color: entry.color?.name || "",
          typeId: entry.type?._id ? entry.type._id.toString() : "",
          type: entry.type?.name || "",
          singerId: entry.singer?._id ? entry.singer._id.toString() : "",
          singer: entry.singer
            ? `${entry.singer.firstName} ${entry.singer.lastName}`
            : "",
          rate: entry.rate || 0,
          machineNoId: entry.machineNo?._id
            ? entry.machineNo._id.toString()
            : "",
          machineNo: entry.machineNo?.name || "",
          overlockPersonId: entry.overlockPerson?._id
            ? entry.overlockPerson._id.toString()
            : "",
          overlockPerson: entry.overlockPerson
            ? `${entry.overlockPerson.firstName} ${entry.overlockPerson.lastName}`
            : "",
          rate15: entry.rate15 || 0,
          dhagaId: entry.dhaga?._id ? entry.dhaga._id.toString() : "",
          dhaga: entry.dhaga
            ? `${entry.dhaga.firstName} ${entry.dhaga.lastName}`
            : "",
          note: entry.note || "",
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Entries.xlsx"',
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default controller;
