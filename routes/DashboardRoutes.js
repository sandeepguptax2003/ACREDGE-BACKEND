const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/DashboardController');
const { isAuthenticated } = require('../controllers/LoginController');

// Individual stats routes
router.get('/developers/stats', isAuthenticated, dashboardController.getDeveloperStats);
router.get('/projects/stats', isAuthenticated, dashboardController.getProjectStats);
router.get('/series/stats', isAuthenticated, dashboardController.getSeriesStats);
router.get('/towers/stats', isAuthenticated, dashboardController.getTowerStats);

// Combined stats route
router.get('/stats', isAuthenticated, dashboardController.getAllStats);

module.exports = router;