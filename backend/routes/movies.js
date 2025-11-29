const express = require("express");
const { body, validationResult } = require("express-validator");
const Movie = require("../models/Movie");
const Booking = require("../models/Booking");
const { upload } = require("../middleware/upload");
const { authenticateToken } = require("../middleware/auth");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// @route   GET /api/movies
// @desc    Get all movies
// @access  Public
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find({ status: { $ne: "inactive" } }).sort({
      createdAt: -1,
    });

    // Add full image URL to each movie
    const moviesWithImageURL = movies.map((movie) => ({
      ...movie.toObject(),
      imageUrl: `${req.protocol}://${req.get(
        "host"
      )}/uploads/movies/${path.basename(movie.image)}`,
    }));

    res.json({
      success: true,
      movies: moviesWithImageURL,
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching movies",
    });
  }
});

// @route   POST /api/movies
// @desc    Create new movie
// @access  Private (Admin only)
router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  [
    body("title").trim().notEmpty().withMessage("Movie title is required"),
    body("duration").trim().notEmpty().withMessage("Duration is required"),
    body("hall").trim().notEmpty().withMessage("Hall is required"),
    body("showtimes")
      .optional()
      .custom((value) => {
        if (!value) return true; // Optional field
        if (Array.isArray(value)) {
          return (
            value.length > 0 &&
            value.every(
              (st) =>
                st.date &&
                st.time &&
                (st.price === undefined ||
                  (typeof st.price === "number" && st.price >= 0))
            )
          );
        }
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return (
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              parsed.every(
                (st) =>
                  st.date &&
                  st.time &&
                  (st.price === undefined ||
                    (typeof st.price === "number" && st.price >= 0))
              )
            );
          } catch (e) {
            return false;
          }
        }
        return false;
      })
      .withMessage(
        "Showtimes must be an array with date, time, and optional price (must be >= 0)"
      ),
    body("times")
      .optional()
      .custom((value) => {
        if (!value) return true; // Optional for backward compatibility
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        if (typeof value === "string") {
          try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) && parsed.length > 0;
          } catch (e) {
            return false;
          }
        }
        return false;
      })
      .withMessage("At least one showtime is required"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Delete uploaded file if validation fails
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      // Check if image was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Movie image is required",
        });
      }

      const {
        title,
        duration,
        hall,
        times,
        showtimes,
        genre,
        description,
        status,
      } = req.body;

      // Parse showtimes if it's a string (from form submission)
      let parsedShowtimes = showtimes;
      if (showtimes && typeof showtimes === "string") {
        try {
          parsedShowtimes = JSON.parse(showtimes);
        } catch (e) {
          parsedShowtimes = [];
        }
      }

      // Ensure price field exists and is valid for each showtime
      if (parsedShowtimes && Array.isArray(parsedShowtimes)) {
        parsedShowtimes = parsedShowtimes.map((showtime) => ({
          ...showtime,
          price:
            showtime.price !== undefined && showtime.price >= 0
              ? showtime.price
              : 15,
        }));
      }

      // Parse times if it's a string (for backward compatibility)
      let parsedTimes = times;
      if (times && typeof times === "string") {
        try {
          parsedTimes = JSON.parse(times);
        } catch (e) {
          parsedTimes = times.split(",").map((time) => time.trim());
        }
      }

      // Ensure at least one of showtimes or times is provided
      if (!parsedShowtimes?.length && !parsedTimes?.length) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "At least one showtime is required",
        });
      }

      const newMovie = new Movie({
        title,
        duration,
        hall,
        image: req.file.filename,
        showtimes: parsedShowtimes || [],
        times: parsedTimes || [],
        genre: genre || "",
        description: description || "",
        status: status || "active",
      });

      await newMovie.save();

      // Return movie with full image URL
      const movieWithImageURL = {
        ...newMovie.toObject(),
        imageUrl: `${req.protocol}://${req.get("host")}/uploads/movies/${
          newMovie.image
        }`,
      };

      res.status(201).json({
        success: true,
        message: "Movie created successfully",
        movie: movieWithImageURL,
      });
    } catch (error) {
      // Delete uploaded file if database operation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Error creating movie:", error);
      res.status(500).json({
        success: false,
        message: "Server error while creating movie",
      });
    }
  }
);

