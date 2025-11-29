const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Movie = require("../models/Movie");
const Hall = require("../models/Hall");
const { authenticateToken } = require("../middleware/auth");

// Get dashboard statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // Count total movies
    const totalMovies = await Movie.countDocuments();

    // Count total halls from Hall model
    const totalHalls = await Hall.countDocuments();

    // Count total reservations
    const totalReservations = await Booking.countDocuments();

    res.json({
      totalMovies,
      totalHalls,
      totalReservations,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard statistics" });
  }
});

// Get recent activity
router.get("/activity", authenticateToken, async (req, res) => {
  try {
    // Get recent bookings with customer and movie details
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "movieTitle customerName customerPhone createdAt status isValidated validatedAt validatedBy"
      );

    // Format the data for display
    const recentActivity = recentBookings.map((booking) => {
      let action = "New Reservation";

      if (booking.isValidated && booking.validatedAt) {
        action = "Ticket Validated";
      } else if (booking.status === "cancelled") {
        action = "Reservation Cancelled";
      }

      return {
        _id: booking._id,
        action: action,
        movieTitle: booking.movieTitle,
        customerName: booking.customerName || "Unknown Customer",
        customerPhone: booking.customerPhone,
        createdAt: booking.validatedAt || booking.createdAt,
        user: booking.validatedBy || booking.customerName || "Customer",
      };
    });

    res.json(recentActivity);
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ message: "Error fetching recent activity" });
  }
});

module.exports = router;
