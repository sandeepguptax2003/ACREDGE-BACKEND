const { db } = require('../config/firebase');

// Create a new series in the Firestore database
exports.createSeries = async (req, res) => {
  try {
    // Extract series details from the request body
    const {
      towerId,             // The ID of the tower this series belongs to
      seriesName,          // Name of the series
      isDuplicate,         // Flag indicating whether the series is a duplicate
      typology,            // Typology of the series (layout type, e.g., studio, 2BHK, etc.)
      bhkType,             // BHK type (e.g., 1BHK, 2BHK)
      addOns,              // Additional features or addons in the series
      bedrooms,            // Number of bedrooms in the series
      livingDining,        // Living/Dining area specification
      bathrooms,           // Number of bathrooms
      balconies,           // Number of balconies
      seriesExitDirection, // Direction in which the series exits
      unitCarpetArea       // Carpet area of the unit in square feet/meters
    } = req.body;

    // Create a series object with the extracted data and timestamps
    const series = {
      towerId,
      seriesName,
      isDuplicate,
      typology,
      bhkType,
      addOns,
      bedrooms,
      livingDining,
      bathrooms,
      balconies,
      seriesExitDirection,
      unitCarpetArea,
      createdAt: new Date(),  // Timestamp for when the series is created
      updatedAt: new Date()   // Timestamp for when the series was last updated
    };

    // Add the series to the 'series' collection in Firestore
    const docRef = await db.collection('series').add(series);
    
    // Return the newly created series data along with the generated document ID
    res.status(201).json({ id: docRef.id, ...series });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve all series from the Firestore database
exports.getAllSeries = async (req, res) => {
  try {
    // Get all documents from the 'series' collection
    const snapshot = await db.collection('series').get();
    
    // Map the Firestore documents into an array of series, including their IDs
    const seriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Return the list of series with a 200 status
    res.status(200).json(seriesList);
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Retrieve a specific series by ID from the Firestore database
exports.getSeriesById = async (req, res) => {
  try {
    // Get the document reference for the series with the provided ID
    const docRef = await db.collection('series').doc(req.params.id).get();
    
    // Check if the document exists
    if (!docRef.exists) {
      return res.status(404).json({ message: 'Series not found' });
    }
    
    // Return the series data with a 200 status
    res.status(200).json({ id: docRef.id, ...docRef.data() });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Update an existing series in the Firestore database
exports.updateSeries = async (req, res) => {
  try {
    const { id } = req.params; // Get the series ID from the request parameters
    const updatedData = { ...req.body, updatedAt: new Date() }; // Add a new update timestamp
    
    // Update the series data in Firestore using the provided ID
    await db.collection('series').doc(id).update(updatedData);
    
    // Return a success message with a 200 status
    res.status(200).json({ message: 'Series updated successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};

// Delete a series by ID from the Firestore database
exports.deleteSeries = async (req, res) => {
  try {
    // Delete the series document from Firestore using the provided ID
    await db.collection('series').doc(req.params.id).delete();
    
    // Return a success message with a 200 status
    res.status(200).json({ message: 'Series deleted successfully' });
  } catch (error) {
    // Handle errors and return a 500 status with the error message
    res.status(500).json({ error: error.message });
  }
};
