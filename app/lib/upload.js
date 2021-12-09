const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + '/images/')
  },

  // By default, multer removes file extensions so let's add them back
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const imageFilter = function (req, file, cb) {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|JPG|JPEG)$/)) { //jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF
    req.fileValidationError = 'Only JPEG images are allowed!'
    return cb(new Error('Only JPEG images are allowed!'), false)
  }
  cb(null, true)
}

const singleImage = multer({
  fileFilter: imageFilter,
  storage: multer.memoryStorage(),
}).single('image')

const upload = (req, res, next) => {
  singleImage(req, res, (err) => {
    if (req.fileValidationError) {
      req.uploadError = req.fileValidationError
    } else if (!req.file) {
      req.uploadError = 'image file not found'
    } else if (err instanceof multer.MulterError) {
      req.uploadError = err.message
    } else if (err) {
      req.uploadError = err.message || err
    }
    next()
  })
}

module.exports = upload