// @route   PUT /api/movies/:id
// @desc    Update movie
// @access  Private (Admin only)
router.put(
  "/:id",
  authenticateToken,
  upload.single("image"),
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Movie title cannot be empty"),
    body("duration")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Duration cannot be empty"),
    body("hall")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Hall cannot be empty"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const movie = await Movie.findById(req.params.id);
      if (!movie) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: "Movie not found",
        });
      }

      const {
        title,
        duration,
        hall,
        times,
        showtimes,
        genre,
        description,
        status,
      } = req.body;

      // Parse showtimes if provided
      let parsedShowtimes = showtimes;
      if (showtimes && typeof showtimes === "string") {
        try {
          parsedShowtimes = JSON.parse(showtimes);
        } catch (e) {
          parsedShowtimes = [];
        }
      }

      // Ensure price field exists and is valid for each showtime
      if (parsedShowtimes && Array.isArray(parsedShowtimes)) {
        parsedShowtimes = parsedShowtimes.map((showtime) => ({
          ...showtime,
          price:
            showtime.price !== undefined && showtime.price >= 0
              ? showtime.price
              : 15,
        }));
      }

      // Parse times if provided (backward compatibility)
      let parsedTimes = times;
      if (times && typeof times === "string") {
        try {
          parsedTimes = JSON.parse(times);
        } catch (e) {
          parsedTimes = times.split(",").map((time) => time.trim());
        }
      }

      // Update movie fields
      if (title !== undefined) movie.title = title;
      if (duration !== undefined) movie.duration = duration;
      if (hall !== undefined) movie.hall = hall;
      if (parsedShowtimes !== undefined) movie.showtimes = parsedShowtimes;
      if (parsedTimes !== undefined) movie.times = parsedTimes;
      if (genre !== undefined) movie.genre = genre;
      if (description !== undefined) movie.description = description;
      if (status !== undefined) movie.status = status;

      // Update image if new one is uploaded
      if (req.file) {
        // Delete old image
        const oldImagePath = path.join("uploads/movies", movie.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
        movie.image = req.file.filename;
      }

      await movie.save();

      // Return movie with full image URL
      const movieWithImageURL = {
        ...movie.toObject(),
        imageUrl: `${req.protocol}://${req.get("host")}/uploads/movies/${
          movie.image
        }`,
      };

      res.json({
        success: true,
        message: "Movie updated successfully",
        movie: movieWithImageURL,
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      console.error("Error updating movie:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating movie",
      });
    }
  }
);

// @route   DELETE /api/movies/:id
// @desc    Delete movie
// @access  Private (Admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Cancel all pending and confirmed bookings for this movie
    const updateResult = await Booking.updateMany(
      {
        "movie.title": movie.title,
        status: { $in: ["pending", "confirmed"] },
      },
      {
        $set: {
          status: "cancelled",
          cancellationReason: "movie_deleted",
          "movie.imageUrl": null, // Clear the image URL to prevent 404 errors
          updatedAt: new Date(),
        },
      }
    );

    // Also clear image URLs from ALL existing bookings (including already cancelled ones) to prevent 404 errors
    await Booking.updateMany(
      {
        "movie.title": movie.title,
      },
      {
        $set: {
          "movie.imageUrl": null,
          updatedAt: new Date(),
        },
      }
    );

    console.log(
      `Cancelled ${updateResult.modifiedCount} bookings for movie: ${movie.title}`
    );

    // Delete image file
    const imagePath = path.join("uploads/movies", movie.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Movie deleted successfully",
      cancelledBookings: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error deleting movie:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting movie",
    });
  }
});

// @route   GET /api/movies/:id
// @desc    Get single movie
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: "Movie not found",
      });
    }

    // Add full image URL
    const movieWithImageURL = {
      ...movie.toObject(),
      imageUrl: `${req.protocol}://${req.get("host")}/uploads/movies/${
        movie.image
      }`,
    };

    res.json({
      success: true,
      movie: movieWithImageURL,
    });
  } catch (error) {
    console.error("Error fetching movie:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching movie",
    });
  }
});

// @route   POST /api/movies/cleanup-broken-images
// @desc    Clean up broken image URLs in bookings (Admin utility)
// @access  Private (Admin only)
router.post("/cleanup-broken-images", authenticateToken, async (req, res) => {
  try {
    const Booking = require("../models/Booking");

    // Find all bookings with imageUrl that might be broken
    const bookingsWithImages = await Booking.find({
      "movie.imageUrl": { $exists: true, $ne: null },
    });

    let cleanedCount = 0;

    for (const booking of bookingsWithImages) {
      if (booking.movie.imageUrl) {
        // Check if the image file exists (simplified check for broken URLs)
        if (
          booking.movie.imageUrl.includes("placeholder") ||
          booking.movie.imageUrl.includes("via.placeholder")
        ) {
          // Clear broken placeholder URLs
          await Booking.updateOne(
            { _id: booking._id },
            {
              $set: {
                "movie.imageUrl": null,
                updatedAt: new Date(),
              },
            }
          );
          cleanedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} bookings with broken image URLs`,
      cleanedCount,
    });
  } catch (error) {
    console.error("Error cleaning up broken images:", error);
    res.status(500).json({
      success: false,
      message: "Server error while cleaning up broken images",
    });
  }
});

module.exports = router;
