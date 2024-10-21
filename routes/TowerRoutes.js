const express = require('express');
const router = express.Router();
const towerController = require('../controllers/TowerController');
const { verifyToken } = require('../middleware/LoginMiddleware');

router.post('/', verifyToken, towerController.createTower);
router.get('/', verifyToken, towerController.getAllTowers);
router.get('/:id', verifyToken, towerController.getTowerById);
router.put('/:id', verifyToken, towerController.updateTower);
router.delete('/:id', verifyToken, towerController.deleteTower);

module.exports = router;