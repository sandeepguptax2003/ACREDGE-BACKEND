const Series = require('../models/SeriesModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

// Controller for creating a new series
exports.createSeries = async (req, res) => {
  try {
    const seriesData = req.body; // Data sent from client about the series
    const files = req.files; // Files uploaded with the request

    // Create a new document in the Series collection to get an auto-generated ID
    const docRef = await db.collection(Series.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    // Log received data and files for debugging
    console.log("Received series data:", seriesData);
    console.log("Files received:", files);

    // Upload multiple images associated with this series, if any
    if (files.insideImagesUrls && Array.isArray(files.insideImagesUrls)) {
      try {
        console.log("Uploading inside images...");
        seriesData.insideImagesUrls = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', docRef.id);
        console.log("Uploaded inside images URLs:", seriesData.insideImagesUrls);
      } catch (error) {
        // Handle error by deleting the series document and returning an error message
        console.error('Error uploading inside images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside images. ' + error.message });
      }
    }

    // Upload multiple videos, if provided
    if (files.insideVideosUrls && Array.isArray(files.insideVideosUrls)) {
      try {
        console.log("Uploading inside videos...");
        seriesData.insideVideosUrls = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', docRef.id);
        console.log("Uploaded inside videos URLs:", seriesData.insideVideosUrls);
      } catch (error) {
        console.error('Error uploading inside videos:', error);
        // Clean up by deleting any previously uploaded images and the document
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside videos. ' + error.message });
      }
    }

    // Upload layout plan if provided
    if (files.layoutPlanUrl) {
      try {
        console.log("Uploading layout plan...");
        const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', docRef.id);
        seriesData.layoutPlanUrl = layoutPlanUrl;
        console.log("Layout plan URL:", layoutPlanUrl);
      } catch (error) {
        console.error('Error uploading layout plan:', error);
        // Clean up by deleting uploaded files and document in case of error
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading layout plan. ' + error.message });
      }
    }

    // Validate series data; if invalid, delete uploaded data and document
    const errors = Series.validate(seriesData);
    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
      if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
      if (seriesData.layoutPlanUrl) await deleteFromFirebase(seriesData.layoutPlanUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    // Ensure user is authenticated; if not, delete document
    if (!req.user || !req.user.email) {
      await docRef.delete();
      return res.status(401).json({ message: "Authentication required" });
    }

    // Update series data with creator information and timestamp
    seriesData.createdBy = req.user.email;
    seriesData.createdOn = new Date();

    // Save series data to Firestore document
    const series = new Series(seriesData);
    await docRef.update(series.toFirestore());

    console.log("Series created successfully with ID:", docRef.id);
    res.status(201).json({ id: docRef.id, ...series.toFirestore() });
  } catch (error) {
    console.error('Error in Create Series:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller for fetching all series
exports.getAllSeries = async (req, res) => {
  try {
    // Retrieve all series from the Series collection
    const snapshot = await db.collection(Series.collectionName).get();
    const seriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller for fetching a specific series by its ID
exports.getSeriesById = async (req, res) => {
  try {
    // Retrieve the series document based on ID
    const docRef = await db.collection(Series.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Controller for updating a series
exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params; // ID of the series to update
    const updatedData = req.body;
    const files = req.files;

    // Check if the series document exists
    const seriesDoc = await db.collection(Series.collectionName).doc(id).get();
    if (!seriesDoc.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    const existingData = seriesDoc.data();

    if (files) {
      // Handle images upload, deletion, and addition if provided
      if (files.insideImagesUrls) {
        if (req.body.deleteInsideImages) {
          try {
            const deleteImages = JSON.parse(req.body.deleteInsideImages);
            await deleteMultipleFiles(deleteImages);
            updatedData.insideImagesUrls = (existingData.insideImagesUrls || []).filter(url => !deleteImages.includes(url));
          } catch (error) {
            console.error('Error deleting inside images:', error);
            return res.status(400).json({ error: 'Error deleting inside images. ' + error.message });
          }
        }

        try {
          const newImages = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', id);
          updatedData.insideImagesUrls = [...(updatedData.insideImagesUrls || existingData.insideImagesUrls || []), ...newImages];
        } catch (error) {
          console.error('Error uploading new inside images:', error);
          return res.status(400).json({ error: 'Error uploading new inside images. ' + error.message });
        }
      }

      // Handle videos upload, deletion, and addition if provided
      if (files.insideVideosUrls) {
        if (req.body.deleteInsideVideos) {
          try {
            const deleteVideos = JSON.parse(req.body.deleteInsideVideos);
            await deleteMultipleFiles(deleteVideos);
            updatedData.insideVideosUrls = (existingData.insideVideosUrls || []).filter(url => !deleteVideos.includes(url));
          } catch (error) {
            console.error('Error deleting inside videos:', error);
            return res.status(400).json({ error: 'Error deleting inside videos. ' + error.message });
          }
        }

        try {
          const newVideos = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', id);
          updatedData.insideVideosUrls = [...(updatedData.insideVideosUrls || existingData.insideVideosUrls || []), ...newVideos];
        } catch (error) {
          console.error('Error uploading new inside videos:', error);
          return res.status(400).json({ error: 'Error uploading new inside videos. ' + error.message });
        }
      }

      // Handle layout plan upload
      if (files.layoutPlanUrl) {
        try {
          if (existingData.layoutPlanUrl) {
            await deleteFromFirebase(existingData.layoutPlanUrl);
          }
          const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', id);
          updatedData.layoutPlanUrl = layoutPlanUrl;
        } catch (error) {
          console.error('Error handling layout plan:', error);
          return res.status(400).json({ error: 'Error handling layout plan. ' + error.message });
        }
      }
    }

    // Validate updated data before saving
    const errors = Series.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Ensure user authentication before updating
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    // Update document with the new data
    await db.collection(Series.collectionName).doc(id).update(updatedData);

    res.status(200).json({ id, ...updatedData });
  } catch (error) {
    console.error('Error updating series:', error);
    res.status(500).json({ error: error.message });
  }
};

// Controller for deleting a series by ID
exports.deleteSeries = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the document to access any files for deletion
    const docRef = db.collection(Series.collectionName).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }

    const data = doc.data();

    // Delete any associated files (images, videos, layout plan) from storage
    if (data.insideImagesUrls) await deleteMultipleFiles(data.insideImagesUrls);
    if (data.insideVideosUrls) await deleteMultipleFiles(data.insideVideosUrls);
    if (data.layoutPlanUrl) await deleteFromFirebase(data.layoutPlanUrl);

    // Delete the Firestore document
    await docRef.delete();

    res.status(200).json({ message: 'Series deleted successfully' });
  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({ error: error.message });
  }
};
