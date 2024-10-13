const express = require('express');
const router = express.Router();
const developerController = require('../controllers/DeveloperController');

// Create a new developer
router.post('/', developerController.createDeveloper);

// Get all developers
router.get('/', developerController.getAllDevelopers);

// Get a single developer by ID
router.get('/:id', developerController.getDeveloperById);

// Update a developer
router.put('/:id', developerController.updateDeveloper);

// Delete a developer
router.delete('/:id', developerController.deleteDeveloper);

module.exports = router;