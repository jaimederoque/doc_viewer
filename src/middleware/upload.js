const multer = require('multer');
const { UPLOAD_LIMIT_BYTES, MAX_UPLOAD_FILES } = require('../config/env');

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: UPLOAD_LIMIT_BYTES,
        files: MAX_UPLOAD_FILES
    }
});

module.exports = upload;
