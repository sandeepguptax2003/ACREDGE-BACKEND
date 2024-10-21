const express = require('express');
const router = express.Router();
const developerController = require('../controllers/DeveloperController');
const { isAuthenticated } = require('../controllers/LoginController');

router.post('/', isAuthenticated, developerController.createDeveloper);
router.get('/', isAuthenticated, developerController.getAllDevelopers);
router.get('/:id', isAuthenticated,developerController.getDeveloperById);
router.put('/:id', isAuthenticated, developerController.updateDeveloper);
router.delete('/:id', isAuthenticated, developerController.deleteDeveloper);

module.exports = router;