const express = require("express");
const adminProductRouter = express.Router();
const {
  getAllProducts,
  getAllProductsForASpecificUser,
  deleteAProduct,
  createParentCat,
  createSubCat,
  deleteParentCat,
  deleteSubCat,
  searchProductParentCategories,
  searchProductSubCategories,
  updateParentCat
} = require("../../../controller/Admin/product");
const {
  handleMulterUploadForMultiFileInputs,
  handleMulterUpload,
} = require("../../../middleware/multer");
// const { deleteSubCat } = require('../../../controller/Admin/course');

// categories routes

adminProductRouter.post(
  "/parent",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 1 }, // Single image
  ]),
  createParentCat
);
adminProductRouter.put(
  "/parent/:id",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 1 }, // Single image
  ]),
  updateParentCat
);
adminProductRouter.post("/sub", handleMulterUpload("icon", true), createSubCat);

adminProductRouter.delete("/parent/:id", deleteParentCat);
adminProductRouter.delete("/sub/:id", deleteSubCat);

// adminProductRouter.put('/parent/:id')
// adminProductRouter.put('/sub/:id')

//
adminProductRouter.get("/parent/search", searchProductParentCategories);
adminProductRouter.get("/sub/search/:id", searchProductSubCategories);
adminProductRouter.get("", getAllProducts);
adminProductRouter.get("/:userEmail", getAllProductsForASpecificUser);
adminProductRouter.delete("/:id", deleteAProduct);

module.exports = adminProductRouter;
