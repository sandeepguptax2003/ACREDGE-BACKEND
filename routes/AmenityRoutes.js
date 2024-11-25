const express = require('express');
const router = express.Router();
const amenityController = require('../controllers/AmenityController');
const { upload, uploadFields } = require('../middleware/UploadMiddleware');
const { verifyUserForAdminRoutes } = require('../shared/crossSiteAuth');

router.post('/create',
  upload.fields([{ name: 'logoUrl', maxCount: 1 }]),
  amenityController.createAmenity
);

router.get('/all', amenityController.getAllAmenities);

router.get('/all/public',verifyUserForAdminRoutes, amenityController.getAllAmenities);

module.exports = router;