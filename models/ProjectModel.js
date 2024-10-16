const admin = require('firebase-admin');

class Project {
  constructor(data) {
    this.developerId = data.developerId;
    this.name = data.name;
    this.googleMapLink = data.googleMapLink;
    this.whyThisProject = data.whyThisProject;
    this.description = data.description;
    this.launchDate = data.launchDate;
    this.images = data.images || [];
    this.videos = data.videos || [];
    this.reraStatus = data.reraStatus;
    this.reraNumber = data.reraNumber;
    this.status = data.status;
    this.pinCode = data.pinCode;
    this.city = data.city;
    this.sector = data.sector;
    this.state = data.state;
    this.category = data.category;
    this.timelineStart = data.timelineStart;
    this.timelineEnd = data.timelineEnd;
    this.phases = data.phases;
    this.amenities = data.amenities || [];
    this.localityHighlights = data.localityHighlights || [];
    this.brochureUrl = data.brochureUrl;
    this.priceStart = data.priceStart;
    this.priceEnd = data.priceEnd;
    this.paymentPlan = data.paymentPlan;
    this.unitSizes = data.unitSizes || [];
    this.createdBy = data.createdBy;
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp();
    this.updatedBy = data.updatedBy;
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp();
  }

  static collectionName = 'projects';

  static validate(data) {
    const errors = [];
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.name) errors.push('Project name is required');
    if (!this.isValidUrl(data.googleMapLink)) errors.push('Valid Google Map link is required');
    if (!data.whyThisProject || data.whyThisProject.length < 50) errors.push('Why this project must be at least 50 characters');
    if (!data.description || data.description.length < 50) errors.push('Project description must be at least 50 characters');
    if (!data.launchDate || isNaN(new Date(data.launchDate).getTime())) errors.push('Valid launch date is required');
    if (!['Approved', 'Not Approved'].includes(data.reraStatus)) errors.push('RERA status must be either Approved or Not Approved');
    if (data.reraStatus === 'Approved' && !data.reraNumber) errors.push('RERA number is required for approved projects');
    if (!['Active', 'Disable'].includes(data.status)) errors.push('Status must be either Active or Disable');
    if (!Number.isInteger(data.pinCode)) errors.push('Pin code must be an integer');
    if (!['Residential', 'Commercial'].includes(data.category)) errors.push('Category must be either Residential or Commercial');
    if (!data.timelineStart || isNaN(new Date(data.timelineStart).getTime())) errors.push('Valid timeline start date is required');
    if (!data.timelineEnd || isNaN(new Date(data.timelineEnd).getTime())) errors.push('Valid timeline end date is required');
    if (!Number.isInteger(data.phases)) errors.push('Phases must be an integer');
    if (!Number.isInteger(data.priceStart)) errors.push('Price start must be an integer');
    if (!Number.isInteger(data.priceEnd)) errors.push('Price end must be an integer');
    return errors;
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

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

module.exports = Project;