const express = require("express");
const { body, validationResult } = require("express-validator");
const Hall = require("../models/Hall");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/halls
// @desc    Get all halls
// @access  Public
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    // Filter by status if provided
    if (status) {
      query.status = status;
    }

    const halls = await Hall.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      halls,
    });
  } catch (error) {
    console.error("Error fetching halls:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching halls",
    });
  }
});

// @route   GET /api/halls/active/list
// @desc    Get active halls for dropdown/selection
// @access  Public
router.get("/active/list", async (req, res) => {
  try {
    const halls = await Hall.find({ status: "Active" })
      .select("name type capacity")
      .sort({ name: 1 });

    res.json({
      success: true,
      halls,
    });
  } catch (error) {
    console.error("Error fetching active halls:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching active halls",
    });
  }
});

// @route   GET /api/halls/:id
// @desc    Get hall by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    res.json({
      success: true,
      hall,
    });
  } catch (error) {
    console.error("Error fetching hall:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching hall",
    });
  }
});

// @route   POST /api/halls
// @desc    Create new hall
// @access  Private (Admin only)
router.post(
  "/",
  authenticateToken,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Hall name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Hall name must be between 2 and 50 characters"),
    body("capacity")
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
    body("type")
      .isIn(["Standard", "IMAX", "VIP", "Premium"])
      .withMessage("Invalid hall type"),
    body("status")
      .optional()
      .isIn(["Active", "Maintenance", "Inactive"])
      .withMessage("Invalid status"),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
  ],
  async (req, res) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation errors",
          errors: errors.array(),
        });
      }

      const { name, capacity, type, status, description, amenities } = req.body;

      // Check if hall name already exists
      const existingHall = await Hall.findOne({ name: name.trim() });
      if (existingHall) {
        return res.status(400).json({
          success: false,
          message: "Hall with this name already exists",
        });
      }

      // Create new hall
      const newHall = new Hall({
        name: name.trim(),
        capacity: parseInt(capacity),
        type,
        status: status || "Active",
        description: description?.trim() || "",
        amenities: amenities || [],
      });

      await newHall.save();

      res.status(201).json({
        success: true,
        message: "Hall created successfully",
        hall: newHall,
      });
    } catch (error) {
      console.error("Error creating hall:", error);
      res.status(500).json({
        success: false,
        message: "Server error while creating hall",
      });
    }
  }
);

// @route   PUT /api/halls/:id
// @desc    Update hall
// @access  Private (Admin only)
router.put(
  "/:id",
  authenticateToken,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Hall name cannot be empty")
      .isLength({ min: 2, max: 50 })
      .withMessage("Hall name must be between 2 and 50 characters"),
    body("capacity")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Capacity must be a positive integer"),
    body("type")
      .optional()
      .isIn(["Standard", "IMAX", "VIP", "Premium"])
      .withMessage("Invalid hall type"),
    body("status")
      .optional()
      .isIn(["Active", "Maintenance", "Inactive"])
      .withMessage("Invalid status"),
    body("description")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
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

      const { name, capacity, type, status, description, amenities } = req.body;
      const hallId = req.params.id;

      // Check if hall exists
      const hall = await Hall.findById(hallId);
      if (!hall) {
        return res.status(404).json({
          success: false,
          message: "Hall not found",
        });
      }

      // Check if name is being changed and if new name already exists
      if (name && name.trim() !== hall.name) {
        const existingHall = await Hall.findOne({
          name: name.trim(),
          _id: { $ne: hallId },
        });
        if (existingHall) {
          return res.status(400).json({
            success: false,
            message: "Hall with this name already exists",
          });
        }
      }

      // Update hall
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (capacity !== undefined) updateData.capacity = parseInt(capacity);
      if (type !== undefined) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      if (description !== undefined)
        updateData.description = description.trim();
      if (amenities !== undefined) updateData.amenities = amenities;

      const updatedHall = await Hall.findByIdAndUpdate(hallId, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({
        success: true,
        message: "Hall updated successfully",
        hall: updatedHall,
      });
    } catch (error) {
      console.error("Error updating hall:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating hall",
      });
    }
  }
);

// @route   DELETE /api/halls/:id
// @desc    Delete hall
// @access  Private (Admin only)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const hallId = req.params.id;

    // Check if hall exists
    const hall = await Hall.findById(hallId);
    if (!hall) {
      return res.status(404).json({
        success: false,
        message: "Hall not found",
      });
    }

    // Check if hall is being used in any movies (optional check)
    // You might want to implement this check based on your requirements

    await Hall.findByIdAndDelete(hallId);

    res.json({
      success: true,
      message: "Hall deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting hall:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting hall",
    });
  }
});

module.exports = router;
