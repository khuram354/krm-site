const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json({
            success: true,
            count: products.length,
            products,
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

// @route   GET /api/products/:id
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

// @route   POST /api/products
// @desc    Create a new product (Admin only)
// @access  Private/Admin
router.post("/", async (req, res) => {
    try {
        const { name, slug, description, price, category, stock } = req.body;

        // Check if product exists
        const existingProduct = await Product.findOne({ slug });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                message: "Product with this slug already exists",
            });
        }

        const product = await Product.create({
            name,
            slug,
            description,
            price,
            category,
            stock,
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
});

module.exports = router;
