const admin = require('firebase-admin');

// Define the Developer class
class Developer {
  // Constructor method that initializes a developer instance with provided data
  constructor(data) {
    this.name = data.name;                       // Developer's name
    this.address = data.address;                 // Developer's address
    this.incorporationDate = data.incorporationDate; // Date of incorporation
    this.totalProjectsDelivered = data.totalProjectsDelivered;  // Number of projects delivered
    this.totalSqFtDelivered = data.totalSqFtDelivered; // Total square footage delivered by the developer
    this.reasonForChoosing = data.reasonForChoosing; // Reason why the developer was chosen
    this.websiteLink = data.websiteLink;         // Link to the developer's website
    this.status = data.status;                   // Current status (Active/Inactive)
    
    // Timestamps: Use server-generated timestamps for creation and updates
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
  }

  // Static property that defines the Firestore collection name for developers
  static collectionName = 'developers';

  // Static method to validate developer data before saving
  static validate(data) {
    const errors = [];

    // Validation checks for each required field and expected data types
    if (!data.name) errors.push('Developer name is required');
    if (!data.address) errors.push('Address is required');
    if (!data.incorporationDate) errors.push('Incorporation date is required');
    if (typeof data.totalProjectsDelivered !== 'number') errors.push('Total projects delivered must be a number');
    if (typeof data.totalSqFtDelivered !== 'number') errors.push('Total sq ft delivered must be a number');
    if (!data.websiteLink) errors.push('Website link is required');
    if (!['Active', 'Inactive'].includes(data.status)) errors.push('Status must be either Active or Inactive');

    return errors; // Return an array of validation errors
  }

  // Method to convert developer instance to Firestore-compatible format
  toFirestore() {
    return {
      name: this.name,
      address: this.address,
      incorporationDate: this.incorporationDate,
      totalProjectsDelivered: this.totalProjectsDelivered,
      totalSqFtDelivered: this.totalSqFtDelivered,
      reasonForChoosing: this.reasonForChoosing,
      websiteLink: this.websiteLink,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Developer;
