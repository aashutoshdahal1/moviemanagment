const Admin = require("../models/Admin");
const AdminFallback = require("../models/AdminFallback");
const { isConnected } = require("../config/database");

const seedDefaultAdmin = async () => {
  try {
    // Wait a bit for MongoDB connection to stabilize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (isConnected()) {
      // MongoDB is available, use regular Admin model
      const existingAdmin = await Admin.findOne({});

      if (!existingAdmin) {
        const defaultPassword = await Admin.hashPassword("Admin@123456");

        const defaultAdmin = new Admin({
          email: "cine@admin.com",
          password: defaultPassword,
        });

        await defaultAdmin.save();
        console.log("✓ MongoDB: Default admin created successfully");
        console.log("  Email: cine@admin.com");
        console.log("  Password: Admin@123456");
      } else {
        console.log("✓ MongoDB: Admin user already exists");
        console.log("  Email:", existingAdmin.email);
      }
    } else {
      // MongoDB not available, fallback is automatically initialized
      console.log("✓ Fallback: Admin initialized in memory");
      console.log("  Email: cine@admin.com");
      console.log("  Password: Admin@123456");
    }
  } catch (error) {
    console.error("Error seeding default admin:", error);
    console.log("✓ Fallback: Using in-memory admin storage");
  }
};

module.exports = { seedDefaultAdmin };
