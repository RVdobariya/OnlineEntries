import Color from "../model/color.model.js";

const controller = {
  addColor: async (req, res) => {
    try {
      const { name, hexCode } = req.body;

      // Check if the color already exists
      const existingColor = await Color.findOne({ name });
      if (existingColor) {
        return res.status(400).json({ message: "Color already exists" });
      }


      // Validate hex code format
      if (hexCode && !/^#[0-9A-F]{6}$/i.test(hexCode)) {
        return res.status(400).json({ message: "Invalid hex color code format. Use #RRGGBB format." });
      }

      // Create a new color
      const newColor = new Color({ name, hexCode: hexCode ? hexCode.toUpperCase() : null});
      await newColor.save();

      res.status(201).json({ message: "Color added successfully", color: newColor });
    } catch (error) {
      console.error("Error adding color:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllColors: async (req, res) => {
    try {
      const colors = await Color.find();
      res.status(200).json({ colors });
    } catch (error) {
      console.error("Error fetching colors:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getColorById: async (req, res) => {
    try {
      const { id } = req.params;
      const color = await Color.findById(id);
      if (!color) {
        return res.status(404).json({ message: "Color not found" });
      }
      res.status(200).json({ color });
    } catch (error) {
      console.error("Error fetching color by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateColor: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, hexCode } = req.body;

      // Check if the color exists
      const existingColor = await Color.findById(id);
      if (!existingColor) {
        return res.status(404).json({ message: "Color not found" });
      }

      if(existingColor.isActive === false){
        return res.status(403).json({ status : false, message: "Color is InActive." });
      }

      // Validate hex code format if provided
      if (hexCode && !/^#[0-9A-F]{6}$/i.test(hexCode)) {
        return res.status(400).json({ message: "Invalid hex color code format. Use #RRGGBB format." });
      }

      // Update the color
      existingColor.name = name || existingColor.name;
      existingColor.hexCode = hexCode ? hexCode.toUpperCase() : existingColor.hexCode;
      await existingColor.save();

      res.status(200).json({ message: "Color updated successfully", color: existingColor });
    } catch (error) {
      console.error("Error updating color:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteColor: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the color exists
      const existingColor = await Color.findById(id);
      if (!existingColor) {
        return res.status(404).json({ message: "Color not found" });
      }

      // Delete the color
      await Color.findByIdAndDelete(id);

      res.status(200).json({ message: "Color deleted successfully" });
    } catch (error) {
      console.error("Error deleting color:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export default controller;