const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./server/src/config/database");

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "KRM-Site API is running successfully!",
        status: "Active",
        timestamp: new Date().toISOString(),
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}`);
});
