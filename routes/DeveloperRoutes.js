const express = require('express');
const router = express.Router();

const developerController = require('../controllers/DeveloperController');

const { isAuthenticated } = require('../controllers/LoginController');

const { upload, uploadFields } = require('../middleware/UploadMiddleware');
const { verifyDomainAccess } = require('../middleware/CrossSiteAuth');

// Route to create a new developer and handles file uploads
router.post('/', isAuthenticated, upload.fields(uploadFields), developerController.createDeveloper);

// Route to retrieve all developers
// router.get('/', isAuthenticated, developerController.getAllDevelopers);

router.get('/', 
  verifyDomainAccess,
  async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // Allow access if it's either an admin email or a valid user phone number
      if (decoded.email?.endsWith('@acredge.in') || decoded.phoneNumber) {
        return next();
      }
      return res.status(403).json({ message: "Unauthorized access" });
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }
  },
  developerController.getAllDevelopers
);

// Route to retrieve a specific developer by their ID
router.get('/:id', isAuthenticated, developerController.getDeveloperById);

// Route to update an existing developer by their ID and handles file uploads
router.put('/:id', isAuthenticated, upload.fields(uploadFields), developerController.updateDeveloper);

// Route to delete a developer by their ID
// router.delete('/:id', isAuthenticated, developerController.deleteDeveloper);

module.exports = router;