const Developer = require('../models/DeveloperModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

exports.createDeveloper = async (req, res) => {
  try {
    const developerData = req.body;
    const files = req.files;

    // Create document first to get ID
    const docRef = await db.collection(Developer.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });
    
    if (files && files.images) {
      const [images] = await uploadMultipleFiles(files.images, 'images', docRef.id);
      developerData.images = images;
    }

    const errors = Developer.validate(developerData);
    if (errors.length > 0) {
      if (developerData.images) {
        await deleteFromFirebase(developerData.images);
      }
      await docRef.delete(); // Clean up the document if validation fails
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      await docRef.delete();
      return res.status(401).json({ message: "Authentication required" });
    }

    developerData.createdBy = req.user.email;
    developerData.createdOn = new Date();
    developerData.updatedBy = null;
    developerData.updatedOn = null;

    const developer = new Developer(developerData);
    await docRef.update(developer.toFirestore());

    res.status(201).json({
      id: docRef.id,
      ...developer.toFirestore()
    });
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

    const existingData = developerDoc.data();

    if (files && files.images) {
      try {
        const [images] = await uploadMultipleFiles(files.images, 'images', id);
        updatedData.images = images;

        if (existingData.images && typeof existingData.images === 'string' && existingData.images.trim() !== '') {
          try {
            await deleteFromFirebase(existingData.images);
            console.log('Successfully deleted old logo:', existingData.images);
          } catch (deleteError) {
            console.error("Error deleting old logo:", deleteError);
          }
        }
      } catch (uploadError) {
        console.error("Error uploading new logo:", uploadError);
        return res.status(500).json({ error: "Error uploading new logo." });
      }
    }

    const errors = Developer.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      if (updatedData.images) {
        try {
          await deleteFromFirebase(updatedData.images);
        } catch (error) {
          console.error("Error deleting invalid logo:", error);
        }
      }
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

    res.status(200).json({
      message: 'Developer updated successfully',
      data: developer.toFirestore()
    });
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