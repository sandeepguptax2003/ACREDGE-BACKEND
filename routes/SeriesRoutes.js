const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/SeriesController');
const { isAuthenticated } = require('../controllers/LoginController');
const { upload, uploadFields } = require('../middleware/UploadMiddleware');

router.post('/', isAuthenticated, upload.fields(uploadFields), seriesController.createSeries);
router.get('/', isAuthenticated, seriesController.getAllSeries);
router.get('/:id', isAuthenticated, seriesController.getSeriesById);
router.put('/:id', isAuthenticated, upload.fields(uploadFields), seriesController.updateSeries);
router.delete('/:id', isAuthenticated, seriesController.deleteSeries);

module.exports = router;    