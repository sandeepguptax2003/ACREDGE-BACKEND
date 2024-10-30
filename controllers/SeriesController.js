const Series = require('../models/SeriesModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

exports.createSeries = async (req, res) => {
  try {
    const seriesData = req.body;
    const files = req.files;

    // Create document first to get ID
    const docRef = await db.collection(Series.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    console.log("Received series data:", seriesData);
    console.log("Files received:", files);

    // Upload inside images with series ID
    if (files.insideImagesUrls && Array.isArray(files.insideImagesUrls)) {
      try {
        console.log("Uploading inside images...");
        seriesData.insideImagesUrls = await uploadMultipleFiles(files.insideImagesUrls, 'insideImagesUrls', docRef.id);
        console.log("Uploaded inside images URLs:", seriesData.insideImagesUrls);
      } catch (error) {
        console.error('Error uploading inside images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside images. ' + error.message });
      }
    }

    // Upload inside videos with series ID
    if (files.insideVideosUrls && Array.isArray(files.insideVideosUrls)) {
      try {
        console.log("Uploading inside videos...");
        seriesData.insideVideosUrls = await uploadMultipleFiles(files.insideVideosUrls, 'insideVideosUrls', docRef.id);
        console.log("Uploaded inside videos URLs:", seriesData.insideVideosUrls);
      } catch (error) {
        console.error('Error uploading inside videos:', error);
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading inside videos. ' + error.message });
      }
    }

    // Upload layout plan with series ID
    if (files.layoutPlanUrl) {
      try {
        console.log("Uploading layout plan...");
        const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', docRef.id);
        seriesData.layoutPlanUrl = layoutPlanUrl;
        console.log("Layout plan URL:", layoutPlanUrl);
      } catch (error) {
        console.error('Error uploading layout plan:', error);
        if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
        if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading layout plan. ' + error.message });
      }
    }

    const errors = Series.validate(seriesData);
    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      if (seriesData.insideImagesUrls) await deleteMultipleFiles(seriesData.insideImagesUrls);
      if (seriesData.insideVideosUrls) await deleteMultipleFiles(seriesData.insideVideosUrls);
      if (seriesData.layoutPlanUrl) await deleteFromFirebase(seriesData.layoutPlanUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      await docRef.delete();
      return res.status(401).json({ message: "Authentication required" });
    }

    seriesData.createdBy = req.user.email;
    seriesData.createdOn = new Date();

    const series = new Series(seriesData);
    await docRef.update(series.toFirestore());
    
    console.log("Series created successfully with ID:", docRef.id);
    res.status(201).json({ id: docRef.id, ...series.toFirestore() });
  } catch (error) {
    console.error('Error in Create Series:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSeries = async (req, res) => {
  try {
    const snapshot = await db.collection(Series.collectionName).get();
    const seriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(seriesList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSeriesById = async (req, res) => {
  try {
    const docRef = await db.collection(Series.collectionName).doc(req.params.id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;

    const seriesDoc = await db.collection(Series.collectionName).doc(id).get();
    if (!seriesDoc.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    const existingData = seriesDoc.data();

    if (files || req.body.deleteInsideImages || req.body.deleteInsideVideos) {
      // Handle inside images
      if (files?.insideImagesUrls || req.body.deleteInsideImages) {
        try {
          const deleteImages = req.body.deleteInsideImages ? JSON.parse(req.body.deleteInsideImages) : [];
          updatedData.insideImagesUrls = await handleFileUpdates(
            existingData.insideImagesUrls,
            deleteImages,
            files?.insideImagesUrls,
            'insideImagesUrls',
            id
          );
        } catch (error) {
          console.error('Error handling inside images:', error);
          return res.status(400).json({ error: 'Error handling inside images. ' + error.message });
        }
      }

      // Handle inside videos
      if (files?.insideVideosUrls || req.body.deleteInsideVideos) {
        try {
          const deleteVideos = req.body.deleteInsideVideos ? JSON.parse(req.body.deleteInsideVideos) : [];
          updatedData.insideVideosUrls = await handleFileUpdates(
            existingData.insideVideosUrls,
            deleteVideos,
            files?.insideVideosUrls,
            'insideVideosUrls',
            id
          );
        } catch (error) {
          console.error('Error handling inside videos:', error);
          return res.status(400).json({ error: 'Error handling inside videos. ' + error.message });
        }
      }

      // Handle layout plan (single file)
      if (files?.layoutPlanUrl) {
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

    const errors = Series.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Update metadata
    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    const series = new Series({ ...existingData, ...updatedData });
    await db.collection(Series.collectionName).doc(id).update(series.toFirestore());

    res.status(200).json({
      message: 'Series updated successfully',
      data: series.toFirestore()
    });
  } catch (error) {
    console.error('Error in Update Series:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.deleteSeries = async (req, res) => {
  try {
    const seriesDoc = await db.collection(Series.collectionName).doc(req.params.id).get();
    if (!seriesDoc.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }

    // Delete associated files
    const seriesData = seriesDoc.data();
    if (seriesData.insideImagesUrls) {
      await deleteMultipleFiles(seriesData.insideImagesUrls);
    }
    if (seriesData.insideVideosUrls) {
      await deleteMultipleFiles(seriesData.insideVideosUrls);
    }
    if (seriesData.layoutPlanUrl) {
      await deleteFromFirebase(seriesData.layoutPlanUrl);
    }

    // Delete the document
    await db.collection(Series.collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Series and associated files deleted successfully' });
  } catch (error) {
    console.error('Error in Delete Series:', error);
    res.status(500).json({ error: error.message });
  }
};