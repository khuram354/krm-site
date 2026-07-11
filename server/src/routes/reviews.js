const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Product = require("../models/Product");
const { protect } = require("../middleware/auth");

// @route   POST /api/reviews
// @desc    Add a review to a product
// @access  Private
router.post("/", protect, async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Check if user already reviewed this product
        const existingReview = await Review.findOne({
            product: productId,
            user: req.user._id,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You already reviewed this product",
            });
        }

        // Create review
        const review = await Review.create({
            product: productId,
            user: req.user._id,
            name: req.user.name,
            rating,
            comment,
        });

        // Update product average rating
        const reviews = await Review.find({ product: productId });
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avgRating = totalRating / reviews.length;

        product.ratings = avgRating;
        product.numReviews = reviews.length;
        await product.save();

        res.status(201).json({
            success: true,
            review,
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

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product
// @access  Public
router.get("/product/:productId", async (req, res) => {
    try {
        const reviews = await Review.find({
            product: req.params.productId,
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: reviews.length,
            reviews,
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

// @route   DELETE /api/reviews/:id
// @desc    Delete a review (User or Admin)
// @access  Private
router.delete("/:id", protect, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        // Check if user is review owner or admin
        if (
            review.user.toString() !== req.user._id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to delete this review",
            });
        }

        await review.deleteOne();

        // Update product average rating
        const reviews = await Review.find({ product: review.product });
        if (reviews.length > 0) {
            const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = totalRating / reviews.length;
            await Product.findByIdAndUpdate(review.product, {
                ratings: avgRating,
                numReviews: reviews.length,
            });
        } else {
            await Product.findByIdAndUpdate(review.product, {
                ratings: 0,
                numReviews: 0,
            });
        }

        res.json({
            success: true,
            message: "Review deleted successfully",
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
