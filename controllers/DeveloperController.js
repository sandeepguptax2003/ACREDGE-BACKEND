const { db } = require('../config/firebase');
const Developer = require('../models/DeveloperModel');

exports.createDeveloper = async (req, res) => {
  try {
    const developerData = {
      ...req.body,
      name: req.body.name.toUpperCase(),
      createdBy: req.user.email,
      updatedBy: req.user.email,
      createdOn: new Date(),
      updatedOn: new Date()
    };

    const developer = new Developer(developerData);
    const errors = Developer.validate(developer);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const docRef = await db.collection(Developer.collectionName).add(developer.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...developer.toFirestore() });
  } catch (error) {
    console.error("Error creating developer:", error);
    res.status(500).json({ error: "An error occurred while creating the developer" });
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
    const updateData = {
      ...req.body,
      name: req.body.name.toUpperCase(),
      updatedBy: req.user.email,
      updatedOn: new Date()
    };

    const developer = new Developer(updateData);
    const errors = Developer.validate(developer);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await db.collection(Developer.collectionName).doc(id).update(developer.toFirestore());
    
    res.status(200).json({ message: 'Developer updated successfully' });
  } catch (error) {
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