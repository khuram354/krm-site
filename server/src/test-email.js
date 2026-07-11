const dotenv = require("dotenv");
dotenv.config();

const { sendEmail } = require("./config/email");

// Test email
async function testEmail() {
    console.log("📧 Testing email...");

    const result = await sendEmail(
        "test@example.com",
        "Test Email from KRM-Site",
        "<h1>Hello!</h1><p>This is a test email from your KRM-Site project.</p>",
    );

    console.log("✅ Test result:", result);
}

testEmail();
