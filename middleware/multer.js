const multer = require("multer");
const path = require("path");

const DatauriParser = require('datauri/parser');
const { responseObject } = require("../utils/responseObject");
const parser = new DatauriParser();

// Multer configuration for handling multiple files and limiting size
const storage = multer.memoryStorage();
const allowedImageExtensions = [".png", ".jpeg", ".jpg",".webp",".svg"];
const handleMulterUploadForMultiFileInputs = (fields) => {
  const upload = uploadMultiple.fields(fields); // fields should be an array of objects { name, maxCount }

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log("Multer Error:", err);
        return res
          .status(400)
          .send(responseObject("File upload error", 400, "", err.message));
      } else if (err) {
        return res
          .status(400)
          .send(responseObject(err.message, 400, "", err.message));
      }

      // Ensure files for each field are uploaded
      const missingFields = fields.filter((field) => {
        !req.files || !req.files[field.name];
      });
      if (missingFields.length > 0) {
        const missingFieldNames = missingFields.map((f) => f.name).join(", ");
        return res
          .status(400)
          .send(
            responseObject(
              `Missing required parameter(s): ${missingFieldNames}`,
              400,
              "",
              `Missing required parameter(s): ${missingFieldNames}`
            )
          );
      }

      next();
    });
  };
};

const uploadMultiple = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
  fileFilter: (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith("image/") && allowedImageExtensions.includes(extname)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not supported. Please upload a valid image file. ${allowedImageExtensions}`), false);
    }
  },
}); // Allow up to 10 files with the field name "images"

const uploadSingle = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const extname = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith("image/") && allowedImageExtensions.includes(extname)) {
      cb(null, true);
    } else {
      cb(new Error("File type not supported. Please upload a valid image file."), false);
    }
  },
})


// yay create kia is ko add kr k daikh lo aik dfa
const handleMulterUpload = (fieldName, isSingle, maxImagesInMultiple, isRequired = true) => {
  let upload;
  if (isSingle) upload = uploadSingle.single(fieldName);
  else upload = uploadMultiple.array(fieldName, maxImagesInMultiple)

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log("Multer Error:", err);
        return  res.status(400).send(responseObject("File upload error", 400, "", err.message))
      } else if (err) {
        return res.status(400).send(responseObject(err.message, 400, "", err.message))
      }

      // Check if files are missing in the request
      if (!isRequired) {
        next()
      }
      else {
        if (!isSingle) {
          if (!req.files || req.files.length === 0) {
            return res.status(400).send(responseObject(`Missing required parameter ${fieldName}`, 400, "", `Missing required parameter ${fieldName}`))
          }
        } else {
          if (!req.file) {
            return res.status(400).send(responseObject(`Missing required parameter ${fieldName}`, 400, "", `Missing required parameter ${fieldName}`))
          }
        }
        next();
      }


    });
  };
}

const handleMulterUploadForImageUpdate = (fields) => { // this is to handle image update, where a file may or may not be included in the request object

  const upload = uploadMultiple.fields(fields); // fields should be an array of objects { name, maxCount }

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.log("Multer Error:", err);
        return res
          .status(400)
          .send(responseObject("File upload error", 400, "", err.message));
      } else if (err) {
        return res
          .status(400)
          .send(responseObject(err.message, 400, "", err.message));
      }

      next();
    });
  };
};

// Middleware to handle file upload
const handleFileUpload = (req, res, next) => {
  const upload = uploadMultiple.array('images', 10)
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Multer-specific error
      console.log("Multer Error:", err);
      return res.status(400).send(responseObject("File upload error", 400, "", err.message))
    } else if (err) {
      // Generic error
      return res.status(400).send(responseObject( err.message, 400, "",  err.message))
    }

    // Check if files are missing in the request
    if (!req.files || req.files.length === 0) {
      return res.status(400).send(responseObject(  "Missing required parameter - images", 400, "",  "Missing required parameter - images"))
    }
    // console.log("Files Uploaded Successfully!");
    next();
  });
};


const bufferToString = (req) => {
  return parser.format('new', req.file.buffer)
}


module.exports = { handleFileUpload, handleMulterUpload, bufferToString,handleMulterUploadForMultiFileInputs, handleMulterUploadForImageUpdate };
