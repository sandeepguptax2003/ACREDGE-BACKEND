const Project = require('../models/ProjectModel');
const { db } = require('../config/firebase');
const { uploadMultipleFiles, deleteMultipleFiles, deleteFromFirebase } = require('../utils/FilesUpload');

// Function to create a new project with associated files
exports.createProject = async (req, res) => {
  try {
    const projectData = req.body;  // Get project data from the request body
    const files = req.files;       // Get uploaded files

    // Create a Firestore document to store the project and get its unique ID
    const docRef = await db.collection(Project.collectionName).add({
      createdBy: req.user.email,
      createdOn: new Date(),
    });

    console.log("Received project data:", projectData);
    console.log("Files received:", files);

    // Upload images if provided, save URLs in projectData
    if (files.images && Array.isArray(files.images)) {
      try {
        console.log("Uploading images...");
        projectData.images = await uploadMultipleFiles(files.images, 'images', docRef.id);
        console.log("Uploaded images URLs:", projectData.images);
      } catch (error) {
        console.error('Error uploading images:', error);
        await docRef.delete();  // Delete document if there is an error
        return res.status(400).json({ error: 'Error uploading images. ' + error.message });
      }
    }

    // Upload videos if provided, save URLs in projectData
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

    // Upload brochure if provided and store its URL
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

    // Validate project data based on model constraints
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

    // Save final project data in Firestore document
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
    const { id } = req.params;
    const updatedData = req.body;
    const files = req.files;
    
    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const existingData = projectDoc.data();
    
    // Handle file updates
    if (files || req.body.deleteImages || req.body.deleteVideos) {
      // Handle image deletion first
      if (req.body.deleteImages) {
        try {
          const deleteImages = JSON.parse(req.body.deleteImages);
          // Ensure deleteImages is an array
          const imagesToDelete = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
          
          // Delete files from storage
          await deleteMultipleFiles(imagesToDelete);
          
          // Update the images array by filtering out deleted images
          updatedData.images = (existingData.images || [])
            .filter(url => !imagesToDelete.includes(url));
        } catch (error) {
          console.error('Error deleting images:', error);
          return res.status(400).json({ error: 'Error deleting images. ' + error.message });
        }
      } else {
        // If no images are being deleted, preserve existing images
        updatedData.images = existingData.images || [];
      }

      // Handle video deletion
      if (req.body.deleteVideos) {
        try {
          const deleteVideos = JSON.parse(req.body.deleteVideos);
          // Ensure deleteVideos is an array
          const videosToDelete = Array.isArray(deleteVideos) ? deleteVideos : [deleteVideos];
          
          // Delete files from storage
          await deleteMultipleFiles(videosToDelete);
          
          // Update the videos array by filtering out deleted videos
          updatedData.videos = (existingData.videos || [])
            .filter(url => !videosToDelete.includes(url));
        } catch (error) {
          console.error('Error deleting videos:', error);
          return res.status(400).json({ error: 'Error deleting videos. ' + error.message });
        }
      } else {
        // If no videos are being deleted, preserve existing videos
        updatedData.videos = existingData.videos || [];
      }

      // Handle new file uploads
      if (files) {
        // Upload new images if any
        if (files.images) {
          try {
            const newImages = await uploadMultipleFiles(files.images, 'images', id);
            updatedData.images = [...(updatedData.images || []), ...newImages];
          } catch (error) {
            console.error('Error uploading new images:', error);
            return res.status(400).json({ error: 'Error uploading new images. ' + error.message });
          }
        }

        // Upload new videos if any
        if (files.videos) {
          try {
            const newVideos = await uploadMultipleFiles(files.videos, 'videos', id);
            updatedData.videos = [...(updatedData.videos || []), ...newVideos];
          } catch (error) {
            console.error('Error uploading new videos:', error);
            return res.status(400).json({ error: 'Error uploading new videos. ' + error.message });
          }
        }

        // Handle brochure update
        if (files.brochureUrl) {
          try {
            // Delete existing brochure if it exists
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
    }

    // Rest of your existing validation and update logic
    const errors = Project.validate({ ...existingData, ...updatedData });
    if (errors.length > 0) {
      return res.status(400).json({ errors });
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
    console.error('Error updating project:', error);
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
