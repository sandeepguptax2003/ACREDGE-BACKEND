const { db } = require('../config/firebase');

// Create a new tower
exports.createTower = async (req, res) => {
  try {
    // Destructure tower details from the request body
    const {
      projectId,              // ID of the project the tower belongs to
      developerId,            // ID of the developer responsible for the tower
      towerNumber,            // Tower number
      towerName,              // Name of the tower
      towerPhase,             // The construction phase of the tower
      developerPhase,         // Developer's phase of the tower
      phaseReraNumber,        // RERA (Real Estate Regulatory Authority) number of the phase
      deliveryTimeline,       // Estimated delivery timeline of the tower
      currentStatus,          // Current construction or sales status of the tower
      isDuplicate,            // Boolean flag indicating if this tower is a duplicate
      totalFloors,            // Total number of floors in the tower
      towerCore,              // Core structure details of the tower
      totalApartments,        // Total number of apartments in the tower
      basementParkingLevels,  // Number of basement parking levels
      hasStiltParking,        // Boolean flag indicating if the tower has stilt parking
      lobby,                  // Lobby details for the tower
      hasTerrace,             // Boolean flag indicating if the tower has a terrace
      refugeArea,             // Refuge area details (safety space in the tower)
      exitStairs,             // Number or details of exit stairs in the tower
      lifts                   // Number or details of lifts (elevators) in the tower
    } = req.body;

    // Create a tower object with the above data and timestamps
    const tower = {
      projectId,
      developerId,
      towerNumber,
      towerName,
      towerPhase,
      developerPhase,
      phaseReraNumber,
      deliveryTimeline,
      currentStatus,
      isDuplicate,
      totalFloors,
      towerCore,
      totalApartments,
      basementParkingLevels,
      hasStiltParking,
      lobby,
      hasTerrace,
      refugeArea,
      exitStairs,
      lifts,
      createdAt: new Date(),  // Timestamp when the tower was created
      updatedAt: new Date()   // Timestamp when the tower was last updated
    };

    // Add the tower data to the 'towers' collection in Firestore
    const docRef = await db.collection('towers').add(tower);
    
    // Respond with the created tower data along with the generated document ID
    res.status(201).json({ id: docRef.id, ...tower });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all towers
exports.getAllTowers = async (req, res) => {
  try {
    // Fetch all documents from the 'towers' collection
    const snapshot = await db.collection('towers').get();
    
    // Map each document to include the document ID along with the tower data
    const towers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Respond with the list of towers and a 200 status
    res.status(200).json(towers);
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve a single tower by ID
exports.getTowerById = async (req, res) => {
  try {
    // Fetch the document by the given ID from the request parameters
    const docRef = await db.collection('towers').doc(req.params.id).get();
    
    // Check if the tower exists, if not return a 404 status
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Tower not found' });
    }
    
    // Respond with the tower data and a 200 status
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Update an existing tower
exports.updateTower = async (req, res) => {
  try {
    const { id } = req.params; // Get the tower ID from the request parameters
    const updatedData = { ...req.body, updatedAt: new Date() }; // Add an updated timestamp

    // Update the tower document with the new data in Firestore
    await db.collection('towers').doc(id).update(updatedData);

    // Respond with a success message and a 200 status
    res.status(200).json({ message: 'Tower updated successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Delete a tower by ID
exports.deleteTower = async (req, res) => {
  try {
    // Delete the document from the 'towers' collection by the given ID
    await db.collection('towers').doc(req.params.id).delete();
    
    // Respond with a success message and a 200 status
    res.status(200).json({ message: 'Tower deleted successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};
