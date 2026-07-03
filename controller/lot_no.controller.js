import LotNo from "../model/lot_no.model.js";

const controller = {
  addLotNo: async (req, res) => {
    try {
      const { name, description } = req.body;

      // Check if the lotNo already exists
      const existingLotNo = await LotNo.findOne({ name });
      if (existingLotNo) {
        return res.status(400).json({ message: "Lot Number already exists" });
      }

      // Create a new lotNo
      const newLotNo = new LotNo({ name, description });
      await newLotNo.save();

      res.status(201).json({ message: "Lot Number added successfully", lotNo: newLotNo });
    } catch (error) {
      console.error("Error adding lot number:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllLotNos: async (req, res) => {
    try {
      const lotNos = await LotNo.find();
      res.status(200).json({ lotNos });
    } catch (error) {
      console.error("Error fetching lot numbers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getLotNoById: async (req, res) => {
    try {
      const { id } = req.params;
      const lotNo = await LotNo.findById(id);
      if (!lotNo) {
        return res.status(404).json({ message: "Lot Number not found" });
      }
      res.status(200).json({ lotNo });
    } catch (error) {
      console.error("Error fetching lot number by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateLotNo: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Check if the lotNo exists
      const existingLotNo = await LotNo.findById(id);
      if (!existingLotNo) {
        return res.status(404).json({ message: "Lot Number not found" });
      }

      // Update the lotNo
      existingLotNo.name = name || existingLotNo.name;
      existingLotNo.description = description !== undefined ? description : existingLotNo.description;
      await existingLotNo.save();

      res.status(200).json({ message: "Lot Number updated successfully", name: existingLotNo });
    } catch (error) {
      console.error("Error updating lot number:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteLotNo: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the lotNo exists
      const existingLotNo = await LotNo.findById(id);
      if (!existingLotNo) {
        return res.status(404).json({ message: "Lot Number not found" });
      }

      // Delete the lotNo
      await LotNo.findByIdAndDelete(id);

      res.status(200).json({ message: "Lot Number deleted successfully" });
    } catch (error) {
      console.error("Error deleting lot number:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export default controller;
