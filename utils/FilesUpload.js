const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FOLDER_PATHS = {
  logoUrl: 'DeveloperLogo',
  images: 'ProjectImages',
  videos: 'ProjectVideos',
  brochureUrl: 'ProjectBrochures',
  layoutPlanUrl: 'SeriesLayouts',
  insideImagesUrls: 'SeriesImages',
  insideVideosUrls: 'SeriesVideos'
};

const generateFileName = (file, folder, entityId = '') => {
  const timestamp = new Date().getTime();
  const uuid = uuidv4();
  const ext = path.extname(file.originalname);
  const folderPath = entityId 
    ? `${FOLDER_PATHS[folder]}/${entityId}`
    : FOLDER_PATHS[folder];
  return `${folderPath}/${timestamp}-${uuid}${ext}`;
};

const uploadToFirebase = async (file, folder, entityId = '') => {
  if (!file) return null;
  
  const fileName = generateFileName(file, folder, entityId);
  const fileUpload = bucket.file(fileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype,
      metadata: {
        entityId,
        originalName: file.originalname,
        uploadTimestamp: new Date().toISOString(),
        folder: FOLDER_PATHS[folder]
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

const extractFilePathFromUrl = (fileUrl) => {
  try {
    let filePath;
    
    // Handle different URL formats
    if (fileUrl.includes('storage.googleapis.com')) {
      // Extract path from https://storage.googleapis.com/bucket-name/path/to/file
      const urlParts = new URL(fileUrl);
      filePath = urlParts.pathname.split('/').slice(2).join('/');
    } else if (fileUrl.startsWith('gs://')) {
      // Handle gs:// URLs
      filePath = fileUrl.split('/').slice(3).join('/');
    } else {
      // Handle direct paths
      filePath = fileUrl;
    }
    
    // Remove any query parameters and decode the path
    filePath = filePath.split('?')[0];
    filePath = decodeURIComponent(filePath);
    
    return filePath;
  } catch (error) {
    console.error('Error extracting file path:', error);
    throw new Error(`Invalid file URL format: ${fileUrl}`);
  }
};

const deleteFromFirebase = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string' || !fileUrl.trim()) {
    console.error('Invalid fileUrl provided:', fileUrl);
    return;
  }

  try {
    const filePath = extractFilePathFromUrl(fileUrl);
    console.log('Attempting to delete file:', filePath);

    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    
    if (!exists) {
      console.log('File does not exist:', filePath);
      return;
    }

    await file.delete();
    console.log('Successfully deleted file:', filePath);
  } catch (error) {
    console.error('Error deleting file from Firebase:', error);
    throw error;
  }
};

const deleteMultipleFiles = async (fileUrls) => {
  if (!fileUrls) return;
  
  const urls = Array.isArray(fileUrls) ? fileUrls : [fileUrls];
  
  try {
    const deletePromises = urls.map(async url => {
      try {
        await deleteFromFirebase(url);
      } catch (error) {
        console.error(`Error deleting file ${url}:`, error);
        // Continue with other deletions even if one fails
      }
    });
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error in batch deletion:', error);
    throw error;
  }
};

const uploadMultipleFiles = async (files, folder, entityId = '') => {
  if (!files || !Array.isArray(files)) {
    if (files) return uploadToFirebase(files, folder, entityId);
    return null;
  }
  
  try {
    const uploadPromises = files.map(file => uploadToFirebase(file, folder, entityId));
    const results = await Promise.all(uploadPromises);
    return Array.isArray(files) ? results : results[0];
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

const validateFiles = (files, type, currentCount = 0) => {
  const { MAX_COUNTS, FILE_LIMITS } = require('../middleware/UploadMiddleware');

  if (!files) return null;

  const filesArray = Array.isArray(files) ? files : [files];
  const totalCount = filesArray.length + currentCount;

  if (totalCount > MAX_COUNTS[type]) {
    throw new Error(`Maximum ${MAX_COUNTS[type]} ${type} allowed`);
  }

  filesArray.forEach(file => {
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