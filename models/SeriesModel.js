const admin = require('firebase-admin');

class Series {
  constructor(data) {
    this.developerId = data.developerId;
    this.projectId = data.projectId;
    this.towerId = data.towerId;
    this.seriesName = data.seriesName;
    this.unitType = data.unitType;
    this.typology = data.typology;
    this.carpetArea = parseInt(data.carpetArea, 10);
    this.superArea = parseInt(data.superArea, 10);
    this.unitDimensions = parseInt(data.unitDimensions, 10);
    this.startingPrice = parseInt(data.startingPrice, 10);
    this.layoutPlanUrl = data.layoutPlanUrl;
    this.insideImagesUrls = data.insideImagesUrls || [];
    this.insideVideosUrls = data.insideVideosUrls || [];
    this.exitUnitDirection = data.exitUnitDirection;
    this.masterBedroomDirection = data.masterBedroomDirection;
    this.masterBedroomDimensions = parseInt(data.masterBedroomDimensions, 10);
    this.totalBedrooms = parseInt(data.totalBedrooms, 10);
    this.totalKitchens = parseInt(data.totalKitchens, 10);
    this.totalWashrooms = parseInt(data.totalWashrooms, 10);
    this.hasServantArea = data.hasServantArea === 'true' || data.hasServantArea === true;
    this.status = data.status;
    this.createdBy = data.createdBy || null;
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp();
    this.updatedBy = data.updatedBy || null;
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp();
  }

  static collectionName = 'series';

  static validate(data) {
    const errors = [];
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.towerId) errors.push('Tower ID is required');
    if (!data.seriesName) errors.push('Series name is required');
    if (!['Residential', 'Commercial'].includes(data.unitType)) errors.push('Unit type must be either Residential or Commercial');
    if (!data.typology) errors.push('Typology is required');
    const carpetArea = parseInt(data.carpetArea, 10);
    const superArea = parseInt(data.superArea, 10);
    const unitDimensions = parseInt(data.unitDimensions, 10);
    const startingPrice = parseInt(data.startingPrice, 10);
    const masterBedroomDimensions = parseInt(data.masterBedroomDimensions, 10);
    const totalBedrooms = parseInt(data.totalBedrooms, 10);
    const totalKitchens = parseInt(data.totalKitchens, 10);
    const totalWashrooms = parseInt(data.totalWashrooms, 10);
    if (isNaN(carpetArea)) errors.push('Carpet area must be an integer');
    if (isNaN(superArea)) errors.push('Super area must be an integer');
    if (isNaN(unitDimensions)) errors.push('Unit dimensions must be an integer');
    if (isNaN(startingPrice)) errors.push('Starting price must be an integer');
    if (!this.isValidPdfFormat(data.layoutPlanUrl)) errors.push('Layout plan must be a PDF file');
    if (!Array.isArray(data.insideImagesUrls)) errors.push('Inside images must be an array');
    if (!Array.isArray(data.insideVideosUrls)) errors.push('Inside videos must be an array');
    if (!data.exitUnitDirection) errors.push('Exit unit direction is required');
    if (!data.masterBedroomDirection) errors.push('Master bedroom direction is required');
    if (isNaN(masterBedroomDimensions)) errors.push('Master bedroom dimensions must be an integer');
    if (isNaN(totalBedrooms)) errors.push('Total bedrooms must be an integer');
    if (isNaN(totalKitchens)) errors.push('Total kitchens must be an integer');
    if (isNaN(totalWashrooms)) errors.push('Total washrooms must be an integer');
    if (typeof data.hasServantArea !== 'boolean' && data.hasServantArea !== 'true' && data.hasServantArea !== 'false') {
      errors.push('Servant area must be a boolean');
    }
    if (!['Active', 'Disable'].includes(data.status)) errors.push('Status must be either Active or Disable');
    return errors;
  }

  static isValidPdfFormat(filename) {
    return /\.pdf$/i.test(filename);
  }

  toFirestore() {
    return {
      developerId: this.developerId,
      projectId: this.projectId,
      towerId: this.towerId,
      seriesName: this.seriesName,
      unitType: this.unitType,
      typology: this.typology,
      carpetArea: this.carpetArea,
      superArea: this.superArea,
      unitDimensions: this.unitDimensions,
      startingPrice: this.startingPrice,
      layoutPlanUrl: this.layoutPlanUrl,
      insideImagesUrls: this.insideImagesUrls,
      insideVideosUrls: this.insideVideosUrls,
      exitUnitDirection: this.exitUnitDirection,
      masterBedroomDirection: this.masterBedroomDirection,
      masterBedroomDimensions: this.masterBedroomDimensions,
      totalBedrooms: this.totalBedrooms,
      totalKitchens: this.totalKitchens,
      totalWashrooms: this.totalWashrooms,
      hasServantArea: this.hasServantArea,
      status: this.status,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };
  }
}

module.exports = Series;