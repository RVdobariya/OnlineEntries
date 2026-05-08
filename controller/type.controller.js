import Type from "../model/type.model.js";

const controller = {
  addType: async (req, res) => {
    try {
      const { name, category } = req.body;

      // Check if the type already exists
      const existingType = await Type.findOne({ name });
      if (existingType) {
        return res.status(400).json({ message: "Type already exists" });
      }

      // Create a new type
      const newType = new Type({ name, category });
      await newType.save();

      res.status(201).json({ message: "Type added successfully", type: newType });
    } catch (error) {
      console.error("Error adding type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllTypes: async (req, res) => {
    try {
      const types = await Type.find();
      res.status(200).json({ types });
    } catch (error) {
      console.error("Error fetching types:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getTypeById: async (req, res) => {
    try {
      const { id } = req.params;
      const type = await Type.findById(id);
      if (!type) {
        return res.status(404).json({ message: "Type not found" });
      }
      res.status(200).json({ type });
    } catch (error) {
      console.error("Error fetching type by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateType: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, category } = req.body;

      // Check if the type exists
      const existingType = await Type.findById(id);
      if (!existingType) {
        return res.status(404).json({ message: "Type not found" });
      }

      // Update the type
      existingType.name = name || existingType.name;
      existingType.category = category !== undefined ? category : existingType.category;
      await existingType.save();

      res.status(200).json({ message: "Type updated successfully", type: existingType });
    } catch (error) {
      console.error("Error updating type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteType: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the type exists
      const existingType = await Type.findById(id);
      if (!existingType) {
        return res.status(404).json({ message: "Type not found" });
      }

      // Delete the type
      await Type.findByIdAndDelete(id);

      res.status(200).json({ message: "Type deleted successfully" });
    } catch (error) {
      console.error("Error deleting type:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export default controller;