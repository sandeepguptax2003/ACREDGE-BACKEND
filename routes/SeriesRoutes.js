const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/SeriesController');
const { isAuthenticated } = require('../controllers/LoginController');

router.post('/', isAuthenticated, seriesController.createSeries);
router.get('/', isAuthenticated, seriesController.getAllSeries);
router.get('/:id', isAuthenticated, seriesController.getSeriesById);
router.put('/:id', isAuthenticated, seriesController.updateSeries);
router.delete('/:id', isAuthenticated, seriesController.deleteSeries);

module.exports = router;