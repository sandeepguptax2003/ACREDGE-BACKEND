const admin = require('firebase-admin');
// Define the Project class
class Project {
  // Constructor method that initializes a project instance with the provided data
  constructor(data) {
    this.name = data.name;                     // Project name
    this.reraStatus = data.reraStatus;         // RERA status (Approved/Not Approved)
    this.reraNumber = data.reraNumber;         // RERA number (required if RERA status is Approved)
    this.startingPrice = data.startingPrice;   // Starting price of the project
    this.mediaLinks = data.mediaLinks || [];   // Array of media links (optional)
    this.status = data.status;                 // Current status (Active/Inactive)

    // Use Firestore server-generated timestamps for creation and updates if not provided
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
  }

  // Static property that defines the Firestore collection name for projects
  static collectionName = 'projects';

  // Static method to validate project data before saving
  static validate(data) {
    const errors = [];

    // Validation checks for required fields and proper data types
    if (!data.name) errors.push('Project name is required');
    if (!['Approved', 'Not Approved'].includes(data.reraStatus)) errors.push('RERA status must be either Approved or Not Approved');
    if (data.reraStatus === 'Approved' && !data.reraNumber) errors.push('RERA number is required for approved projects');
    if (typeof data.startingPrice !== 'number') errors.push('Starting price must be a number');
    if (!Array.isArray(data.mediaLinks)) errors.push('Media links must be an array');
    if (!['Active', 'Inactive'].includes(data.status)) errors.push('Status must be either Active or Inactive');

    return errors; // Return an array of validation errors
  }

  // Method to convert a project instance into a Firestore-compatible format
  toFirestore() {
    return {
      name: this.name,
      reraStatus: this.reraStatus,
      reraNumber: this.reraNumber,
      startingPrice: this.startingPrice,
      mediaLinks: this.mediaLinks,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Project;
