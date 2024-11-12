const admin = require('firebase-admin');

class Amenity {
    constructor(data) {
      this.name = data.name;
      this.logoUrl = data.logoUrl;
      this.createdBy = data.createdBy || null;
      this.createdOn = data.createdOn || null;
      this.updatedBy = data.updatedBy || null;
      this.updatedOn = data.updatedOn || null;
    }
  
    static collectionName = 'amenities';
  
    static validate(data) {
      const errors = [];
      if (!data.name) errors.push('Name is required');
      if (!data.name.trim()) errors.push('Name cannot be empty');
      if (!data.logoUrl) errors.push('Logo is required');
      return errors;
    }
  
    static async isDuplicate(name, db) {
      const normalizedName = name.toLowerCase().trim();
      const snapshot = await db.collection(this.collectionName)
        .where('normalizedName', '==', normalizedName)
        .get();
      return !snapshot.empty;
    }
  
    toFirestore() {
      return {
        name: this.name,
        normalizedName: this.name.toLowerCase().trim(),
        logoUrl: this.logoUrl,
        createdBy: this.createdBy,
        createdOn: this.createdOn,
        updatedBy: this.updatedBy,
        updatedOn: this.updatedOn
      };
    }
  }
  
  module.exports = Amenity;