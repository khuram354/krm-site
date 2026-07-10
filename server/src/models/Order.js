const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                name: String,
                price: Number,
                quantity: Number,
            },
        ],
        total: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "cancelled"],
            default: "pending",
        },
        shippingAddress: {
            street: String,
            city: String,
            state: String,
            zip: String,
            country: String,
        },
        paymentMethod: {
            type: String,
            enum: ["credit_card", "paypal", "cash"],
            default: "credit_card",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    },
);

module.exports = mongoose.model("Order", OrderSchema);
