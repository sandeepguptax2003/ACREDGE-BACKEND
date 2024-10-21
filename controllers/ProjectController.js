const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');

exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const errors = Project.validate(projectData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    projectData.createdBy = req.user.email;
    projectData.updatedBy = req.user.email;

    const project = new Project(projectData);
    const docRef = await db.collection(Project.collectionName).add(project.toFirestore());
    
    res.status(201).json({ id: docRef.id, ...project });
  } catch (error) {
    console.error('Error in Create Project:', error);
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
    const updatedData = req.body;
    const errors = Project.validate(updatedData);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    updatedData.updatedBy = req.user.email;

    const project = new Project(updatedData);
    await db.collection(Project.collectionName).doc(id).update(project.toFirestore());
    
    res.status(200).json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error in Update Project:', error);
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