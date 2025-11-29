const bcrypt = require("bcryptjs");

// In-memory admin storage (fallback when MongoDB is not available)
let adminData = null;

// Initialize with properly hashed password
const initializeAdmin = async () => {
  if (!adminData) {
    const hashedPassword = await bcrypt.hash("Admin@123456", 10);
    adminData = {
      _id: "admin_001",
      email: "cine@admin.com",
      password: hashedPassword,
      role: "admin",
    };
    console.log("✓ In-memory admin initialized");
    console.log("  Email: cine@admin.com");
    console.log("  Password: Admin@123456");
  }
};

// Admin model methods for fallback
const AdminFallback = {
  async findOne(query) {
    await initializeAdmin();
    if (query.email && query.email.toLowerCase() === adminData.email) {
      return {
        ...adminData,
        comparePassword: async function (password) {
          return await bcrypt.compare(password, this.password);
        },
      };
    }
    return null;
  },

  async findById(id) {
    await initializeAdmin();
    if (id === adminData._id) {
      return {
        ...adminData,
        comparePassword: async function (password) {
          return await bcrypt.compare(password, this.password);
        },
        save: async function () {
          adminData.password = this.password;
          return this;
        },
      };
    }
    return null;
  },

  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  },
};

module.exports = AdminFallback;
