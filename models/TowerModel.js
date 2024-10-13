const admin = require('firebase-admin');

// Define the Tower class
class Tower {
  // Constructor method that initializes a tower instance with the provided data
  constructor(data) {
    this.projectId = data.projectId;                   // ID of the project to which this tower belongs
    this.developerId = data.developerId;               // ID of the developer managing this tower
    this.towerNumber = data.towerNumber;               // Unique number assigned to the tower
    this.towerName = data.towerName;                   // Name of the tower
    this.towerPhase = data.towerPhase;                 // Phase of the tower (e.g., construction phase)
    this.developerPhase = data.developerPhase;         // Developer's phase for this tower
    this.phaseReraNumber = data.phaseReraNumber;       // RERA number for the tower phase
    this.deliveryTimeline = data.deliveryTimeline;     // Expected delivery timeline for the tower
    this.currentStatus = data.currentStatus;           // Current status of the tower (e.g., under construction, completed)
    this.isDuplicate = data.isDuplicate;               // Flag indicating if this tower is a duplicate
    this.totalFloors = data.totalFloors;               // Total number of floors in the tower
    this.towerCore = data.towerCore;                   // Number of cores in the tower
    this.totalApartments = data.totalApartments;       // Total number of apartments in the tower
    this.basementParkingLevels = data.basementParkingLevels; // Number of basement parking levels
    this.hasStiltParking = data.hasStiltParking;       // Flag indicating if stilt parking is available
    this.lobby = data.lobby;                           // Details of the lobby area
    this.hasTerrace = data.hasTerrace;                 // Flag indicating if a terrace is available
    this.refugeArea = data.refugeArea;                 // Details of the refuge area in the tower
    this.exitStairs = data.exitStairs;                 // Number of exit stairs in the tower
    this.lifts = data.lifts;                           // Number of lifts available in the tower
    // Use Firestore server-generated timestamps for creation and updates if not provided
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
  }

  // Static property that defines the Firestore collection name for towers
  static collectionName = 'towers';

  // Static method to validate tower data before saving
  static validate(data) {
    const errors = [];

    // Validation checks for required fields and proper data types
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.developerId) errors.push('Developer ID is required');
    if (typeof data.towerNumber !== 'number') errors.push('Tower number must be a number');
    if (!data.towerName) errors.push('Tower name is required');
    if (!data.deliveryTimeline) errors.push('Delivery timeline is required');
    if (!data.currentStatus) errors.push('Current status is required');
    if (typeof data.totalFloors !== 'number') errors.push('Total floors must be a number');
    if (typeof data.towerCore !== 'number') errors.push('Tower core must be a number');
    if (typeof data.totalApartments !== 'number') errors.push('Total apartments must be a number');
    if (typeof data.basementParkingLevels !== 'number') errors.push('Basement parking levels must be a number');
    if (typeof data.hasStiltParking !== 'boolean') errors.push('Has stilt parking must be a boolean');
    if (typeof data.hasTerrace !== 'boolean') errors.push('Has terrace must be a boolean');
    if (typeof data.exitStairs !== 'number') errors.push('Exit stairs must be a number');
    if (typeof data.lifts !== 'number') errors.push('Lifts must be a number');

    return errors; // Return an array of validation errors
  }

  // Method to convert a tower instance into a Firestore-compatible format
  toFirestore() {
    return {
      projectId: this.projectId,
      developerId: this.developerId,
      towerNumber: this.towerNumber,
      towerName: this.towerName,
      towerPhase: this.towerPhase,
      developerPhase: this.developerPhase,
      phaseReraNumber: this.phaseReraNumber,
      deliveryTimeline: this.deliveryTimeline,
      currentStatus: this.currentStatus,
      isDuplicate: this.isDuplicate,
      totalFloors: this.totalFloors,
      towerCore: this.towerCore,
      totalApartments: this.totalApartments,
      basementParkingLevels: this.basementParkingLevels,
      hasStiltParking: this.hasStiltParking,
      lobby: this.lobby,
      hasTerrace: this.hasTerrace,
      refugeArea: this.refugeArea,
      exitStairs: this.exitStairs,
      lifts: this.lifts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Tower;
