const { db } = require('../config/firebase');

// Create a new developer in the Firestore database
exports.createDeveloper = async (req, res) => {
  try {
    // Extract developer details from the request body
    const {
      name,
      address,
      incorporationDate,
      totalProjectsDelivered,
      totalSqFtDelivered,
      reasonForChoosing,
      websiteLink,
      status
    } = req.body;

    // Create a developer object with the provided details and add timestamps
    const developer = {
      name,
      address,
      incorporationDate,
      totalProjectsDelivered,
      totalSqFtDelivered,
      reasonForChoosing,
      websiteLink,
      status,
      createdAt: new Date(), // Timestamp when the developer is created
      updatedAt: new Date()  // Timestamp for last update
    };

    // Add the developer data to the 'developers' collection in Firestore
    const docRef = await db.collection('developers').add(developer);
    
    // Return the newly created developer data with the generated document ID
    res.status(201).json({ id: docRef.id, ...developer });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all developers from the Firestore database
exports.getAllDevelopers = async (req, res) => {
  try {
    // Get all documents from the 'developers' collection
    const snapshot = await db.collection('developers').get();
    
    // Map the Firestore documents into an array of developers, including their IDs
    const developers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Return the list of developers with a 200 status
    res.status(200).json(developers);
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve a specific developer by ID from the Firestore database
exports.getDeveloperById = async (req, res) => {
  try {
    // Get the document reference for the developer with the given ID
    const docRef = await db.collection('developers').doc(req.params.id).get();
    
    // Check if the document exists
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Developer not found' });
    }
    
    // Return the developer data with a 200 status
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Update an existing developer's details in the Firestore database
exports.updateDeveloper = async (req, res) => {
  try {
    const { id } = req.params; // Get the developer ID from the request parameters
    const updatedData = { ...req.body, updatedAt: new Date() }; // Add a new update timestamp
    
    // Update the developer data in Firestore using the provided ID
    await db.collection('developers').doc(id).update(updatedData);
    
    // Return a success message with a 200 status
    res.status(200).json({ message: 'Developer updated successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Delete a developer by ID from the Firestore database
exports.deleteDeveloper = async (req, res) => {
  try {
    // Delete the developer document from Firestore using the provided ID
    await db.collection('developers').doc(req.params.id).delete();
    
    // Return a success message with a 200 status
    res.status(200).json({ message: 'Developer deleted successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};
