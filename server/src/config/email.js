const nodemailer = require("nodemailer");

// Create transporter (Ethereal / Production)
const createTransporter = () => {
    // Agar Ethereal credentials hain toh use karein
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false, // TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Default: Gmail
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
};

const transporter = createTransporter();

// Send email function
const sendEmail = async (to, subject, html) => {
    try {
        console.log(`📧 Attempting to send email to: ${to}`);
        console.log(`📧 Using host: ${process.env.EMAIL_HOST}`);

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to,
            subject,
            html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);

        // 👇 FIX: Ethereal preview URL
        if (info.messageId) {
            // Ethereal email ke liye
            const previewUrl = `https://ethereal.email/message/${info.messageId}`;
            console.log(`🔗 Preview URL: ${previewUrl}`);
        }

        // 👇 Alternative: Agar getTestMessageUrl kaam kare
        if (
            nodemailer.getTestMessageUrl &&
            nodemailer.getTestMessageUrl(info)
        ) {
            console.log(
                `🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`,
            );
        }

        return true;
    } catch (error) {
        console.error("❌ Email error:", error.message);
        console.error(error);
        return false;
    }
};

// Order confirmation email
const sendOrderConfirmation = async (order, user) => {
    const orderId = order._id.toString();
    const subject = `Order Confirmation #${orderId.slice(-6)}`;

    const html = `
        <h2>Thank you for your order! 🎉</h2>
        <p>Hi ${user.name},</p>
        <p>Your order has been placed successfully.</p>
        
        <h3>Order Details</h3>
        <p><strong>Order ID:</strong> #${orderId.slice(-6)}</p>
        <p><strong>Total:</strong> Rs. ${order.total.toFixed(2)}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        
        <h3>Items</h3>
        <ul>
            ${order.items
                .map(
                    (item) => `
                <li>${item.name} × ${item.quantity} = Rs. ${(item.price * item.quantity).toFixed(2)}</li>
            `,
                )
                .join("")}
        </ul>
        
        <p>You can track your order status in your account.</p>
        <a href="http://localhost:5500/client/public/orders.html">View Orders</a>
        
        <p>Thank you for shopping with KRM-Site!</p>
    `;

    return await sendEmail(user.email, subject, html);
};

// Order status update email
const sendOrderStatusUpdate = async (order, user, oldStatus, newStatus) => {
    const orderId = order._id.toString();
    const subject = `Order Status Updated #${orderId.slice(-6)}`;

    const statusColors = {
        pending: "🟡",
        processing: "🟠",
        completed: "✅",
        cancelled: "❌",
    };

    const html = `
        <h2>Order Status Update</h2>
        <p>Hi ${user.name},</p>
        <p>Your order status has been updated.</p>
        
        <p><strong>Order ID:</strong> #${orderId.slice(-6)}</p>
        <p><strong>Old Status:</strong> ${statusColors[oldStatus] || ""} ${oldStatus}</p>
        <p><strong>New Status:</strong> ${statusColors[newStatus] || ""} ${newStatus}</p>
        <p><strong>Total:</strong> Rs. ${order.total.toFixed(2)}</p>
        
        <a href="http://localhost:5500/client/public/orders.html">View Orders</a>
        
        <p>Thank you for shopping with KRM-Site!</p>
    `;

    return await sendEmail(user.email, subject, html);
};

module.exports = { sendEmail, sendOrderConfirmation, sendOrderStatusUpdate };
