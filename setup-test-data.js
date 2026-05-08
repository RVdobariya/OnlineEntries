import mongoose from "mongoose";
import User from "./model/user.model.js";
import Role from "./model/role.model.js";
import Design from "./model/design.model.js";
import Color from "./model/color.model.js";
import Type from "./model/type.model.js";
import Machine from "./model/machine.model.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const setupTestData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");

    // Create/Get Roles
    let singerRole = await Role.findOne({ name: "singer" });
    if (!singerRole) {
      singerRole = new Role({ name: "singer" });
      await singerRole.save();
      console.log("✅ Singer role created");
    }

    let dhagaRole = await Role.findOne({ name: "dhaga" });
    if (!dhagaRole) {
      dhagaRole = new Role({ name: "dhaga" });
      await dhagaRole.save();
      console.log("✅ Dhaga role created");
    }

    // Create Singer Users
    const singers = ["singer1@example.com", "singer2@example.com", "singer3@example.com"];
    for (const email of singers) {
      const existingSinger = await User.findOne({ email });
      if (!existingSinger) {
        const singer = new User({
          firstName: email.split("@")[0],
          lastName: "Singer",
          email,
          password: hashPassword("password123"),
          role: singerRole._id,
          isActive: true,
        });
        await singer.save();
        console.log(`✅ Singer user created: ${email}`);
      }
    }

    // Create Dhaga Users
    const dhagas = ["dhaga1@example.com", "dhaga2@example.com"];
    for (const email of dhagas) {
      const existingDhaga = await User.findOne({ email });
      if (!existingDhaga) {
        const dhaga = new User({
          firstName: email.split("@")[0],
          lastName: "Dhaga",
          email,
          password: hashPassword("password123"),
          role: dhagaRole._id,
          isActive: true,
        });
        await dhaga.save();
        console.log(`✅ Dhaga user created: ${email}`);
      }
    }

    // Create Designs
    const designNames = ["T-Shirt Design", "Shirt Design", "Pant Design"];
    for (const name of designNames) {
      const existingDesign = await Design.findOne({ name });
      if (!existingDesign) {
        const design = new Design({
          name,
          description: `${name} for apparel manufacturing`,
        });
        await design.save();
        console.log(`✅ Design created: ${name}`);
      }
    }

    // Create Colors
    const colors = [
      { name: "Red", hexCode: "#FF0000" },
      { name: "Blue", hexCode: "#0000FF" },
      { name: "Green", hexCode: "#00FF00" },
      { name: "Black", hexCode: "#000000" },
      { name: "White", hexCode: "#FFFFFF" },
    ];
    for (const color of colors) {
      const existingColor = await Color.findOne({ name: color.name });
      if (!existingColor) {
        const newColor = new Color({
          name: color.name,
          hexCode: color.hexCode,
        });
        await newColor.save();
        console.log(`✅ Color created: ${color.name}`);
      }
    }

    // Create Types
    const typeNames = ["Premium", "Standard", "Budget"];
    for (const name of typeNames) {
      const existingType = await Type.findOne({ name });
      if (!existingType) {
        const type = new Type({
          name,
          category: "Apparel Type",
        });
        await type.save();
        console.log(`✅ Type created: ${name}`);
      }
    }

    // Create Machines
    const machines = [
      { machineNo: "M001", name: "Machine 1", status: "active" },
      { machineNo: "M002", name: "Machine 2", status: "active" },
      { machineNo: "M003", name: "Machine 3", status: "active" },
      { machineNo: "M004", name: "Machine 4", status: "inactive" },
    ];
    for (const machine of machines) {
      const existingMachine = await Machine.findOne({ machineNo: machine.machineNo });
      if (!existingMachine) {
        const newMachine = new Machine({
          machineNo: machine.machineNo,
          name: machine.name,
          status: machine.status,
        });
        await newMachine.save();
        console.log(`✅ Machine created: ${machine.machineNo}`);
      }
    }

    console.log("\n✅ Test data setup completed successfully!");
    console.log("\n📋 Test Data Summary:");
    console.log("- Admin user: admin@example.com / admin123");
    console.log("- Singer users: singer1@example.com, singer2@example.com, singer3@example.com / password123");
    console.log("- Dhaga users: dhaga1@example.com, dhaga2@example.com / password123");
    console.log("- Designs: T-Shirt Design, Shirt Design, Pant Design");
    console.log("- Colors: Red, Blue, Green, Black, White");
    console.log("- Types: Premium, Standard, Budget");
    console.log("- Machines: M001, M002, M003, M004");

  } catch (error) {
    console.error("❌ Error setting up test data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
};

setupTestData();