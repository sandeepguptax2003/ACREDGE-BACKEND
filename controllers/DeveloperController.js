const Developer = require('../models/DeveloperModel');
const { db } = require('../config/firebase');

exports.createDeveloper = async (req, res) => {
  try {
    const developerData = req.body;
    const errors = Developer.validate(developerData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    developerData.createdBy = req.user.email;
    developerData.updatedBy = req.user.email;

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
    const errors = Developer.validate(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    updatedData.updatedBy = req.user.email;

    const developer = new Developer(updatedData);
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