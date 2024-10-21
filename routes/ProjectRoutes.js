const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { verifyToken } = require('../middleware/LoginMiddleware');

router.post('/', verifyToken, projectController.createProject);
router.get('/', verifyToken, projectController.getAllProjects);
router.get('/:id', verifyToken, projectController.getProjectById);
router.put('/:id', verifyToken, projectController.updateProject);
router.delete('/:id', verifyToken, projectController.deleteProject);

module.exports = router;