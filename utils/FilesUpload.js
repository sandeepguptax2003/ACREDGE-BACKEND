const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FOLDER_PATHS = {
  logo: 'DeveloperLogo',
  images: 'ProjectImages',
  videos: 'ProjectVideos',
  brochureUrl: 'ProjectBrochures',
  insideImagesUrls: 'SeriesImages',
  insideVideosUrls: 'SeriesVideos'
};

const generateFileName = (file, folder, entityId = '') => {
  const timestamp = new Date().getTime();
  const uuid = uuidv4();
  const ext = path.extname(file.originalname);
  return `${folder}/${entityId ? entityId + '/' : ''}${timestamp}-${uuid}${ext}`;
};

const uploadToFirebase = async (file, folder, entityId = '') => {
  if (!file) return null;
  
  const fileName = generateFileName(file, FOLDER_PATHS[folder], entityId);
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        entityId,
        originalName: file.originalname,
        uploadTimestamp: new Date().toISOString()
      }
    },
    resumable: false
  });

  return new Promise((resolve, reject) => {
    blobStream.on('error', (error) => {
      console.error('Upload error:', error);
      reject(error);
    });

    blobStream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        resolve(publicUrl);
      } catch (error) {
        console.error('Make public error:', error);
        reject(error);
      }
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
    throw error;
  }
};

const uploadMultipleFiles = async (files, folder, entityId = '') => {
  if (!files || !Array.isArray(files)) return [];
  
  try {
    const uploadPromises = files.map(file => uploadToFirebase(file, folder, entityId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    throw error;
  }
};

const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls || !Array.isArray(fileUrls)) return;
  
  try {
    const deletePromises = fileUrls.map(url => deleteFromFirebase(url));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple files:', error);
    throw error;
  }
};

const validateFiles = (files, type, currentCount = 0) => {
  const { MAX_COUNTS, FILE_LIMITS } = require('../middleware/UploadMiddleware');
  
  if (!files) return null;
  
  const totalCount = files.length + currentCount;
  if (totalCount > MAX_COUNTS[type]) {
    throw new Error(`Maximum ${MAX_COUNTS[type]} ${type} allowed`);
  }

  files.forEach(file => {
    if (file.size > FILE_LIMITS[type]) {
      throw new Error(`${type} size must be less than ${FILE_LIMITS[type] / (1024 * 1024)}MB`);
    }
  });

  return true;
};

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  uploadMultipleFiles,
  deleteMultipleFiles,
  validateFiles,
  FOLDER_PATHS
};