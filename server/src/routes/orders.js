const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/orders
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res) => {
    try {
        const orders = await Order.find().populate("user", "name email");
        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

// 👇 NAYA ROUTE: User ke apne orders
// @route   GET /api/orders/myorders
// @desc    Get logged in user's orders
// @access  Private
router.get("/myorders", protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id });
        res.json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

// @route   POST /api/orders
// @desc    Create a new order (Logged in users)
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { items, total, shippingAddress, paymentMethod } = req.body;

        const order = await Order.create({
            user: req.user._id,
            items,
            total,
            shippingAddress,
            paymentMethod,
        });

        res.status(201).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

module.exports = router;
