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
// Function to update an existing project with new data and/or files
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body }; // Create a copy to avoid modifying req.body directly
    const files = req.files || {};

    // Get existing project
    const projectDoc = await db.collection(Project.collectionName).doc(id).get();
    if (!projectDoc.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const existingData = projectDoc.data();

    // Initialize arrays for tracking successful uploads
    let newlyUploadedFiles = [];

    try {
      // Handle file updates
      if (Object.keys(files).length > 0) {
        // Handle images
        if (files.images) {
          // Handle image deletions first
          if (updatedData.deleteImages) {
            const deleteImages = Array.isArray(updatedData.deleteImages) 
              ? updatedData.deleteImages 
              : JSON.parse(updatedData.deleteImages);
            
            if (deleteImages && deleteImages.length > 0) {
              await deleteMultipleFiles(deleteImages);
              updatedData.images = (existingData.images || [])
                .filter(url => !deleteImages.includes(url));
            }
            // Remove deleteImages from updatedData as it's not part of the model
            delete updatedData.deleteImages;
          } else {
            // If no deletions, maintain existing images
            updatedData.images = existingData.images || [];
          }

          // Upload new images
          const newImages = await uploadMultipleFiles(
            Array.isArray(files.images) ? files.images : [files.images],
            'images',
            id
          );
          newlyUploadedFiles = [...newlyUploadedFiles, ...newImages];
          updatedData.images = [...(updatedData.images || []), ...newImages];
        }

        // Handle videos
        if (files.videos) {
          // Handle video deletions first
          if (updatedData.deleteVideos) {
            const deleteVideos = Array.isArray(updatedData.deleteVideos)
              ? updatedData.deleteVideos
              : JSON.parse(updatedData.deleteVideos);
            
            if (deleteVideos && deleteVideos.length > 0) {
              await deleteMultipleFiles(deleteVideos);
              updatedData.videos = (existingData.videos || [])
                .filter(url => !deleteVideos.includes(url));
            }
            // Remove deleteVideos from updatedData as it's not part of the model
            delete updatedData.deleteVideos;
          } else {
            // If no deletions, maintain existing videos
            updatedData.videos = existingData.videos || [];
          }

          // Upload new videos
          const newVideos = await uploadMultipleFiles(
            Array.isArray(files.videos) ? files.videos : [files.videos],
            'videos',
            id
          );
          newlyUploadedFiles = [...newlyUploadedFiles, ...newVideos];
          updatedData.videos = [...(updatedData.videos || []), ...newVideos];
        }

        // Handle brochure
        if (files.brochureUrl) {
          // Delete existing brochure if it exists
          if (existingData.brochureUrl) {
            await deleteFromFirebase(existingData.brochureUrl);
          }
          
          const [brochureUrl] = await uploadMultipleFiles(
            Array.isArray(files.brochureUrl) ? files.brochureUrl : [files.brochureUrl],
            'brochureUrl',
            id
          );
          newlyUploadedFiles.push(brochureUrl);
          updatedData.brochureUrl = brochureUrl;
        }
      }

      // Validate updated data
      const mergedData = {
        ...existingData,
        ...updatedData,
      };
      
      const errors = Project.validate(mergedData);
      if (errors.length > 0) {
        // If validation fails, clean up any newly uploaded files
        if (newlyUploadedFiles.length > 0) {
          await deleteMultipleFiles(newlyUploadedFiles);
        }
        return res.status(400).json({ errors });
      }

      // Add metadata
      if (!req.user?.email) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const finalData = {
        ...mergedData,
        createdBy: existingData.createdBy,
        createdOn: existingData.createdOn,
        updatedBy: req.user.email,
        updatedOn: new Date(),
      };

      // Create Project instance and update in Firestore
      const project = new Project(finalData);
      await db.collection(Project.collectionName).doc(id).update(project.toFirestore());

      res.status(200).json({
        message: 'Project updated successfully',
        data: project.toFirestore()
      });
      
    } catch (error) {
      // If any error occurs during file handling, clean up newly uploaded files
      if (newlyUploadedFiles.length > 0) {
        await deleteMultipleFiles(newlyUploadedFiles);
      }
      throw error; // Re-throw to be caught by outer try-catch
    }
    
  } catch (error) {
    console.error('Error in Update Project:', error);
    res.status(500).json({ 
      error: 'Failed to update project',
      details: error.message 
    });
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
