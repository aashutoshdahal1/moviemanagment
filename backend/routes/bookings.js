const express = require("express");
const { body, validationResult } = require("express-validator");
const Booking = require("../models/Booking");
const { authenticateUserToken } = require("./userAuth");
const { authenticateToken } = require("../middleware/auth"); // Admin auth

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private (User)
router.post(
  "/",
  authenticateUserToken,
  [
    body("movieTitle").notEmpty().withMessage("Movie title is required"),
    body("seats")
      .isArray({ min: 1 })
      .withMessage("At least one seat must be selected"),
    body("date").notEmpty().withMessage("Show date is required"),
    body("time").notEmpty().withMessage("Show time is required"),
    body("totalPrice").isNumeric().withMessage("Total price must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const {
        movieTitle,
        movieDuration,
        movieImageUrl,
        hall,
        seats,
        date,
        time,
        totalPrice,
        pricePerSeat,
      } = req.body;

      // Generate booking ID
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      const bookingId = `RES-${timestamp}-${random}`;

      // Create new booking with simplified structure to match UserDashboard expectations
      const booking = new Booking({
        bookingId,
        user: req.user._id,
        movie: {
          title: movieTitle,
          duration: movieDuration,
          hall: hall || "Theater 1",
          imageUrl: movieImageUrl,
        },
        seats,
        showtime: {
          date,
          time,
        },
        pricing: {
          pricePerSeat: pricePerSeat || totalPrice / seats.length,
          totalSeats: seats.length,
          totalAmount: totalPrice,
        },
        theater: hall || "Theater 1",
        status: "confirmed", // Auto-confirm since no payment integration
      });

      await booking.save();

      // Populate user info for response
      await booking.populate("user", "name email phone");

      res.status(201).json({
        success: true,
        message: "Booking created successfully",
        booking: {
          _id: booking._id,
          bookingId: booking.bookingId,
          userId: booking.user,
          movieTitle: booking.movie.title,
          movieDuration: booking.movie.duration,
          movieImageUrl: booking.movie.imageUrl,
          hall: booking.movie.hall,
          seats: booking.seats,
          date: booking.showtime.date,
          time: booking.showtime.time,
          totalPrice: booking.pricing.totalAmount,
          status: booking.status,
          createdAt: booking.bookedAt,
        },
      });
    } catch (error) {
      console.error("Booking creation error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during booking creation",
        error: error.message,
      });
    }
  }
);

// @route   GET /api/bookings/showtime
// @desc    Get bookings for specific movie, date, and time (for seat availability)
// @access  Public (needed to check seat availability)
router.get("/showtime", async (req, res) => {
  try {
    const { movie, date, time } = req.query;

    if (!movie || !date || !time) {
      return res.status(400).json({
        success: false,
        message: "Movie, date, and time are required",
      });
    }

    const bookings = await Booking.find({
      "movie.title": movie,
      "showtime.date": date,
      "showtime.time": time,
      status: { $in: ["confirmed", "pending"] }, // Only confirmed and pending bookings
    }).select("seats bookingId");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching showtime bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching showtime bookings",
    });
  }
});

// @route   GET /api/bookings/user
// @desc    Get user's bookings
// @access  Private (User)
router.get("/user", authenticateUserToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("user", "name email")
      .sort({ bookedAt: -1 });

    // Transform bookings to match UserDashboard expectations
    const transformedBookings = bookings.map((booking) => ({
      _id: booking._id,
      bookingId: booking.bookingId,
      userId: booking.user,
      movieTitle: booking.movie.title,
      movieDuration: booking.movie.duration,
      movieImageUrl: booking.movie.imageUrl,
      hall: booking.movie.hall,
      seats: booking.seats,
      date: booking.showtime.date,
      time: booking.showtime.time,
      totalPrice: booking.pricing.totalAmount,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      createdAt: booking.bookedAt,
    }));

    res.json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
});

