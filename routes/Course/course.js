const express = require('express')
const { getAllCourses, getASpecificCourse, deleteASpecificCourse, createCourse, updateCourse, getMyCourses, getCourseParentCatByNames, getCourseSubCatByNames, getBySubCats } = require('../../controller/Course/course')
const { handleMulterUpload } = require('../../middleware/multer')
const { createOrder, getAllOrdersForASpecificCourse, getASingleOrder, getAllOrders } = require('../../controller/Order/Course')
const { getAllCoursesOfASpecificUserOpen } = require('../../controller/Course/course')


const courseRouter = express.Router()
courseRouter.get('/getAllCoursesOfASpecificUserOpen/:id', getAllCoursesOfASpecificUserOpen); 
courseRouter.get('/', getAllCourses)
courseRouter.get('/my-courses', getMyCourses)
courseRouter.get('/getASpecificCourse/:id', getASpecificCourse)
courseRouter.delete('/:id', deleteASpecificCourse)
courseRouter.get('/getBySubCat', getBySubCats)


courseRouter.post('/', handleMulterUpload("images[]", false, 10), createCourse)
courseRouter.post("/parentCatByNames", getCourseParentCatByNames);
courseRouter.post("/subCatByNames", getCourseSubCatByNames);


// course Orders Routes
courseRouter.get('/user/orders', getAllOrders)
courseRouter.post('/:courseId/orders', createOrder)
courseRouter.get('/:courseId/orders', getAllOrdersForASpecificCourse)
courseRouter.get('/:courseId/orders/:orderId', getASingleOrder)


// this need to be change
courseRouter.put('/:id', handleMulterUpload("images[]", false, 10, false), updateCourse)



module.exports = courseRouter