const admin = require('firebase-admin');

class Developer {
  constructor(data) {
    this.name = data.name.toUpperCase();
    this.address = data.address;
    this.incorporationDate = data.incorporationDate;
    this.totalProjectsDelivered = data.totalProjectsDelivered;
    this.totalSqFtDelivered = data.totalSqFtDelivered;
    this.description = data.description;
    this.websiteLink = data.websiteLink;
    this.logoUrl = data.logoUrl;
    this.age = this.calculateAge(data.incorporationDate);
    this.status = data.status;
    this.createdBy = data.createdBy || null;
    this.createdOn = data.createdOn || admin.firestore.FieldValue.serverTimestamp();
    this.updatedBy = data.updatedBy || null;
    this.updatedOn = data.updatedOn || admin.firestore.FieldValue.serverTimestamp();
  }

  static collectionName = 'developers';

  static validate(data) {
    const errors = [];
    if (!data.name || !/^[A-Z0-9\s]+$/.test(data.name)) errors.push('Developer name is required and must be in capital letters');
    if (!data.address) errors.push('Address is required');
    if (!data.incorporationDate || isNaN(new Date(data.incorporationDate).getTime())) errors.push('Valid incorporation date is required');
    if (!Number.isInteger(data.totalProjectsDelivered)) errors.push('Total projects delivered must be an integer');
    if (!Number.isInteger(data.totalSqFtDelivered)) errors.push('Total sq ft delivered must be an integer');
    if (!data.description || data.description.length < 50) errors.push('Description must be at least 50 characters long');
    if (!data.websiteLink || !this.isValidUrl(data.websiteLink)) errors.push('Valid website link is required');
    if (!data.logoUrl || !this.isValidImageFormat(data.logoUrl)) errors.push('Logo must be a PNG or JPG file');
    if (!['Active', 'Disable'].includes(data.status)) errors.push('Status must be either Active or Disable');
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

  static isValidImageFormat(filename) {
    return /\.(jpg|jpeg|png)$/i.test(filename);
  }

  calculateAge(incorporationDate) {
    const ageDifMs = Date.now() - new Date(incorporationDate).getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  toFirestore() {
    return {
      name: this.name,
      address: this.address,
      incorporationDate: this.incorporationDate,
      totalProjectsDelivered: this.totalProjectsDelivered,
      totalSqFtDelivered: this.totalSqFtDelivered,
      description: this.description,
      websiteLink: this.websiteLink,
      logoUrl: this.logoUrl,
      age: this.age,
      status: this.status,
      createdBy: this.createdBy,
      createdOn: this.createdOn,
      updatedBy: this.updatedBy,
      updatedOn: this.updatedOn
    };
  }
}

module.exports = Developer;