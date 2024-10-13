const { db } = require('../config/firebase');

// Create a new project in the Firestore database
exports.createProject = async (req, res) => {
  try {
    // Extract project details from the request body
    const {
      name,
      reraStatus,
      reraNumber,
      startingPrice,
      mediaLinks,
      status
    } = req.body;

    // Create a project object with the provided details and add timestamps
    const project = {
      name,
      reraStatus,         // Real Estate Regulatory Authority status of the project
      reraNumber,         // RERA registration number
      startingPrice,      // Starting price of the project
      mediaLinks,         // Links to project media (images/videos)
      status,             // Current status of the project (active/inactive)
      createdAt: new Date(), // Timestamp for when the project is created
      updatedAt: new Date()  // Timestamp for when the project was last updated
    };

    // Add the project to the 'projects' collection in Firestore
    const docRef = await db.collection('projects').add(project);
    
    // Return the newly created project data along with the generated document ID
    res.status(201).json({ id: docRef.id, ...project });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all projects from the Firestore database
exports.getAllProjects = async (req, res) => {
  try {
    // Get all documents from the 'projects' collection
    const snapshot = await db.collection('projects').get();
    
    // Map the Firestore documents into an array of projects, including their IDs
    const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Return the list of projects with a 200 status
    res.status(200).json(projects);
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve a specific project by ID from the Firestore database
exports.getProjectById = async (req, res) => {
  try {
    // Get the document reference for the project with the provided ID
    const docRef = await db.collection('projects').doc(req.params.id).get();
    
    // Check if the document exists
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Return the project data with a 200 status
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Update an existing project in the Firestore database
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params; // Get the project ID from the request parameters
    const updatedData = { ...req.body, updatedAt: new Date() }; // Add a new update timestamp
    
    // Update the project data in Firestore using the provided ID
    await db.collection('projects').doc(id).update(updatedData);
    
    // Return a success message with a 200 status
    res.status(200).json({ message: 'Project updated successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Delete a project by ID from the Firestore database
exports.deleteProject = async (req, res) => {
  try {
    // Delete the project document from Firestore using the provided ID
    await db.collection('projects').doc(req.params.id).delete();
    
    // Return a success message with a 200 status
    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};
