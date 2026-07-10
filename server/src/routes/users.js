const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get("/", protect, authorize("admin"), async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json({
            success: true,
            count: users.length,
            users,
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

// @route   DELETE /api/users/:id
// @desc    Delete a user (Admin only)
// @access  Private/Admin
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Prevent deleting yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete yourself",
            });
        }

        await user.deleteOne();
        res.json({
            success: true,
            message: "User deleted successfully",
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
