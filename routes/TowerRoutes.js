const express = require('express');
const router = express.Router();
const towerController = require('../controllers/TowerController');
const { isAuthenticated } = require('../controllers/LoginController');

router.post('/', isAuthenticated, towerController.createTower);
router.get('/', isAuthenticated, towerController.getAllTowers);
router.get('/:id', isAuthenticated, towerController.getTowerById);
router.put('/:id', isAuthenticated, towerController.updateTower);
router.delete('/:id', isAuthenticated, towerController.deleteTower);

module.exports = router;