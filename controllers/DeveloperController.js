const Developer = require('../models/DeveloperModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles } = require('../utils/FilesUpload');

exports.createDeveloper = async (req, res) => {
  try {
    const developerData = req.body;
    const files = req.files;
    
    // Handle file uploads
    if (files) {
      if (files.images) {
        developerData.images = await uploadMultipleFiles(files.images, 'developers/images');
      }
      if (files.videos) {
        developerData.videos = await uploadMultipleFiles(files.videos, 'developers/videos');
      }
    }

    const errors = Developer.validate(developerData);

    if (errors.length > 0) {
      // Delete uploaded files if validation fails
      await deleteMultipleFiles(developersData.images);
      await deleteMultipleFiles(developersData.videos);
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    developerData.createdBy = req.user.email;
    developerData.createdOn = new Date();
    developerData.updatedBy = null;
    developerData.updatedOn = null;

    const developer = new Developer(developerData);
    const docRef = await db.collection(Developer.collectionName).add(developer.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...developer });
  } catch (error) {
    console.error('Error in Create Developer:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllDevelopers = async (req, res) => {
  try {
    const snapshot = await db.collection(Developer.collectionName).get();
    const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(developers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDeveloperById = async (req, res) => {
  try {
    const docRef = await db.collection(Developer.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Developer not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDeveloper = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;

    const developerDoc = await db.collection(Developer.collectionName).doc(id).get();
    if (!developerDoc.exists) {
      return res.status(404).json({ message: 'Developer not found' });
    }

    const existingData = projectDoc.data();

    // Handle file uploads and deletions
    if (files) {
      if (files.images) {
        // Delete old images if specified in req.body.deleteImages
        if (req.body.deleteImages) {
          const deleteImages = JSON.parse(req.body.deleteImages);
          await deleteMultipleFiles(deleteImages);
          updatedData.images = existingData.images.filter(url => !deleteImages.includes(url));
        }
        // Add new images
        const newImages = await uploadMultipleFiles(files.images, 'developers/logos');
        updatedData.images = [...(updatedData.images || []), ...newImages];
      }
    }

    const errors = Project.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    const developer = new Developer({ ...existingData, ...updatedData });
    await db.collection(Developer.collectionName).doc(id).update(developer.toFirestore());
    
    res.status(200).json({ message: 'Developer updated successfully' });
  } catch (error) {
    console.error('Error in Update Developer:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteDeveloper = async (req, res) => {
  try {
    await db.collection(Developer.collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Developer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};