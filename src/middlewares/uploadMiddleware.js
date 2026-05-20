const fs = require('fs');
const path = require('path');
const multer = require('multer');

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads');

const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdirSync(uploadDir, { recursive: true });
    callback(null, uploadDir);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 6 },
  fileFilter(req, file, callback) {
    if (file.fieldname === 'image' && !file.mimetype.startsWith('image/')) {
      callback(new Error('Les photos doivent etre des images'));
      return;
    }

    if (file.fieldname === 'video' && !file.mimetype.startsWith('video/')) {
      callback(new Error('La video doit etre un fichier video'));
      return;
    }

    callback(null, true);
  }
}).fields([
  { name: 'image', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]);

const identityUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 4 },
  fileFilter(req, file, callback) {
    const allowed = file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf';
    if (!allowed) {
      callback(new Error('Les documents doivent etre des images ou des PDF'));
      return;
    }

    callback(null, true);
  }
}).array('documents', 4);

function uploadListingImage(req, res, next) {
  upload(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = 'Vous pouvez ajouter 5 photos et 1 video maximum';
      }
      error.status = 400;
      next(error);
      return;
    }

    next();
  });
}

function uploadIdentityDocuments(req, res, next) {
  identityUpload(req, res, (error) => {
    if (error) {
      if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = 'Vous pouvez envoyer 4 documents maximum';
      }
      error.status = 400;
      next(error);
      return;
    }

    next();
  });
}

module.exports = { uploadIdentityDocuments, uploadListingImage };
