const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const files = req.files;

    // Create document first to get ID
    const docRef = await db.collection(Project.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    console.log("Received project data:", projectData);
    console.log("Files received:", files);

    if (files.images && Array.isArray(files.images)) {
      try {
        console.log("Uploading images...");
        projectData.images = await uploadMultipleFiles(files.images, 'images', docRef.id);
        console.log("Uploaded images URLs:", projectData.images);
      } catch (error) {
        console.error('Error uploading images:', error);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading images. ' + error.message });
      }
    }

    if (files.videos && Array.isArray(files.videos)) {
      try {
        console.log("Uploading videos...");
        projectData.videos = await uploadMultipleFiles(files.videos, 'videos', docRef.id);
        console.log("Uploaded videos URLs:", projectData.videos);
      } catch (error) {
        console.error('Error uploading videos:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading videos. ' + error.message });
      }
    }

    if (files.brochureUrl) {
      try {
        console.log("Uploading brochure...");
        const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl', docRef.id);
        projectData.brochureUrl = brochureUrl;
        console.log("Brochure URL:", brochureUrl);
      } catch (error) {
        console.error('Error uploading brochure:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading brochure. ' + error.message });
      }
    }

    if (files.layoutPlanUrl) {
      try {
        console.log("Uploading layout plan...");
        const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl', docRef.id);
        projectData.layoutPlanUrl = layoutPlanUrl;
        console.log("Layout plan URL:", layoutPlanUrl);
      } catch (error) {
        console.error('Error uploading layout plan:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
        await docRef.delete();
        return res.status(400).json({ error: 'Error uploading layout plan. ' + error.message });
      }
    }

    const errors = Project.validate(projectData);
    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      await deleteMultipleFiles(projectData.images);
      await deleteMultipleFiles(projectData.videos);
      if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
      if (projectData.layoutPlanUrl) await deleteFromFirebase(projectData.layoutPlanUrl);
      await docRef.delete();
      return res.status(400).json({ errors });
    }

    projectData.createdBy = req.user.email;
    projectData.createdOn = new Date();

    const project = new Project(projectData);
    await docRef.update(project.toFirestore());

    console.log("Project created successfully with ID:", docRef.id);
    res.status(201).json({ id: docRef.id, ...project.toFirestore() });
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

    if (files) {
      if (files.images) {
        if (req.body.deleteImages) {
          try {
            const deleteImages = JSON.parse(req.body.deleteImages);
            await deleteMultipleFiles(deleteImages);
            updatedData.images = (existingData.images || []).filter(url => !deleteImages.includes(url));
          } catch (error) {
            console.error('Error deleting images:', error);
            return res.status(400).json({ error: 'Error deleting images. ' + error.message });
          }
        }
        try {
          const newImages = await uploadMultipleFiles(files.images, 'images', id);
          updatedData.images = [...(updatedData.images || existingData.images || []), ...newImages];
        } catch (error) {
          console.error('Error uploading new images:', error);
          return res.status(400).json({ error: 'Error uploading new images. ' + error.message });
        }
      }

      if (files.videos) {
        if (req.body.deleteVideos) {
          try {
            const deleteVideos = JSON.parse(req.body.deleteVideos);
            await deleteMultipleFiles(deleteVideos);
            updatedData.videos = (existingData.videos || []).filter(url => !deleteVideos.includes(url));
          } catch (error) {
            console.error('Error deleting videos:', error);
            return res.status(400).json({ error: 'Error deleting videos. ' + error.message });
          }
        }
        try {
          const newVideos = await uploadMultipleFiles(files.videos, 'videos', id);
          updatedData.videos = [...(updatedData.videos || existingData.videos || []), ...newVideos];
        } catch (error) {
          console.error('Error uploading new videos:', error);
          return res.status(400).json({ error: 'Error uploading new videos. ' + error.message });
        }
      }

      if (files.brochureUrl) {
        try {
          if (existingData.brochureUrl) {
            await deleteFromFirebase(existingData.brochureUrl);
          }
          const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl', id);
          updatedData.brochureUrl = brochureUrl;
        } catch (error) {
          console.error('Error handling brochure:', error);
          return res.status(400).json({ error: 'Error handling brochure. ' + error.message });
        }
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

    res.status(200).json({
      message: 'Project updated successfully',
      data: project.toFirestore()
    });
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