const Series = require('../models/SeriesModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

exports.createSeries = async (req, res) => {
  try {
    const seriesData = req.body;
    const files = req.files;

    // Handle file uploads
    if (files) {
      if (files.images) {
        seriesData.images = await uploadMultipleFiles(files.images, 'series/images');
      }
      if (files.videos) {
        seriesData.videos = await uploadMultipleFiles(files.videos, 'series/videos');
      }
    }

    const errors = Series.validate(seriesData);

    if (errors.length > 0) {
      // Delete uploaded files if validation fails
      if (seriesData.images) await deleteMultipleFiles(seriesData.images);
      if (seriesData.videos) await deleteMultipleFiles(seriesData.videos);
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    seriesData.createdBy = req.user.email;
    seriesData.createdOn = new Date();
    seriesData.updatedBy = null;
    seriesData.updatedOn = null;

    const series = new Series(seriesData);
    const docRef = await db.collection(Series.collectionName).add(series.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...series });
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
        const newImages = await uploadMultipleFiles(files.images, 'series/images');
        updatedData.images = [...(updatedData.images || []), ...newImages];
      }

      if (files.videos) {
        // Handle video updates similarly to images
        if (req.body.deleteVideos) {
          const deleteVideos = JSON.parse(req.body.deleteVideos);
          await deleteMultipleFiles(deleteVideos);
          updatedData.videos = existingData.videos.filter(url => !deleteVideos.includes(url));
        }
        const newVideos = await uploadMultipleFiles(files.videos, 'series/videos');
        updatedData.videos = [...(updatedData.videos || []), ...newVideos];
      }
    }

    const errors = Series.validate({ ...existingData, ...updatedData });
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

    const series = new Series({ ...existingData, ...updatedData });
    await db.collection(Series.collectionName).doc(id).update(series.toFirestore());
    
    res.status(200).json({ message: 'Series updated successfully' });
  } catch (error) {
    console.error('Error in Update Series:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSeries = async (req, res) => {
  try {
    await db.collection(Series.collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Series deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};