const express = require("express");
const serviceRouter = express.Router();

const {
  handleMulterUploadForMultiFileInputs,
  handleMulterUpload,
} = require("../../../middleware/multer");

const {
  getAllServices,
  getAllServicesOfASpecificUser,
  deleteService,
  getAllParentCat,
  getAllSubCat,
  getAParentCat,
  createParentCat,
  createSubCat,
  deleteParentCat,
  deleteSubCat,
  searchServiceParentCategories,
  searchServiceSubCategories,
  updateParentCat
} = require("../../../controller/Admin/service");

serviceRouter.post(
  "/parent",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 1 }, // Single image
  ]),
  createParentCat
);

serviceRouter.put(
  "/parent/:id",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 1 }, // Single image
  ]),
  updateParentCat
);

serviceRouter.post("/sub", handleMulterUpload("icon", true), createSubCat);

serviceRouter.delete("/parent/:id", deleteParentCat);
serviceRouter.delete("/sub/:id", deleteSubCat);

serviceRouter.get("/parent/search", searchServiceParentCategories);
serviceRouter.get("/sub/search/:id", searchServiceSubCategories);
serviceRouter.get("/", getAllServices);
serviceRouter.get("/:userId", getAllServicesOfASpecificUser);
serviceRouter.delete("/:id", deleteService);
serviceRouter.get("/parent/all", getAllParentCat); // added again
serviceRouter.get("/sub", getAllSubCat); // added again
serviceRouter.get("/parent:id", getAParentCat); // added again

module.exports = serviceRouter;
