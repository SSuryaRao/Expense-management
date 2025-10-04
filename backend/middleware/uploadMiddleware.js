const multer = require('multer');
const path = require('path');

// Set up storage engine
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: function(req, file, cb) {
        // Create a unique filename to avoid conflicts
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Initialize upload variable
const upload = multer({
    storage: storage,
    limits: { fileSize: 10000000 }, // Limit file size to 10MB
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
}).single('receipt'); // 'receipt' is the field name in the form-data

// Check file type function
function checkFileType(file, cb) {
    // Allowed extensions
    const filetypes = /jpeg|jpg|png|pdf/;
    // Check extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime type
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images and PDFs Only!');
    }
}

module.exports = upload;