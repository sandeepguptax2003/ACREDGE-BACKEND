const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles } = require('../utils/FilesUpload');

exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const files = req.files;

    // Handle file uploads
    if (files) {
      if (files.images) {
        projectData.images = await uploadMultipleFiles(files.images, 'projects/images');
      }
      if (files.videos) {
        projectData.videos = await uploadMultipleFiles(files.videos, 'projects/videos');
      }
      if (files.brochureUrl) {
        const [brochureUrl] = await uploadMultipleFiles([files.brochureUrl[0]], 'projects/brochures');
        projectData.brochureUrl = brochureUrl;
      }
    }

    const errors = Project.validate(projectData);
    if (errors.length > 0) {
      // Delete uploaded files if validation fails
      await deleteMultipleFiles(projectData.images);
      await deleteMultipleFiles(projectData.videos);
      if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
      return res.status(400).json({ errors });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }

    projectData.createdBy = req.user.email;
    projectData.createdOn = new Date();
    projectData.updatedBy = null;
    projectData.updatedOn = null;

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
    const files = req.files;

    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const existingData = projectDoc.data();

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
        const newImages = await uploadMultipleFiles(files.images, 'projects/images');
        updatedData.images = [...(updatedData.images || []), ...newImages];
      }

      if (files.videos) {
        // Handle video updates similarly to images
        if (req.body.deleteVideos) {
          const deleteVideos = JSON.parse(req.body.deleteVideos);
          await deleteMultipleFiles(deleteVideos);
          updatedData.videos = existingData.videos.filter(url => !deleteVideos.includes(url));
        }
        const newVideos = await uploadMultipleFiles(files.videos, 'projects/videos');
        updatedData.videos = [...(updatedData.videos || []), ...newVideos];
      }

      if (files.brochureUrl) {
        // Delete old brochure if it exists
        if (existingData.brochureUrl) {
          await deleteFromFirebase(existingData.brochureUrl);
        }
        const [brochureUrl] = await uploadMultipleFiles([files.brochureUrl[0]], 'projects/brochures');
        updatedData.brochureUrl = brochureUrl;
      }
    }

    const errors = Project.validate({ ...existingData, ...updatedData });
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

    const project = new Project({ ...existingData, ...updatedData });
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