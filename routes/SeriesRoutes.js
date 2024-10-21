const express = require('express');
const router = express.Router();
const seriesController = require('../controllers/SeriesController');
const { verifyToken } = require('../middleware/LoginMiddleware');

router.post('/', verifyToken, seriesController.createSeries);
router.get('/', verifyToken, seriesController.getAllSeries);
router.get('/:id', verifyToken, seriesController.getSeriesById);
router.put('/:id', verifyToken, seriesController.updateSeries);
router.delete('/:id', verifyToken, seriesController.deleteSeries);

module.exports = router;