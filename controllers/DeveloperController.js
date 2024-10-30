const Developer = require('../models/DeveloperModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

// Function to create a new developer in the database
exports.createDeveloper = async (req, res) => {
  try {
    // Extract data from request
    const developerData = req.body;
    const files = req.files;

    // Create a document in Firebase to get an ID for the developer
    const docRef = await db.collection(Developer.collectionName).add({
      createdBy: req.user.email, // Set createdBy as the user's email from the request
      createdOn: new Date(),      // Set createdOn as the current date and time
    });
    
    // If a logo file is provided, upload it and add the URL to developer data
    if (files && files.logoUrl) {
      const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', docRef.id);
      developerData.logoUrl = logoUrl;
    }

    // Validate the developer data
    const errors = Developer.validate(developerData);
    if (errors.length > 0) {
      // If validation fails, delete any uploaded logo and the document in Firebase
      if (developerData.logoUrl) {
        await deleteFromFirebase(developerData.logoUrl);
      }
      await docRef.delete();
      return res.status(400).json({ errors }); // Return validation errors
    }

    // Check if user is authenticated
    if (!req.user || !req.user.email) {
      await docRef.delete();
      return res.status(401).json({ message: "Authentication required" });
    }

    // Add metadata for audit tracking
    developerData.createdBy = req.user.email;
    developerData.createdOn = new Date();
    developerData.updatedBy = null;
    developerData.updatedOn = null;

    // Convert data into a Developer object and update the document with developer information
    const developer = new Developer(developerData);
    await docRef.update(developer.toFirestore());

    // Respond with the created developer's details
    res.status(201).json({
      id: docRef.id,
      ...developer.toFirestore()
    });
  } catch (error) {
    console.error('Error in Create Developer:', error);
    res.status(500).json({ error: error.message });
  }
};

// Function to get all developers in the database
exports.getAllDevelopers = async (req, res) => {
  try {
    const snapshot = await db.collection(Developer.collectionName).get();
    const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(developers); // Return the list of all developers
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to get a specific developer by ID
exports.getDeveloperById = async (req, res) => {
  try {
    const docRef = await db.collection(Developer.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Developer not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() }); // Return the developer data
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to update developer data by ID
exports.updateDeveloper = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;

    // Check if the developer exists in the database
    const developerDoc = await db.collection(Developer.collectionName).doc(id).get();
    if (!developerDoc.exists) {
      return res.status(404).json({ message: 'Developer not found' });
    }

    const existingData = developerDoc.data();

    // Update logo if a new file is provided
    if (files && files.logoUrl) {
      try {
        const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', id);
        updatedData.logoUrl = logoUrl;

        // Delete the old logo if it exists
        if (existingData.logoUrl && typeof existingData.logoUrl === 'string' && existingData.logoUrl.trim() !== '') {
          try {
            await deleteFromFirebase(existingData.logoUrl);
            console.log('Successfully deleted old logo:', existingData.logoUrl);
          } catch (deleteError) {
            console.error("Error deleting old logo:", deleteError);
          }
        }
      } catch (uploadError) {
        console.error("Error uploading new logo:", uploadError);
        return res.status(500).json({ error: "Error uploading new logo." });
      }
    }

    // Validate the updated data
    const errors = Developer.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      // Delete the uploaded logo if validation fails
      if (updatedData.logoUrl) {
        try {
          await deleteFromFirebase(updatedData.logoUrl);
        } catch (error) {
          console.error("Error deleting invalid logo:", error);
        }
      }
      return res.status(400).json({ errors });
    }

    // Ensure the user is authenticated
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Set metadata for auditing purposes
    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    // Create a Developer object and update it in the database
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

// Function to delete a developer by ID
exports.deleteDeveloper = async (req, res) => {
  try {
    await db.collection(Developer.collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Developer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
