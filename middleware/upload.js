const multer = require('multer');
const { error } = require('../utils/response');

// Store files in memory so they can be piped to Supabase Storage
const storage = multer.memoryStorage();

// ---------------------------------------------------------------------------
// Resume upload — PDF only, max 250 KB
// ---------------------------------------------------------------------------
const resumeUpload = multer({
  storage,
  limits: { fileSize: 250 * 1024 }, // 250 KB
  fileFilter(_req, file, cb) {
    const allowedMimes = ['application/pdf'];
    const allowedExts = ['.pdf'];
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for resumes'));
    }
  },
});

// ---------------------------------------------------------------------------
// Company logo upload — jpg/jpeg/png/webp, max 300 KB
// ---------------------------------------------------------------------------
const logoUpload = multer({
  storage,
  limits: { fileSize: 300 * 1024 }, // 300 KB
  fileFilter(_req, file, cb) {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, jpeg, png, or webp images are allowed for logos'));
    }
  },
});

// ---------------------------------------------------------------------------
// Multer error handler — wraps multer middleware to return JSON errors
// ---------------------------------------------------------------------------
function handleUploadError(uploadMiddleware) {
  return function (req, res, next) {
    uploadMiddleware(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, 'File size exceeds the allowed limit', 400);
        }
        return error(res, `Upload error: ${err.message}`, 400);
      }
      if (err) {
        return error(res, err.message, 400);
      }
      next();
    });
  };
}

module.exports = {
  uploadResume: handleUploadError(resumeUpload.single('resume')),
  uploadLogo: handleUploadError(logoUpload.single('logo')),
};
