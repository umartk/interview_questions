const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload and process image
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: image
 *         type: file
 *         required: true
 *         description: Image file to upload
 *     responses:
 *       200:
 *         description: Image uploaded and processed successfully
 */
router.post('/image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  try {
    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate thumbnail
    const thumbnail = await sharp(req.file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    // In a real app, you would save these to cloud storage or file system
    const imageUrl = `/uploads/images/${Date.now()}-${req.file.originalname}`;
    const thumbnailUrl = `/uploads/thumbnails/${Date.now()}-thumb-${req.file.originalname}`;

    res.json({
      success: true,
      data: {
        originalName: req.file.originalname,
        imageUrl,
        thumbnailUrl,
        size: processedImage.length,
        thumbnailSize: thumbnail.length
      }
    });
  } catch (error) {
    throw new AppError('Image processing failed', 500);
  }
});

/**
 * @swagger
 * /api/upload/multiple:
 *   post:
 *     summary: Upload multiple images
 *     consumes:
 *       - multipart/form-data
 *     parameters:
 *       - in: formData
 *         name: images
 *         type: file
 *         required: true
 *         description: Multiple image files
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 */
router.post('/multiple', upload.array('images', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new AppError('No image files provided', 400);
  }

  try {
    const processedImages = await Promise.all(
      req.files.map(async (file) => {
        const processedImage = await sharp(file.buffer)
          .resize(800, 600, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();

        return {
          originalName: file.originalname,
          imageUrl: `/uploads/images/${Date.now()}-${file.originalname}`,
          size: processedImage.length
        };
      })
    );

    res.json({
      success: true,
      data: processedImages
    });
  } catch (error) {
    throw new AppError('Image processing failed', 500);
  }
});

module.exports = router;