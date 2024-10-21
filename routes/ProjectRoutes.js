const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { isAuthenticated } = require('../controllers/LoginController');

router.post('/', isAuthenticated, projectController.createProject);
router.get('/', isAuthenticated, projectController.getAllProjects);
router.get('/:id', isAuthenticated, projectController.getProjectById);
router.put('/:id', isAuthenticated, projectController.updateProject);
router.delete('/:id', isAuthenticated, projectController.deleteProject);

module.exports = router;