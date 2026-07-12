const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const { protect, authorize } = require("../middleware/auth");
const {
    sendOrderConfirmation,
    sendOrderStatusUpdate,
} = require("../config/email"); // 👈 NAYA

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

        // 👇 Populate user details for email
        const populatedOrder = await Order.findById(order._id).populate(
            "user",
            "name email",
        );

        // 👇 Send confirmation email (background mein)
        sendOrderConfirmation(populatedOrder, populatedOrder.user)
            .then(() =>
                console.log("✅ Confirmation email sent for order:", order._id),
            )
            .catch((err) => console.error("❌ Email error:", err));

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

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put("/:id/status", protect, authorize("admin"), async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = [
            "pending",
            "processing",
            "completed",
            "cancelled",
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status value",
            });
        }

        const order = await Order.findById(req.params.id).populate(
            "user",
            "name email",
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // 👇 Send status update email if status changed
        if (oldStatus !== status && order.user?.email) {
            sendOrderStatusUpdate(order, order.user, oldStatus, status)
                .then(() =>
                    console.log(
                        "✅ Status update email sent for order:",
                        order._id,
                    ),
                )
                .catch((err) => console.error("❌ Status email error:", err));
        }

        res.json({
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

// @route   DELETE /api/orders/:id
// @desc    Delete an order (User only - if pending or completed)
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Check if user owns this order
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this order",
            });
        }

        // Check if order can be deleted (pending or completed)
        if (order.status !== "pending" && order.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: `Cannot delete order with status: ${order.status}. Only pending or completed orders can be deleted.`,
            });
        }

        await order.deleteOne();

        res.json({
            success: true,
            message: "Order deleted successfully",
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
