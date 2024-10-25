const admin = require('firebase-admin');

class Tower {
  constructor(data) {
    this.developerId = data.developerId;
    this.projectId = data.projectId;
    this.name = data.name;
    this.totalFloors = parseInt(data.totalFloors, 10);
    this.coreCount = parseInt(data.coreCount, 10);
    this.totalUnits = parseInt(data.totalUnits, 10);
    this.status = data.status;
    this.towerStatus = data.towerStatus;
    this.createdBy = data.createdBy || null;
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp();
    this.updatedBy = data.updatedBy || null;
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp();
  }

  static collectionName = 'towers';

  static validate(data) {
    const errors = [];
    if (!data.developerId) errors.push('Developer ID is required');
    if (!data.projectId) errors.push('Project ID is required');
    if (!data.name) errors.push('Tower name is required');
    
    // Parse and validate integer fields
    const totalFloors = parseInt(data.totalFloors, 10);
    const coreCount = parseInt(data.coreCount, 10);
    const totalUnits = parseInt(data.totalUnits, 10);
    
    if (isNaN(totalFloors)) errors.push('Total floors must be an integer');
    if (isNaN(coreCount)) errors.push('Core count must be an integer');
    if (isNaN(totalUnits)) errors.push('Total units must be an integer');
    if (!['Active', 'Disable'].includes(data.status)) errors.push('Status must be either Active or Disable');
    if (!['Under Construction', 'Completed'].includes(data.towerStatus)) errors.push('Tower status must be either Under Construction or Completed');
    return errors;
  }

  toFirestore() {
    return {
      developerId: this.developerId,
      projectId: this.projectId,
      name: this.name,
      totalFloors: this.totalFloors,
      coreCount: this.coreCount,
      totalUnits: this.totalUnits,
      status: this.status,
      towerStatus: this.towerStatus,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };
  }
}

module.exports = Tower;