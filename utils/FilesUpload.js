const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const generateFileName = (file, folder) => {
  const timestamp = new Date().getTime();
  return `${folder}/${timestamp}-${uuidv4()}${path.extname(file.originalname)}`;
};

const uploadToFirebase = async (file, folder) => {
  if (!file) return null;
  
  const fileName = generateFileName(file, folder);
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
    },
    resumable: false
  });

  //bucket
  return new Promise((resolve, reject) => {
    blobStream.on('error', (error) => reject(error));
    blobStream.on('finish', async () => {
      await fileUpload.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      resolve(publicUrl);
    });
    blobStream.end(file.buffer);
  });
};

const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl) return;
  
  try {
    const fileName = decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]);
    await bucket.file(fileName).delete();
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

const uploadMultipleFiles = async (files, folder) => {
  if (!files || !Array.isArray(files)) return [];
  
  const uploadPromises = files.map(file => uploadToFirebase(file, folder));
  return Promise.all(uploadPromises);
};

const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls || !Array.isArray(fileUrls)) return;
  
  const deletePromises = fileUrls.map(url => deleteFromFirebase(url));
  await Promise.all(deletePromises);
};

module.exports = {
  uploadFields: [
    { name: 'logo', maxCount: 1 },
    { name: 'images', maxCount: 20 },
    { name: 'videos', maxCount: 5 },
    { name: 'brochureUrl', maxCount: 3 },
    { name: 'insideImagesUrls', maxCount: 20 },
    { name: 'insideVideosUrls', maxCount: 5 }
  ],
  uploadToFirebase,
  deleteFromFirebase,
  uploadMultipleFiles,
  deleteMultipleFiles
};