const admin = require('firebase-admin');

// Define the Series class
class Series {
  // Constructor method that initializes a series instance with the provided data
  constructor(data) {
    this.towerId = data.towerId;                     // ID of the tower to which this series belongs
    this.seriesName = data.seriesName;                 // Name of the series
    this.isDuplicate = data.isDuplicate;               // Flag indicating if this series is a duplicate
    this.typology = data.typology;                     // Typology of the series (e.g., residential, commercial)
    this.bhkType = data.bhkType;                       // BHK type (e.g., 1BHK, 2BHK, etc.)
    this.addOns = data.addOns || [];                   // Array of additional features or add-ons
    this.bedrooms = data.bedrooms;                     // Number of bedrooms in the unit
    this.livingDining = data.livingDining;             // Details of the living and dining area
    this.bathrooms = data.bathrooms;                   // Number of bathrooms
    this.balconies = data.balconies;                   // Number of balconies
    this.seriesExitDirection = data.seriesExitDirection; // Exit direction for the series (e.g., East, West)
    this.unitCarpetArea = data.unitCarpetArea;       // Carpet area of the unit
    // Use Firestore server-generated timestamps for creation and updates if not provided
    this.createdAt = data.createdAt || admin.firestore.FieldValue.serverTimestamp();
    this.updatedAt = data.updatedAt || admin.firestore.FieldValue.serverTimestamp();
  }

  // Static property that defines the Firestore collection name for series
  static collectionName = 'series';

  // Static method to validate series data before saving
  static validate(data) {
    const errors = [];

    // Validation checks for required fields and proper data types
    if (!data.towerId) errors.push('Tower ID is required');
    if (!data.seriesName) errors.push('Series name is required');
    if (typeof data.isDuplicate !== 'boolean') errors.push('Is duplicate must be a boolean');
    if (!data.typology) errors.push('Typology is required');
    if (!data.bhkType) errors.push('BHK type is required');
    if (!Array.isArray(data.addOns)) errors.push('Add-ons must be an array');
    if (typeof data.bedrooms !== 'number') errors.push('Number of bedrooms must be a number');
    if (!data.livingDining) errors.push('Living/Dining details are required');
    if (typeof data.bathrooms !== 'number') errors.push('Number of bathrooms must be a number');
    if (typeof data.balconies !== 'number') errors.push('Number of balconies must be a number');
    if (!data.seriesExitDirection) errors.push('Series exit direction is required');
    if (typeof data.unitCarpetArea !== 'number') errors.push('Unit carpet area must be a number');

    return errors; // Return an array of validation errors
  }

  // Method to convert a series instance into a Firestore-compatible format
  toFirestore() {
    return {
      towerId: this.towerId,
      seriesName: this.seriesName,
      isDuplicate: this.isDuplicate,
      typology: this.typology,
      bhkType: this.bhkType,
      addOns: this.addOns,
      bedrooms: this.bedrooms,
      livingDining: this.livingDining,
      bathrooms: this.bathrooms,
      balconies: this.balconies,
      seriesExitDirection: this.seriesExitDirection,
      unitCarpetArea: this.unitCarpetArea,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Series;