// @route   GET /api/bookings/admin/all
// @desc    Get all bookings for admin
// @access  Private (Admin)
router.get("/admin/all", authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate("user", "name email phone")
      .sort({ bookedAt: -1 });

    // Transform bookings to match ReservationManagement expectations
    const transformedBookings = bookings.map((booking) => ({
      _id: booking._id,
      bookingId: booking.bookingId,
      userId: booking.user,
      movieTitle: booking.movie.title,
      movieDuration: booking.movie.duration,
      movieImageUrl: booking.movie.imageUrl,
      hall: booking.movie.hall,
      seats: booking.seats,
      date: booking.showtime.date,
      time: booking.showtime.time,
      totalPrice: booking.pricing.totalAmount,
      status: booking.status,
      isValidated: booking.isValidated,
      validatedAt: booking.validatedAt,
      validatedBy: booking.validatedBy,
      createdAt: booking.bookedAt,
    }));

    res.json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
});

// @route   GET /api/bookings
// @desc    Get all bookings (Admin only)
// @access  Private (Admin)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { status, date, search } = req.query;
    let query = {};

    // Filter by status
    if (status && status !== "all") {
      query.status = status;
    }

    // Filter by date
    if (date) {
      query["showtime.date"] = date;
    }

    // Search by booking ID or user email
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [{ bookingId: searchRegex }, { "movie.title": searchRegex }];
    }

    const bookings = await Booking.find(query)
      .populate("user", "name email phone")
      .sort({ bookedAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
});

// @route   PUT /api/bookings/admin/:id/status
// @desc    Update booking status (Admin only)
// @access  Private (Admin)
router.put("/admin/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, confirmed, or cancelled",
      });
    }

    // Find by MongoDB ObjectId
    const booking = await Booking.findById(id).populate(
      "user",
      "name email phone"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: "Booking status updated successfully",
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating booking status",
    });
  }
});

// @route   PUT /api/bookings/admin/:id/validate
// @desc    Mark booking as validated/checked (Admin only)
// @access  Private (Admin)
router.put("/admin/:id/validate", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { isValidated, adminName } = req.body;

    // Find by MongoDB ObjectId
    const booking = await Booking.findById(id).populate(
      "user",
      "name email phone"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    booking.isValidated = isValidated;
    booking.validatedAt = isValidated ? new Date() : null;
    booking.validatedBy = isValidated ? adminName || "Admin" : null;

    // Update status based on validation
    booking.status = isValidated ? "confirmed" : "cancelled";
    if (!isValidated) {
      booking.cancellationReason = "admin_cancelled";
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking ${
        isValidated ? "validated and confirmed" : "unvalidated and cancelled"
      } successfully`,
      booking: {
        _id: booking._id,
        bookingId: booking.bookingId,
        isValidated: booking.isValidated,
        validatedAt: booking.validatedAt,
        validatedBy: booking.validatedBy,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Error validating booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error while validating booking",
    });
  }
});

// @route   GET /api/bookings/:bookingId
// @desc    Get booking by ID (Admin validation)
// @access  Private (Admin)
router.get("/:bookingId", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findOne({ bookingId }).populate(
      "user",
      "name email phone"
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    res.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching booking",
    });
  }
});

// @route   DELETE /api/bookings/:bookingId
// @desc    Cancel booking
// @access  Private (User can cancel own booking, Admin can cancel any)
router.delete("/:bookingId", async (req, res) => {
  try {
    const { bookingId } = req.params;
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization token provided",
      });
    }

    // Check if it's user or admin token
    const token = authHeader.replace("Bearer ", "");
    let userId = null;
    let isAdmin = false;

    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "fallback_secret_key"
      );

      if (decoded.userId) {
        // User token
        userId = decoded.userId;
      } else if (decoded.id) {
        // Admin token
        isAdmin = true;
      }
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin
    if (!isAdmin && booking.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    booking.status = "cancelled";
    booking.cancellationReason = isAdmin ? "admin_cancelled" : "user_cancelled";
    await booking.save();

    res.json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cancelling booking",
    });
  }
});

module.exports = router;
