const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/AmenityController');
const { upload, uploadFields } = require('../middleware/UploadMiddleware');

router.post('/create',
  upload.fields([{ name: 'logoUrl', maxCount: 1 }]),
  amenityController.createAmenity
);

router.get('/all', amenityController.getAllAmenities);

module.exports = router;