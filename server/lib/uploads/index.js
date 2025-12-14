/**
 * File Upload Module (Multer)
 * Handles document uploads, attachments, and file storage
 * Supports local storage and S3 (configurable)
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Ensure uploads directory exists
const UPLOAD_DIR = process.env.UPLOAD_PATH || './uploads';
const TEMP_DIR = path.join(UPLOAD_DIR, 'temp');

// Create directories if they don't exist
[UPLOAD_DIR, TEMP_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Allowed file types by category
 */
export const FILE_TYPES = {
  DOCUMENTS: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  IMAGES: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  EDI: {
    mimeTypes: ['text/plain', 'application/octet-stream', 'application/x-edi'],
    extensions: ['.edi', '.x12', '.txt', '.dat'],
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  LABELS: {
    mimeTypes: ['application/pdf', 'image/png', 'application/zpl'],
    extensions: ['.pdf', '.png', '.zpl'],
    maxSize: 2 * 1024 * 1024, // 2MB
  },
};

/**
 * Storage configuration for local uploads
 */
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by date and type
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const type = req.uploadType || 'general';

    const uploadPath = path.join(UPLOAD_DIR, type, `${year}/${month}/${day}`);

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 50);

    cb(null, `${uniqueId}-${safeName}`);
  },
});

/**
 * File filter function
 */
function createFileFilter(allowedTypes) {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    const isAllowedMime = allowedTypes.mimeTypes.includes(mimeType);
    const isAllowedExt = allowedTypes.extensions.includes(ext);

    if (isAllowedMime || isAllowedExt) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed: ${allowedTypes.extensions.join(', ')}`
        ),
        false
      );
    }
  };
}

/**
 * Create multer upload middleware for specific file type
 */
export function createUploader(fileType, options = {}) {
  const config = FILE_TYPES[fileType] || FILE_TYPES.DOCUMENTS;

  return multer({
    storage: localStorage,
    limits: {
      fileSize: options.maxSize || config.maxSize,
      files: options.maxFiles || 10,
    },
    fileFilter: createFileFilter(config),
  });
}

/**
 * Pre-configured uploaders
 */
export const uploaders = {
  // Single document upload
  document: createUploader('DOCUMENTS').single('file'),

  // Multiple documents
  documents: createUploader('DOCUMENTS').array('files', 10),

  // Single image
  image: createUploader('IMAGES').single('image'),

  // Multiple images
  images: createUploader('IMAGES').array('images', 20),

  // EDI files
  edi: createUploader('EDI').single('edi'),

  // Label files
  label: createUploader('LABELS').single('label'),

  // Mixed fields
  mixed: createUploader('DOCUMENTS').fields([
    { name: 'document', maxCount: 1 },
    { name: 'attachments', maxCount: 5 },
    { name: 'images', maxCount: 10 },
  ]),
};

/**
 * Upload middleware that sets upload type
 */
export function uploadMiddleware(type, uploader) {
  return (req, res, next) => {
    req.uploadType = type;
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  };
}

/**
 * Get file info from uploaded file
 */
export function getFileInfo(file) {
  return {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    relativePath: file.path.replace(UPLOAD_DIR, ''),
    mimeType: file.mimetype,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Delete file from storage
 */
export async function deleteFile(filePath) {
  const fullPath = filePath.startsWith(UPLOAD_DIR)
    ? filePath
    : path.join(UPLOAD_DIR, filePath);

  if (fs.existsSync(fullPath)) {
    await fs.promises.unlink(fullPath);
    return true;
  }
  return false;
}

/**
 * Move file from temp to permanent storage
 */
export async function moveFromTemp(tempPath, destinationType) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const destDir = path.join(UPLOAD_DIR, destinationType, `${year}/${month}/${day}`);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const filename = path.basename(tempPath);
  const destPath = path.join(destDir, filename);

  await fs.promises.rename(tempPath, destPath);

  return destPath;
}

/**
 * Get file stream for download
 */
export function getFileStream(filePath) {
  const fullPath = filePath.startsWith(UPLOAD_DIR)
    ? filePath
    : path.join(UPLOAD_DIR, filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error('File not found');
  }

  return fs.createReadStream(fullPath);
}

/**
 * Clean up old temp files (run periodically)
 */
export async function cleanupTempFiles(maxAgeMs = 24 * 60 * 60 * 1000) {
  const now = Date.now();
  let cleaned = 0;

  if (!fs.existsSync(TEMP_DIR)) return cleaned;

  const files = await fs.promises.readdir(TEMP_DIR);

  for (const file of files) {
    const filePath = path.join(TEMP_DIR, file);
    const stats = await fs.promises.stat(filePath);

    if (now - stats.mtimeMs > maxAgeMs) {
      await fs.promises.unlink(filePath);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Express routes for file operations
 */
export function createFileRoutes(prisma) {
  const { Router } = await import('express');
  const router = Router();

  // Upload document
  router.post('/documents',
    uploadMiddleware('documents', uploaders.document),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
        }

        const fileInfo = getFileInfo(req.file);

        // Optionally save to database
        // const doc = await prisma.document.create({ data: fileInfo });

        res.json({
          success: true,
          file: fileInfo,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Upload multiple documents
  router.post('/documents/batch',
    uploadMiddleware('documents', uploaders.documents),
    async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        const files = req.files.map(getFileInfo);

        res.json({
          success: true,
          files,
          count: files.length,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Upload image
  router.post('/images',
    uploadMiddleware('images', uploaders.image),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: 'No image uploaded' });
        }

        const fileInfo = getFileInfo(req.file);

        res.json({
          success: true,
          file: fileInfo,
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );

  // Download file
  router.get('/download/:fileId', async (req, res) => {
    try {
      // In production, look up file path from database
      // const doc = await prisma.document.findUnique({ where: { id: req.params.fileId } });

      // For now, assume fileId is the relative path
      const filePath = decodeURIComponent(req.params.fileId);
      const fullPath = path.join(UPLOAD_DIR, filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ error: 'File not found' });
      }

      const filename = path.basename(fullPath);
      res.download(fullPath, filename);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete file
  router.delete('/:fileId', async (req, res) => {
    try {
      const filePath = decodeURIComponent(req.params.fileId);
      const deleted = await deleteFile(filePath);

      if (deleted) {
        res.json({ success: true, message: 'File deleted' });
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

export default {
  createUploader,
  uploaders,
  uploadMiddleware,
  getFileInfo,
  formatFileSize,
  deleteFile,
  moveFromTemp,
  getFileStream,
  cleanupTempFiles,
  createFileRoutes,
  FILE_TYPES,
  UPLOAD_DIR,
};
