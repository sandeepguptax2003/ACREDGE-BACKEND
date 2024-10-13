const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/SeriesController');

// Create a new series
router.post('/', seriesController.createSeries);

// Get all series
router.get('/', seriesController.getAllSeries);

// Get a single series by ID
router.get('/:id', seriesController.getSeriesById);

// Update a series
router.put('/:id', seriesController.updateSeries);

// Delete a series
router.delete('/:id', seriesController.deleteSeries);

module.exports = router;