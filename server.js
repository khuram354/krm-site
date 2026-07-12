const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./server/src/config/database");
const path = require("path");

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware - Ye pehle aana chahiye
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static files - Ye middleware ke baad aana chahiye
app.use("/uploads", express.static(path.join(__dirname, "server/src/uploads")));

// ✅ Routes - Middleware ke BAAD aana chahiye
app.use("/api/auth", require("./server/src/routes/auth"));
app.use("/api/products", require("./server/src/routes/products"));
app.use("/api/users", require("./server/src/routes/users"));
app.use("/api/orders", require("./server/src/routes/orders"));
app.use("/api/reviews", require("./server/src/routes/reviews"));
app.use("/api/dashboard", require("./server/src/routes/dashboard"));

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
