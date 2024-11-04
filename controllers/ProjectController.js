const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

// Function to create a new project with associated files
exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;  // Get project data from the request body
    const files = req.files;       // Get uploaded files

    console.log("Starting to create project...");
    console.log("Received project data:", projectData);
    console.log("Files received:", files);

    // Create a Firestore document to store the project and get its unique ID
    const docRef = await db.collection(Project.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });
    console.log("Firestore document created with ID:", docRef.id);

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

    const errors = Project.validate(projectData);
    if (errors.length > 0) {
      console.log("Validation errors:", errors);
      await deleteMultipleFiles(projectData.images);
      await deleteMultipleFiles(projectData.videos);
      if (projectData.brochureUrl) await deleteFromFirebase(projectData.brochureUrl);
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

// Function to retrieve all projects from Firestore
exports.getAllProjects = async (req, res) => {
  try {
    const snapshot = await db.collection(Project.collectionName).get();
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Function to retrieve a specific project by its ID
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

// Function to update an existing project with new data and/or files
exports.updateProject = async (req, res) => {
  try {
    console.log('===== Update Project Start =====');
    console.log('Project ID:', req.params.id);
    console.log('Files received:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Body fields:', Object.keys(req.body));

    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;
    
    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const existingData = projectDoc.data();
    
    if (files || req.body.deleteImages || req.body.deleteVideos) {
      if (req.body.deleteImages) {
        try {
          const deleteImages = JSON.parse(req.body.deleteImages);
          const imagesToDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
          
          console.log("Deleting images:", imagesToDelete);
          await deleteMultipleFiles(imagesToDelete);
          updatedData.images = (existingData.images || [])
            .filter(url => !imagesToDelete.includes(url));
        } catch (error) {
          console.error('Error deleting images:', error);
          return res.status(400).json({ error: 'Error deleting images. ' + error.message });
        }
      } else {
        updatedData.images = existingData.images || [];
      }

      if (req.body.deleteVideos) {
        try {
          const deleteVideos = JSON.parse(req.body.deleteVideos);
          const videosToDelete = Array.isArray(deleteVideos) ? deleteVideos : [deleteVideos];
          
          console.log("Deleting videos:", videosToDelete);
          await deleteMultipleFiles(videosToDelete);
          updatedData.videos = (existingData.videos || [])
            .filter(url => !videosToDelete.includes(url));
        } catch (error) {
          console.error('Error deleting videos:', error);
          return res.status(400).json({ error: 'Error deleting videos. ' + error.message });
        }
      } else {
        updatedData.videos = existingData.videos || [];
      }

      if (files) {
        console.log('Uploading new files if provided...');
        if (files.images) {
          console.log('Attempting to upload new images...');
          try {
            const newImages = await uploadMultipleFiles(files.images, 'images', id);
            console.log('Successfully uploaded new images:', newImages);
            updatedData.images = [...(updatedData.images || []), ...newImages];
          } catch (error) {
            console.error('Error uploading new images:', error);
            return res.status(400).json({ error: 'Error uploading new images. ' + error.message });
          }
        }

        if (files.videos) {
          console.log('Attempting to upload new videos...');
          try {
            const newVideos = await uploadMultipleFiles(files.videos, 'videos', id);
            console.log('Successfully uploaded new videos:', newVideos);
            updatedData.videos = [...(updatedData.videos || []), ...newVideos];
          } catch (error) {
            console.error('Error uploading new videos:', error);
            return res.status(400).json({ error: 'Error uploading new videos. ' + error.message });
          }
        }

        if (files.brochureUrl) {
          console.log('Attempting to upload new brochure...');
          try {
            if (existingData.brochureUrl) {
              await deleteFromFirebase(existingData.brochureUrl);
            }
            const [brochureUrl] = await uploadMultipleFiles(files.brochureUrl, 'brochureUrl', id);
            console.log('Successfully uploaded new brochure:', brochureUrl);
            updatedData.brochureUrl = brochureUrl;
          } catch (error) {
            console.error('Error handling brochure:', error);
            return res.status(400).json({ error: 'Error handling brochure. ' + error.message });
          }
        }
      }
    }

    const errors = Project.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      console.log("Validation errors in update:", errors);
      return res.status(400).json({ errors });
    }

    updatedData.createdBy = existingData.createdBy;
    updatedData.createdOn = existingData.createdOn;
    updatedData.updatedBy = req.user.email;
    updatedData.updatedOn = new Date();

    const project = new Project({ ...existingData, ...updatedData });
    await db.collection(Project.collectionName).doc(id).update(project.toFirestore());
    console.log("Project updated successfully for ID:", id);

    res.status(200).json({
      message: 'Project updated successfully',
      data: project.toFirestore()
    });
  } catch (error) {
    console.error('Error updating project:', error);
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
};

// Function to delete a project and its associated files from Firestore
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Retrieve the project document
    const docRef = await db.collection(Project.collectionName).doc(id).get();
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const projectData = docRef.data();

    // Delete files associated with the project if they exist
    if (projectData.images) {
      await deleteMultipleFiles(projectData.images);
    }
    if (projectData.videos) {
      await deleteMultipleFiles(projectData.videos);
    }
    if (projectData.brochureUrl) {
      await deleteFromFirebase(projectData.brochureUrl);
    }

    // Finally, delete the project document
    await db.collection(Project.collectionName).doc(id).delete();

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: error.message });
  }
};
