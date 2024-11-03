const admin = require('firebase-admin');

class Project {
  // Constructor initializes the project data, setting default values where applicable.
  constructor(data) {
    this.developerId = data.developerId; // The ID of the developer associated with this project.
    this.name = data.name; // The name of the project.
    this.googleMapLink = data.googleMapLink; // URL link to the project's location on Google Maps.
    this.whyThisProject = data.whyThisProject; // Justification for this project's importance.
    this.description = data.description; // A detailed description of the project.
    this.launchDate = data.launchDate; // The planned launch date of the project.
    this.images = data.images || []; // Array of image URLs associated with the project.
    this.videos = data.videos || []; // Array of video URLs associated with the project.
    this.reraStatus = data.reraStatus; // RERA (Real Estate Regulatory Authority) status of the project.
    this.reraNumber = data.reraNumber; // RERA registration number, required if the project is approved.
    this.status = data.status; // Current status of the project (e.g., Active or Disabled).
    this.pinCode = parseInt(data.pinCode, 10); // The postal code of the project's location.
    this.city = data.city; // The city where the project is located.
    this.sector = data.sector; // The sector of the project, if applicable.
    this.state = data.state; // The state where the project is located.
    this.category = data.category; // Category of the project (Residential or Commercial).
    this.timelineStart = data.timelineStart; // The start date of the project's timeline.
    this.timelineEnd = data.timelineEnd; // The end date of the project's timeline.
    this.phases = parseInt(data.phases, 10); // The number of phases the project will undergo.
    this.amenities = data.amenities || []; // Array of amenities available in the project.
    this.localityHighlights = data.localityHighlights || []; // Highlights of the local area surrounding the project.
    this.brochureUrl = data.brochureUrl; // URL to the project's brochure for additional information.
    this.priceStart = parseInt(data.priceStart, 10); // Starting price for the units in the project.
    this.priceEnd = parseInt(data.priceEnd, 10); // Ending price for the units in the project.
    this.paymentPlan = data.paymentPlan; // Payment plan options for potential buyers.
    this.unitSizes = data.unitSizes || []; // Array of sizes for different units in the project.
    this.createdBy = data.createdBy || null; // The user who created this project entry.
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp when the project was created.
    this.updatedBy = data.updatedBy || null; // The user who last updated this project entry.
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp(); // Timestamp when the project was last updated.
  }

  // Static property to hold the name of the Firestore collection.
  static collectionName = 'projects';

  // Method to validate the project data before saving to the database.
  static validate(data) {
    const errors = []; // Array to hold validation error messages.

    // Validating required fields and their formats.
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.name) errors.push('Project name is required');
    if (!this.isValidUrl(data.googleMapLink)) errors.push('Valid Google Map link is required');
    if (!data.whyThisProject || data.whyThisProject.length < 50) errors.push('Why this project must be at least 50 characters');
    if (!data.description || data.description.length < 50) errors.push('Project description must be at least 50 characters');
    if (!data.launchDate || isNaN(new Date(data.launchDate).getTime())) errors.push('Valid launch date is required');

    // images and videos.
    if (!Array.isArray(data.images)) errors.push('images must be an array');
    if (!Array.isArray(data.videos)) errors.push('videos must be an array');
    
    // Validating RERA status and required fields based on status.
    if (!['Approved', 'Not Approved'].includes(data.reraStatus)) errors.push('RERA status must be either Approved or Not Approved');
    if (data.reraStatus === 'Approved' && !data.reraNumber) errors.push('RERA number is required for approved projects');
    if (!['Active', 'Disable'].includes(data.status)) errors.push('Status must be either Active or Disable');
    
    // Validating numeric fields and their formats.
    const pinCode = parseInt(data.pinCode, 10);
    const phases = parseInt(data.phases, 10);
    const priceStart = parseInt(data.priceStart, 10);
    const priceEnd = parseInt(data.priceEnd, 10);

    if (isNaN(pinCode)) errors.push('Pin code must be an integer');
    if (!['Residential', 'Commercial'].includes(data.category)) errors.push('Category must be either Residential or Commercial');
    if (!data.timelineStart || isNaN(new Date(data.timelineStart).getTime())) errors.push('Valid timeline start date is required');
    if (!data.timelineEnd || isNaN(new Date(data.timelineEnd).getTime())) errors.push('Valid timeline end date is required');
    if (isNaN(phases)) errors.push('Phases must be an integer');

    // Validating brochure URL if provided.
    if (data.brochureUrl && !this.isValidUrl(data.brochureUrl)) {
      errors.push('Invalid brochure URL format');
    }
    
    // Validating price fields.
    if (isNaN(priceStart)) errors.push('Price start must be an integer');
    if (isNaN(priceEnd)) errors.push('Price end must be an integer');

    return errors; // Return any validation errors found.
  }

  // Helper method to validate if a string is a valid URL.
  static isValidUrl(string) {
    try {
      new URL(string); // Try creating a URL object; if it fails, it's invalid.
      return true;
    } catch (_) {
      return false;
    }
  }

  // Method to convert project data to a Firestore-compatible format.
  toFirestore() {
    return {
      developerId: this.developerId,
      name: this.name,
      googleMapLink: this.googleMapLink,
      whyThisProject: this.whyThisProject,
      description: this.description,
      launchDate: this.launchDate,
      images: this.images,
      videos: this.videos,
      reraStatus: this.reraStatus,
      reraNumber: this.reraNumber,
      status: this.status,
      pinCode: this.pinCode,
      city: this.city,
      sector: this.sector,
      state: this.state,
      category: this.category,
      timelineStart: this.timelineStart,
      timelineEnd: this.timelineEnd,
      phases: this.phases,
      amenities: this.amenities,
      localityHighlights: this.localityHighlights,
      brochureUrl: this.brochureUrl,
      priceStart: this.priceStart,
      priceEnd: this.priceEnd,
      paymentPlan: this.paymentPlan,
      unitSizes: this.unitSizes,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };
  }
}

module.exports = Project; // Export the Project class for use in other modules.
