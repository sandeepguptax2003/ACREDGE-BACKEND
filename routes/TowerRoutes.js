const express = require('express');
const router = express.Router();
const towerController = require('../controllers/TowerController');

// Create a new tower
router.post('/', towerController.createTower);

// Get all towers
router.get('/', towerController.getAllTowers);

// Get a single tower by ID
router.get('/:id', towerController.getTowerById);

// Update a tower
router.put('/:id', towerController.updateTower);

// Delete a tower
router.delete('/:id', towerController.deleteTower);

module.exports = router;