const multer = require("multer");
const path = require("path");

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "server/src/uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(
            null,
            file.fieldname +
                "-" +
                uniqueSuffix +
                path.extname(file.originalname),
        );
    },
});

// File filter (only images)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"));
    }
};

// Upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
    fileFilter: fileFilter,
});

module.exports = upload;
