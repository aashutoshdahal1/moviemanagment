const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./config/database");
const { seedDefaultAdmin } = require("./utils/seedAdmin");

// Load environment variables
dotenv.config();

// Connect to MongoDB (with fallback)
connectDB();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: "*"
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/user-auth", require("./routes/userAuth").router);
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/movies", require("./routes/movies"));
app.use("/api/halls", require("./routes/halls"));
app.use("/api/admin/dashboard", require("./routes/adminDashboard"));

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Movie Ticket Management Backend Server" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT,"0.0.0.0", async () => {
  console.log(`Server is running on port ${PORT}`);

  // Seed default admin after server starts
  await seedDefaultAdmin();
});
