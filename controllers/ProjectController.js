const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;
    const files = req.files;

    console.log("Received project data:", projectData);
    console.log("Files received:", files);

    if (files.images && Array.isArray(files.images)) {
      try {
        console.log("Uploading images...");
        projectData.images = await uploadMultipleFiles(files.images, 'images');
        console.log("Uploaded images URLs:", projectData.images);
      } catch (error) {
        console.error('Error uploading images:', error);
        return res.status(400).json({ error: 'Error uploading images. ' + error.message });
      }
    }

    if (files.videos && Array.isArray(files.videos)) {
      try {
        console.log("Uploading videos...");
        projectData.videos = await uploadMultipleFiles(files.videos, 'videos');
        console.log("Uploaded videos URLs:", projectData.videos);
      } catch (error) {
        console.error('Error uploading videos:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        return res.status(400).json({ error: 'Error uploading videos. ' + error.message });
      }
    }

    if (files.brochureUrl) {
      try {
        console.log("Uploading brochure...");
        const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl');
        projectData.brochureUrl = brochureUrl;
        console.log("Brochure URL:", brochureUrl);
      } catch (error) {
        console.error('Error uploading brochure:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        return res.status(400).json({ error: 'Error uploading brochure. ' + error.message });
      }
    }

    if (files.layoutPlanUrl) {
      try {
        console.log("Uploading layout plan...");
        const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl');
        projectData.layoutPlanUrl = layoutPlanUrl;
        console.log("Layout plan URL:", layoutPlanUrl);
      } catch (error) {
        console.error('Error uploading layout plan:', error);
        if (projectData.images) await deleteMultipleFiles(projectData.images);
        if (projectData.videos) await deleteMultipleFiles(projectData.videos);
        if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
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
      return res.status(400).json({ errors });
    }

    projectData.createdBy = req.user.email;
    projectData.createdOn = new Date();

    const project = new Project(projectData);
    const docRef = await db.collection(Project.collectionName).add(project.toFirestore());
    
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

    // Get existing project
    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const existingData = projectDoc.data();

    // Handle file updates
    if (files) {
      // Handle images
      if (files.images) {
        // Delete existing images if specified
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

        // Upload new images
        try {
          const newImages = await uploadMultipleFiles(files.images, 'images');
          updatedData.images = [...(updatedData.images || existingData.images || []), ...newImages];
        } catch (error) {
          console.error('Error uploading new images:', error);
          return res.status(400).json({ error: 'Error uploading new images. ' + error.message });
        }
      }

      // Handle videos
      if (files.videos) {
        // Delete existing videos if specified
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

        // Upload new videos
        try {
          const newVideos = await uploadMultipleFiles(files.videos, 'videos');
          updatedData.videos = [...(updatedData.videos || existingData.videos || []), ...newVideos];
        } catch (error) {
          console.error('Error uploading new videos:', error);
          return res.status(400).json({ error: 'Error uploading new videos. ' + error.message });
        }
      }

      // Handle brochure
      if (files.brochureUrl) {
        try {
          // Delete existing brochure if it exists
          if (existingData.brochureUrl) {
            await deleteFromFirebase(existingData.brochureUrl);
          }
          const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl');
          updatedData.brochureUrl = brochureUrl;
        } catch (error) {
          console.error('Error handling brochure:', error);
          return res.status(400).json({ error: 'Error handling brochure. ' + error.message });
        }
      }

      // Handle layout plan
      if (files.layoutPlanUrl) {
        try {
          // Delete existing layout plan if it exists
          if (existingData.layoutPlanUrl) {
            await deleteFromFirebase(existingData.layoutPlanUrl);
          }
          const [layoutPlanUrl] = await uploadMultipleFiles(files.layoutPlanUrl, 'layoutPlanUrl');
          updatedData.layoutPlanUrl = layoutPlanUrl;
        } catch (error) {
          console.error('Error handling layout plan:', error);
          return res.status(400).json({ error: 'Error handling layout plan. ' + error.message });
        }
      }
    }

    // Validate updated data
    const errors = Project.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // Add metadata
    if (!req.user || !req.user.email) {
      return res.status(401).json({ message: "Authentication required" });
    }
    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    // Update project
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