// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Define the Tower class to represent a building structure within a project
class Tower {
  // Constructor to initialize the Tower instance with provided data
  constructor(data) {
    this.developerId = data.developerId; // ID of the developer responsible for the tower
    this.projectId = data.projectId; // ID of the project this tower belongs to
    this.name = data.name; // Name of the tower
    this.totalFloors = parseInt(data.totalFloors, 10); // Total number of floors in the tower
    this.coreCount = parseInt(data.coreCount, 10); // Number of cores (elevator shafts) in the tower
    this.totalUnits = parseInt(data.totalUnits, 10); // Total number of residential/commercial units in the tower
    this.status = data.status; // Status of the tower (e.g., active or disabled)
    this.towerStatus = data.towerStatus; // Current construction status of the tower (e.g., under construction or completed)
    this.createdBy = data.createdBy || null; // User who created this entry
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp for when the entry was created
    this.updatedBy = data.updatedBy || null; // User who last updated this entry
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp for when the entry was last updated
  }

  // Static property to define the name of the Firestore collection for towers
  static collectionName = 'towers';

  // Static method to validate incoming data for a Tower instance
  static validate(data) {
    const errors = []; // Initialize an array to store validation errors

    // Validate required fields
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.name) errors.push('Tower name is required');
    
    // Parse and validate integer fields; using parseInt ensures we convert them correctly
    const totalFloors = parseInt(data.totalFloors, 10);
    const coreCount = parseInt(data.coreCount, 10);
    const totalUnits = parseInt(data.totalUnits, 10);
    
    // Check for integer validity
    if (isNaN(totalFloors)) errors.push('Total floors must be an integer');
    if (isNaN(coreCount)) errors.push('Core count must be an integer');
    if (isNaN(totalUnits)) errors.push('Total units must be an integer');

    // Validate status fields against allowed values
    if (!['Active', 'Disable'].includes(data.status)) {
      errors.push('Status must be either Active or Disable');
    }
    if (!['Under Construction', 'Completed'].includes(data.towerStatus)) {
      errors.push('Tower status must be either Under Construction or Completed');
    }

    // Return any validation errors found
    return errors;
  }

  // Method to convert the Tower instance into a Firestore-compatible object
  toFirestore() {
    return {
      developerId: this.developerId, // Developer ID
      projectId: this.projectId, // Project ID
      name: this.name, // Tower name
      totalFloors: this.totalFloors, // Total floors
      coreCount: this.coreCount, // Core count
      totalUnits: this.totalUnits, // Total units
      status: this.status, // Current status
      towerStatus: this.towerStatus, // Construction status
      createdBy: this.createdBy, // User who created the entry
      createdOn: this.createdOn, // Timestamp of creation
      updatedBy: this.updatedBy, // User who last updated the entry
      updatedOn: this.updatedOn // Timestamp of last update
    };
  }
}

// Export the Tower class for use in other modules
module.exports = Tower;
