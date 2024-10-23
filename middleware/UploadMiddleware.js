const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();

// Define file size limits in bytes
const FILE_LIMITS = {
  logoUrl: 2 * 1024 * 1024, // 2MB
  images: 10 * 1024 * 1024, // 10MB
  videos: 50 * 1024 * 1024, // 50MB
  brochureUrl: 50 * 1024 * 1024, // 50MB
  insideImagesUrls: 10 * 1024 * 1024, // 10MB
  insideVideosUrls: 50 * 1024 * 1024 // 50MB
};

// Define maximum counts for each file type
const MAX_COUNTS = {
  logoUrl: 1,
  images: 20,
  videos: 5,
  brochureUrl: 3,
  insideImagesUrls: 20,
  insideVideosUrls: 5
};

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedVideoTypes = /mp4|mov/;
  const allowedPdfTypes = /pdf/;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  // Validate if the field name is expected
  if (!Object.keys(FILE_LIMITS).includes(file.fieldname)) {
    return cb(new Error(`Invalid field name: ${file.fieldname}`), false);
  }

  try {
    // Check file type based on field name
    switch (file.fieldname) {
      case 'logoUrl':
        if (!allowedImageTypes.test(ext)) {
          throw new Error('Logo must be JPG or PNG format');
        }
        break;

      case 'images':
      case 'insideImagesUrls':
        if (!allowedImageTypes.test(ext)) {
          throw new Error('Images must be JPG or PNG format');
        }
        break;

      case 'videos':
      case 'insideVideosUrls':
        if (!allowedVideoTypes.test(ext)) {
          throw new Error('Videos must be MP4 or MOV format');
        }
        break;

      case 'brochureUrl':
        if (!allowedPdfTypes.test(ext)) {
          throw new Error('Brochure must be PDF format');
        }
        break;

      default:
        throw new Error('Invalid field name');
    }

    // Check file size
    if (file.size > FILE_LIMITS[file.fieldname]) {
      throw new Error(`File size exceeds limit for ${file.fieldname}`);
    }

    // Count existing files of the same type
    const existingFiles = req.files ? req.files[file.fieldname] : [];
    if (existingFiles && existingFiles.length >= MAX_COUNTS[file.fieldname]) {
      throw new Error(`Maximum number of files reached for ${file.fieldname}`);
    }

    cb(null, true);
  } catch (error) {
    cb(error, false);
  }
};

const uploadFields = [
  { name: 'logoUrl', maxCount: MAX_COUNTS.logoUrl },
  { name: 'images', maxCount: MAX_COUNTS.images },
  { name: 'videos', maxCount: MAX_COUNTS.videos },
  { name: 'brochureUrl', maxCount: MAX_COUNTS.brochureUrl },
  { name: 'insideImagesUrls', maxCount: MAX_COUNTS.insideImagesUrls },
  { name: 'insideVideosUrls', maxCount: MAX_COUNTS.insideVideosUrls }
];

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Math.max(...Object.values(FILE_LIMITS)) // Set to maximum allowed file size
  }
});

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: `Unexpected field: ${err.field}. Allowed fields are: ${uploadFields.map(f => f.name).join(', ')}`
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
};

module.exports = { 
  upload, 
  uploadFields,
  FILE_LIMITS,
  MAX_COUNTS,
  handleUploadError
};