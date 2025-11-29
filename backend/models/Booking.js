const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    unique: true,
    // Don't make it required since we generate it in pre-save hook
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  movie: {
    id: String,
    title: {
      type: String,
      required: true,
    },
    duration: String,
    hall: String,
    imageUrl: String,
  },
  seats: [
    {
      type: String,
      required: true,
    },
  ],
  showtime: {
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
  },
  pricing: {
    pricePerSeat: {
      type: Number,
      required: true,
    },
    totalSeats: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  theater: {
    type: String,
    default: "Grand Cinema 6",
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "cancelled"],
    default: "pending",
  },
  isValidated: {
    type: Boolean,
    default: false,
  },
  validatedAt: {
    type: Date,
    default: null,
  },
  validatedBy: {
    type: String, // Admin name or ID who validated
    default: null,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  cancellationReason: {
    type: String,
    enum: ["user_cancelled", "admin_cancelled", "movie_deleted", "other"],
    default: null,
  },
});

// Update the updatedAt field before saving
bookingSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Generate booking ID before saving
bookingSchema.pre("save", function (next) {
  if (!this.bookingId) {
    // Generate a more robust booking ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingId = `RES-${timestamp}-${random}`;
  }
  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

module.exports = Booking;
