const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please add a product name"],
            trim: true,
            maxlength: [100, "Name cannot be more than 100 characters"],
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        description: {
            type: String,
            required: [true, "Please add a description"],
            maxlength: [
                1000,
                "Description cannot be more than 1000 characters",
            ],
        },
        price: {
            type: Number,
            required: [true, "Please add a price"],
            min: [0, "Price must be greater than 0"],
        },
        category: {
            type: String,
            required: [true, "Please add a category"],
            enum: [
                "Electronics",
                "Clothing",
                "Books",
                "Home",
                "Beauty",
                "Sports",
                "Other",
            ],
        },
        images: {
            type: [String],
            default: [],
        },
        stock: {
            type: Number,
            required: [true, "Please add stock quantity"],
            min: [0, "Stock cannot be negative"],
            default: 0,
        },
        ratings: {
            type: Number,
            min: [0, "Rating must be at least 0"],
            max: [5, "Rating cannot be more than 5"],
            default: 0,
        },
        numReviews: {
            // 👈 NAYA FIELD
            type: Number,
            default: 0,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Product", ProductSchema);
