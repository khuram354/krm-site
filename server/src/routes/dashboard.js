const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get("/stats", protect, authorize("admin"), async (req, res) => {
    try {
        // Total orders
        const totalOrders = await Order.countDocuments();

        // Total revenue (from completed orders)
        const completedOrders = await Order.find({ status: "completed" });
        const totalRevenue = completedOrders.reduce(
            (sum, order) => sum + order.total,
            0,
        );

        // Total products
        const totalProducts = await Product.countDocuments();

        // Total users
        const totalUsers = await User.countDocuments();

        // Recent orders (last 5)
        const recentOrders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(5);

        // Monthly sales (last 6 months)
        const monthlySales = await Order.aggregate([
            {
                $match: {
                    status: "completed",
                    createdAt: {
                        $gte: new Date(
                            new Date().setMonth(new Date().getMonth() - 6),
                        ),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" },
                    },
                    total: { $sum: "$total" },
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 },
            },
        ]);

        // Order status distribution
        const statusDistribution = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        res.json({
            success: true,
            data: {
                totalOrders,
                totalRevenue,
                totalProducts,
                totalUsers,
                recentOrders,
                monthlySales,
                statusDistribution,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

module.exports = router;
