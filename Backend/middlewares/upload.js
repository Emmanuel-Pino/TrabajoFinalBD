const multer = require("multer");
const path = require("path");
const { randomUUID } = require("crypto");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../audio"));
    },
    filename: (req, file, cb) => {
        cb(null, randomUUID() + ".mp3");
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024
    },
    fileFilter: (req, file, cb) => {
        if (
            path.extname(file.originalname).toLowerCase() === ".mp3" &&
            file.mimetype === "audio/mpeg"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten archivos MP3"));
        }
    }
});

module.exports = upload;