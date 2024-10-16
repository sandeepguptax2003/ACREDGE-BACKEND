const { db } = require('../config/firebase');
const Tower = require('../models/TowerModel');

exports.createTower = async (req, res) => {
  try {
    const towerData = {
      ...req.body,
      createdBy: req.user.email,
      updatedBy: req.user.email
    };

    const tower = new Tower(towerData);
    const errors = Tower.validate(tower);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const docRef = await db.collection(Tower.collectionName).add(tower.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...tower.toFirestore() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTowers = async (req, res) => {
  try {
    const snapshot = await db.collection(Tower.collectionName).get();
    const towers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(towers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTowerById = async (req, res) => {
  try {
    const docRef = await db.collection(Tower.collectionName).doc(req.params.id).get();
    
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Tower not found' });
    }
    
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateTower = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.email,
      updatedOn: new Date()
    };

    const tower = new Tower(updateData);
    const errors = Tower.validate(tower);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await db.collection(Tower.collectionName).doc(id).update(tower.toFirestore());
    
    res.status(200).json({ message: 'Tower updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteTower = async (req, res) => {
  try {
    await db.collection(Tower.collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Tower deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};