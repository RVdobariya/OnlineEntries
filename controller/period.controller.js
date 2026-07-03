import Period from "../model/period.model.js";

const controller = {
  addPeriod: async (req, res) => {
    try {
      const { year, month } = req.body;

      // Validation
      if (!year || !month) {
        return res.status(400).json({ message: "Year and month are required" });
      }

      const yearNum = Number(year);
      const monthNum = Number(month);

      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        return res.status(400).json({ message: "Year must be between 1900 and 2100" });
      }

      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({ message: "Month must be between 1 and 12" });
      }

      const name = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;

      // Check if period already exists
      const existingPeriod = await Period.findOne({ name });
      if (existingPeriod) {
        return res.status(400).json({ message: "Period already exists" });
      }

      // Create new period
      const newPeriod = new Period({
        year: yearNum,
        month: monthNum,
        name,
      });

      await newPeriod.save();

      res.status(201).json({ message: "Period added successfully", period: newPeriod });
    } catch (error) {
      console.error("Error adding period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllPeriods: async (req, res) => {
    try {
      const periods = await Period.find().sort({ year: -1, month: -1 }).select("-__v -createdAt -updatedAt -isActive");
      res.status(200).json({ periods });
    } catch (error) {
      console.error("Error fetching periods:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getPeriodById: async (req, res) => {
    try {
      const { id } = req.params;
      const period = await Period.findById(id);

      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      res.status(200).json({ period });
    } catch (error) {
      console.error("Error fetching period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getCurrentPeriod: async (req, res) => {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const period = await Period.findOne({ year, month }).select("_id name year month");
      if (!period) {
        return res.status(404).json({ message: "Current period not found" });
      }

      const currentDate = `${now.getDate().toString().padStart(2, '0')}-${(month).toString().padStart(2, '0')}-${year}`;

      res.status(200).json( { ...period.toObject(), currentDate } );
    } catch (error) {
      console.error("Error fetching current period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updatePeriod: async (req, res) => {
    try {
      const { id } = req.params;
      const { year, month, isActive } = req.body;

      const period = await Period.findById(id);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      // If updating year or month, validate and update name
      if (year !== undefined || month !== undefined) {
        const newYear = year !== undefined ? Number(year) : period.year;
        const newMonth = month !== undefined ? Number(month) : period.month;

        if (isNaN(newYear) || newYear < 1900 || newYear > 2100) {
          return res.status(400).json({ message: "Year must be between 1900 and 2100" });
        }

        if (isNaN(newMonth) || newMonth < 1 || newMonth > 12) {
          return res.status(400).json({ message: "Month must be between 1 and 12" });
        }

        const newName = `${newYear}-${newMonth.toString().padStart(2, '0')}`;

        // Check if new name conflicts with existing period (excluding current)
        const existingPeriod = await Period.findOne({ name: newName, _id: { $ne: id } });
        if (existingPeriod) {
          return res.status(400).json({ message: "Period already exists" });
        }

        period.year = newYear;
        period.month = newMonth;
        period.name = newName;
      }

      if (isActive !== undefined) {
        period.isActive = isActive;
      }

      await period.save();

      res.status(200).json({ message: "Period updated successfully", period });
    } catch (error) {
      console.error("Error updating period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deletePeriod: async (req, res) => {
    try {
      const { id } = req.params;

      const period = await Period.findById(id);
      if (!period) {
        return res.status(404).json({ message: "Period not found" });
      }

      await Period.findByIdAndDelete(id);

      res.status(200).json({ message: "Period deleted successfully" });
    } catch (error) {
      console.error("Error deleting period:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
};

export default controller;