const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');

const router = express.Router();

const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const safeOriginalName = file.originalname.replace(/\s+/g, '_');
        const fileName = `${Date.now()}-${safeOriginalName}`;
        cb(null, fileName);
    }
});

const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf'
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new Error('Дозволено завантажувати тільки JPG, PNG або PDF'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Файл не було завантажено' });
    }

    logger.info({
        message: 'Один файл завантажено',
        originalName: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size
    });

    res.json({
        message: 'Файл успішно завантажено',
        file: {
            originalName: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        }
    });
});

router.post('/upload-multiple', upload.array('files', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'Файли не було завантажено' });
    }

    logger.info({
        message: 'Кілька файлів завантажено',
        count: req.files.length,
        files: req.files.map(file => file.originalname)
    });

    res.json({
        message: 'Файли успішно завантажено',
        files: req.files.map(file => ({
            originalName: file.originalname,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path
        }))
    });
});

module.exports = router;
