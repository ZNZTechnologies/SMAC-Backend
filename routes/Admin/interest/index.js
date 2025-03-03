const express = require("express");
const interestRouter = express.Router();
const {
  updateInterest,
  deleteInterest,
  createInterest,
  searchInterest,
} = require("../../../controller/Admin/interest");
const {
  handleMulterUploadForMultiFileInputs,
} = require("../../../middleware/multer");

interestRouter.post(
  "/",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 5 }, // Up to 5 images
  ]),
  createInterest
);
interestRouter.get("/search/int", searchInterest);
interestRouter.delete("/:id", deleteInterest);
interestRouter.put("/:id",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 5 }, // Up to 5 images
  ]),
  updateInterest);
module.exports = interestRouter;
