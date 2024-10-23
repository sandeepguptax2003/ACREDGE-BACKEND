const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();

// Define file size limits in bytes
const FILE_LIMITS = {
  logo: 2 * 1024 * 1024, // 2MB
  images: 10 * 1024 * 1024, // 10MB
  videos: 50 * 1024 * 1024, // 50MB
  brochureUrl: 50 * 1024 * 1024, // 50MB
  insideImagesUrls: 10 * 1024 * 1024, // 10MB
  insideVideosUrls: 50 * 1024 * 1024 // 50MB
};

// Define maximum counts for each file type
const MAX_COUNTS = {
  logo: 1,
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
  
  let error = null;
  let isValid = true;

  // Check file type based on field name
  switch (file.fieldname) {
    case 'logo':
      if (!allowedImageTypes.test(ext)) {
        error = new Error('Logo must be JPG or PNG format');
        isValid = false;
      }
      break;

    case 'images':
    case 'insideImagesUrls':
      if (!allowedImageTypes.test(ext)) {
        error = new Error('Images must be JPG or PNG format');
        isValid = false;
      }
      break;

    case 'videos':
    case 'insideVideosUrls':
      if (!allowedVideoTypes.test(ext)) {
        error = new Error('Videos must be MP4 or MOV format');
        isValid = false;
      }
      break;

    case 'brochureUrl':
      if (!allowedPdfTypes.test(ext)) {
        error = new Error('Brochure must be PDF format');
        isValid = false;
      }
      break;

    default:
      error = new Error('Invalid field name');
      isValid = false;
  }

  // Check file size
  const fileSize = parseInt(req.headers['content-length']);
  if (fileSize > FILE_LIMITS[file.fieldname]) {
    error = new Error(`File size exceeds limit for ${file.fieldname}`);
    isValid = false;
  }

  // Count existing files of the same type
  const existingFiles = req.files ? req.files[file.fieldname] : [];
  if (existingFiles && existingFiles.length >= MAX_COUNTS[file.fieldname]) {
    error = new Error(`Maximum number of files reached for ${file.fieldname}`);
    isValid = false;
  }

  cb(error, isValid);
};

const uploadFields = [
  { name: 'logo', maxCount: MAX_COUNTS.logo },
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

module.exports = { 
  upload, 
  uploadFields,
  FILE_LIMITS,
  MAX_COUNTS
};