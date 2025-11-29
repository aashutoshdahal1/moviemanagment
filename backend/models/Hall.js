const mongoose = require("mongoose");

const hallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hall name is required"],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, "Hall capacity is required"],
      min: [1, "Capacity must be at least 1"],
    },
    type: {
      type: String,
      required: [true, "Hall type is required"],
      enum: ["Standard", "IMAX", "VIP", "Premium"],
      default: "Standard",
    },
    status: {
      type: String,
      enum: ["Active", "Maintenance", "Inactive"],
      default: "Active",
    },
    description: {
      type: String,
      trim: true,
    },
    amenities: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
hallSchema.index({ name: 1 });
hallSchema.index({ status: 1 });

module.exports = mongoose.model("Hall", hallSchema);
