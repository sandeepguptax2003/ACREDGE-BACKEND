const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const { isAuthenticated } = require('../controllers/LoginController');
const { upload, uploadFields } = require('../middleware/UploadMiddleware');

router.post('/', isAuthenticated, upload.fields(uploadFields), projectController.createProject);
router.get('/', isAuthenticated, projectController.getAllProjects);
router.get('/:id', isAuthenticated, projectController.getProjectById);
router.put('/:id', isAuthenticated, upload.fields(uploadFields), projectController.updateProject);
router.delete('/:id', isAuthenticated, projectController.deleteProject);

module.exports = router;