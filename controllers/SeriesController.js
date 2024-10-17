const Series = require('../models/SeriesModel');
const { db } = require('../config/firebase');

exports.createSeries = async (req, res) => {
  try {
    const seriesData = req.body;
    const errors = Series.validate(seriesData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const series = new Series(seriesData);
    const docRef = await db.collection(Series.collectionName).add(series.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...series });
  } catch (error) {
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
    const errors = Series.validate(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const series = new Series(updatedData);
    await db.collection(Series.collectionName).doc(id).update(series.toFirestore());
    
    res.status(200).json({ message: 'Series updated successfully' });
  } catch (error) {
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