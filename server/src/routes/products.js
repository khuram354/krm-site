const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

// ============================================
// ✅ PUBLIC ROUTES (PEHLE)
// ============================================

// @route   GET /api/products
// @desc    Get all products with pagination
// @access  Public
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 8;
        const skip = (page - 1) * limit;

        const total = await Product.countDocuments();
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
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

// @route   GET /api/products/search  👈 SEARCH ROUTE PEHLE AANA CHAHIYE
// @desc    Search products with filters
// @access  Public
router.get("/search", async (req, res) => {
    try {
        const { keyword, category, sort } = req.query;

        // Build query
        const query = {};

        // Keyword search
        if (keyword && keyword.trim() !== "") {
            query.$or = [
                { name: { $regex: keyword.trim(), $options: "i" } },
                { description: { $regex: keyword.trim(), $options: "i" } },
            ];
        }

        // Category filter
        if (category && category.trim() !== "") {
            query.category = category.trim();
        }

        // Sort
        let sortOption = {};
        if (sort === "price-asc") sortOption = { price: 1 };
        else if (sort === "price-desc") sortOption = { price: -1 };
        else sortOption = { createdAt: -1 };

        const products = await Product.find(query).sort(sortOption);

        res.json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Search Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        });
    }
});

// @route   GET /api/products/:id  👈 ID ROUTE SEARCH KE BAAD AANA CHAHIYE
// @desc    Get single product by ID
// @access  Public
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.json({
            success: true,
            product,
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

// ============================================
// ✅ ADMIN ROUTES (BAAD MEIN)
// ============================================

// @route   POST /api/products
// @desc    Create a new product with images (Admin only)
// @access  Private/Admin
router.post(
    "/",
    protect,
    authorize("admin"),
    upload.array("images", 5),
    async (req, res) => {
        try {
            const { name, slug, description, price, category, stock } =
                req.body;

            const existingProduct = await Product.findOne({ slug });
            if (existingProduct) {
                return res.status(400).json({
                    success: false,
                    message: "Product with this slug already exists",
                });
            }

            const images = req.files
                ? req.files.map((file) => `/uploads/${file.filename}`)
                : [];

            const product = await Product.create({
                name,
                slug,
                description,
                price,
                category,
                stock,
                images,
            });

            res.status(201).json({
                success: true,
                product,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Server Error",
                error: error.message,
            });
        }
    },
);

module.exports = router;
