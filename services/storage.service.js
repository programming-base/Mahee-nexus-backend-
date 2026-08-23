const { v4: uuidv4 } = require('uuid');
const getSupabaseClient = require('../config/supabase');

/**
 * Upload a file buffer to a Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 *
 * @param {object} params
 * @param {Buffer} params.buffer - File buffer from multer memoryStorage
 * @param {string} params.mimetype - MIME type of the file
 * @param {string} params.originalname - Original filename (used for extension)
 * @param {string} params.bucket - Supabase bucket name ('resumes' | 'logos')
 * @returns {Promise<string>} Public URL
 */
async function uploadFile({ buffer, mimetype, originalname, bucket }) {
  const ext = originalname.slice(originalname.lastIndexOf('.')).toLowerCase();
  const filename = `${uuidv4()}${ext}`;

  const supabase = getSupabaseClient();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Upload a job-seeker resume (PDF) to the 'resumes' bucket.
 * @param {Express.Multer.File} file - multer file object
 * @returns {Promise<string>} Public URL
 */
async function uploadResume(file) {
  return uploadFile({
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
    bucket: 'resumes',
  });
}

/**
 * Upload a company logo to the 'logos' bucket.
 * @param {Express.Multer.File} file - multer file object
 * @returns {Promise<string>} Public URL
 */
async function uploadLogo(file) {
  return uploadFile({
    buffer: file.buffer,
    mimetype: file.mimetype,
    originalname: file.originalname,
    bucket: 'logos',
  });
}

module.exports = { uploadResume, uploadLogo };
