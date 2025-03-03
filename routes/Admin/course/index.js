const express = require("express");
const courseRouter = express.Router();
const {
  handleMulterUploadForMultiFileInputs,
  handleMulterUpload,
} = require("../../../middleware/multer");
const {
  getAllCourses,
  getAllCoursesOfASpecificUser,
  deleteCourse,
  getAllParentCat,
  getAllSubCat,
  getAParentCat,
  createParentCat,
  createSubCat,
  deleteParentCat,
  deleteSubCat,
  searchCourseParentCategories,
  searchCourseSubCategories,
  updateParentCat,
} = require("../../../controller/Admin/course");

courseRouter.post(
  "/parent",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 1 }, // Single image
  ]),
  createParentCat
);
courseRouter.put(
  "/parent/:id",
  handleMulterUploadForMultiFileInputs([
    { name: "icon", maxCount: 1 }, // Single image
    { name: "banner", maxCount: 1 }, // Single image
  ]),
  updateParentCat
);
courseRouter.post("/sub", handleMulterUpload("icon", true), createSubCat);

courseRouter.delete("/parent/:id", deleteParentCat);
courseRouter.delete("/sub/:id", deleteSubCat);

courseRouter.put("/parent/:id");
courseRouter.put("/sub/:id");

courseRouter.get("/parent/search", searchCourseParentCategories);
courseRouter.get("/sub/search/:id", searchCourseSubCategories);
courseRouter.get("/", getAllCourses);
courseRouter.get("/:userEmail", getAllCoursesOfASpecificUser);
courseRouter.delete("/:id", deleteCourse);
courseRouter.get("/parent", getAllParentCat); // added again
courseRouter.get("/sub", getAllSubCat); // added again
courseRouter.get("/parent:id", getAParentCat); // added again

module.exports = courseRouter;
