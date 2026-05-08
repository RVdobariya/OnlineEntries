import Design from "../model/design.model.js";

const controller = {
  addDesign: async (req, res) => {
    try {
      const { name, description } = req.body;

      // Check if the design already exists
      const existingDesign = await Design.findOne({ name });
      if (existingDesign) {
        return res.status(400).json({ message: "Design already exists" });
      }

      // Create a new design
      const newDesign = new Design({ name, description });
      await newDesign.save();

      res.status(201).json({ message: "Design added successfully", design: newDesign });
    } catch (error) {
      console.error("Error adding design:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getAllDesigns: async (req, res) => {
    try {
      const designs = await Design.find();
      res.status(200).json({ designs });
    } catch (error) {
      console.error("Error fetching designs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  getDesignById: async (req, res) => {
    try {
      const { id } = req.params;
      const design = await Design.findById(id);
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.status(200).json({ design });
    } catch (error) {
      console.error("Error fetching design by ID:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  updateDesign: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      // Check if the design exists
      const existingDesign = await Design.findById(id);
      if (!existingDesign) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Update the design
      existingDesign.name = name || existingDesign.name;
      existingDesign.description = description !== undefined ? description : existingDesign.description;
      await existingDesign.save();

      res.status(200).json({ message: "Design updated successfully", design: existingDesign });
    } catch (error) {
      console.error("Error updating design:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },

  deleteDesign: async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the design exists
      const existingDesign = await Design.findById(id);
      if (!existingDesign) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Delete the design
      await Design.findByIdAndDelete(id);

      res.status(200).json({ message: "Design deleted successfully" });
    } catch (error) {
      console.error("Error deleting design:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export default controller;