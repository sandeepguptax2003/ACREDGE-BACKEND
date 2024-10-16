const express = require('express');
const router = express.Router();
const developerController = require('../controllers/DeveloperController');
const { verifyToken } = require('../middleware/LoginMiddleware');

router.post('/', verifyToken, developerController.createDeveloper);
router.get('/', verifyToken, developerController.getAllDevelopers);
router.get('/:id', verifyToken, developerController.getDeveloperById);
router.put('/:id', verifyToken, developerController.updateDeveloper);
router.delete('/:id', verifyToken, developerController.deleteDeveloper);

module.exports = router;