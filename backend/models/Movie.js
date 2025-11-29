const mongoose = require("mongoose");

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: String,
    required: true,
    trim: true,
  },
  hall: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    required: true,
  },
  showtimes: [
    {
      date: {
        type: String, // YYYY-MM-DD format
        required: true,
      },
      time: {
        type: String, // HH:MM format
        required: true,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
        default: 15, // Default price per seat
      },
    },
  ],
  // Backward compatibility - keep times field for existing data
  times: [
    {
      type: String,
    },
  ],
  genre: {
    type: String,
    trim: true,
    default: "",
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "coming-soon"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
movieSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Movie = mongoose.model("Movie", movieSchema);

module.exports = Movie;
