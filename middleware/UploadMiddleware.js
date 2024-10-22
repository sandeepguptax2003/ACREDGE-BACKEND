const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const storage = multer.memoryStorage();

const uploadFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'images', maxCount: 20 },
  { name: 'videos', maxCount: 5 },
  { name: 'brochureUrl', maxCount: 3 },
  { name: 'insideImagesUrls', maxCount: 20 },
  { name: 'insideVideosUrls', maxCount: 5 }
];

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png/;
  const allowedVideoTypes = /mp4|mov/;
  const allowedPdfTypes = /pdf/;
  const ext = path.extname(file.originalname).toLowerCase().substring(1);
  
  switch (file.fieldname) {
    case 'logo':
      if (allowedImageTypes.test(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Logo must be JPG/PNG'));
      }
      break;
      
    case 'images':
    case 'insideImagesUrls':
      if (allowedImageTypes.test(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Images must be JPG/PNG'));
      }
      break;
      
    case 'videos':
    case 'insideVideosUrls':
      if (allowedVideoTypes.test(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Videos must be MP4/MOV'));
      }
      break;
      
    case 'brochureUrl':
      if (allowedPdfTypes.test(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Brochure must be PDF'));
      }
      break;
      
    default:
      cb(new Error('Invalid field name'));
  }
};

const limits = {
  'logo': 2 * 1024 * 1024, // 2MB
  'images': 10 * 1024 * 1024, // 10MB
  'insideImagesUrls': 10 * 1024 * 1024, // 10MB
  'videos': 50 * 1024 * 1024, // 50MB
  'insideVideosUrls': 50 * 1024 * 1024, // 50MB
  'brochureUrl': 50 * 1024 * 1024 // 50MB
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // Max file size set to 50MB
  }
});

module.exports = { upload, uploadFields };