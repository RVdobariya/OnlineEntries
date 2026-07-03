import User from "./model/user.model.js";
import Role from "./model/role.model.js";
import crypto from "crypto";

// Helper function to hash password
const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

const createAdminUser = async () => {
  try {
    // Check if admin role exists, create if not
    let adminRole = await Role.findOne({ name: "admin" });
    if (!adminRole) {
      adminRole = new Role({ name: "admin" });
      await adminRole.save();
      console.log("✅ Admin role created");
    }

    // Admin user configuration
    const adminMobileNumber = "8511767722";
    const existingAdmin = await User.findOne({
      $or: [
        { mobileNumber: adminMobileNumber },
      ],
    });
    if (existingAdmin) {
      console.log("❌ Admin user already exists");
      return;
    }

    // Create admin user
    const hashedPassword = hashPassword("Admin@123");
    const adminUser = new User({
      firstName: "Admin",
      lastName: "User",
      mobileNumber: adminMobileNumber,
      password: hashedPassword,
      role: adminRole._id,
      isActive: true,
    });

    await adminUser.save();
    console.log("✅ Admin user created successfully");
    console.log(`📧 Mobile Number: ${adminMobileNumber}`);
    console.log("🔑 Password: Admin@123");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
  }
};

export default createAdminUser;
