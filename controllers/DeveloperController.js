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
    
    if (files && files.logoUrl) {
      const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', docRef.id);
      developerData.logoUrl = logoUrl;
    }

    const errors = Developer.validate(developerData);
    if (errors.length > 0) {
      if (developerData.logoUrl) {
        await deleteFromFirebase(developerData.logoUrl);
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

// exports.updateDeveloper = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const updatedData = req.body;
//     const files = req.files;

//     const developerDoc = await db.collection(Developer.collectionName).doc(id).get();
//     if (!developerDoc.exists) {
//       return res.status(404).json({ message: 'Developer not found' });
//     }

//     const existingData = developerDoc.data();

//     if (files && files.logoUrl) {
//       try {
//         const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', id);
//         updatedData.logoUrl = logoUrl;

//         if (existingData.logoUrl && typeof existingData.logoUrl === 'string' && existingData.logoUrl.trim() !== '') {
//           try {
//             await deleteFromFirebase(existingData.logoUrl);
//             console.log('Successfully deleted old logo:', existingData.logoUrl);
//           } catch (deleteError) {
//             console.error("Error deleting old logo:", deleteError);
//           }
//         }
//       } catch (uploadError) {
//         console.error("Error uploading new logo:", uploadError);
//         return res.status(500).json({ error: "Error uploading new logo." });
//       }
//     }

//     const errors = Developer.validate({ ...existingData, ...updatedData });
//     if (errors.length > 0) {
//       if (updatedData.logoUrl) {
//         try {
//           await deleteFromFirebase(updatedData.logoUrl);
//         } catch (error) {
//           console.error("Error deleting invalid logo:", error);
//         }
//       }
//       return res.status(400).json({ errors });
//     }

//     if (!req.user || !req.user.email) {
//       return res.status(401).json({ message: "Authentication required" });
//     }

//     updatedData.createdBy = existingData.createdBy;
//     updatedData.createdOn = existingData.createdOn;
//     updatedData.updatedBy = req.user.email;
//     updatedData.updatedOn = new Date();

//     const developer = new Developer({ ...existingData, ...updatedData });
//     await db.collection(Developer.collectionName).doc(id).update(developer.toFirestore());

//     res.status(200).json({
//       message: 'Developer updated successfully',
//       data: developer.toFirestore()
//     });
//   } catch (error) {
//     console.error('Error in Update Developer:', error);
//     res.status(500).json({ error: error.message });
//   }
// };

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
    
    // Handle logo update
    if (req.body.removeLogo === 'true' || files?.logoUrl) {
      // Delete existing logo if it exists
      if (existingData.logoUrl) {
        try {
          await deleteFromFirebase(existingData.logoUrl);
          updatedData.logoUrl = null;
        } catch (error) {
          console.error("Error deleting old logo:", error);
          return res.status(500).json({ error: "Error deleting old logo." });
        }
      }
      
      // Upload new logo if provided
      if (files?.logoUrl) {
        try {
          const [logoUrl] = await uploadMultipleFiles(files.logoUrl, 'logoUrl', id);
          updatedData.logoUrl = logoUrl;
        } catch (uploadError) {
          console.error("Error uploading new logo:", uploadError);
          return res.status(500).json({ error: "Error uploading new logo." });
        }
      }
    }

    const errors = Developer.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      if (updatedData.logoUrl) {
        try {
          await deleteFromFirebase(updatedData.logoUrl);
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