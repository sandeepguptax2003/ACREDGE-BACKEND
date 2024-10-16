const { db } = require('../config/firebase');
const Project = require('../models/ProjectModel');

exports.createProject = async (req, res) => {
  try {
    const projectData = {
      ...req.body,
      createdBy: req.user.email,
      updatedBy: req.user.email
    };

    const project = new Project(projectData);
    const errors = Project.validate(project);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const docRef = await db.collection(Project.collectionName).add(project.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...project.toFirestore() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const snapshot = await db.collection(Project.collectionName).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProjectById = async (req, res) => {
  try {
    const docRef = await db.collection(Project.collectionName).doc(req.params.id).get();
    
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedBy: req.user.email,
      updatedOn: new Date()
    };

    const project = new Project(updateData);
    const errors = Project.validate(project);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    await db.collection(Project.collectionName).doc(id).update(project.toFirestore());
    
    res.status(200).json({ message: 'Project updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    await db.collection(Project.collectionName).doc(req.params.id).delete();
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};