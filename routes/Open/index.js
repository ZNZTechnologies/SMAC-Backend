const express = require("express");
const { getAllCourses } = require("../../controller/Course/course");

const openRoutes = express.Router();

openRoutes.use("/course", getAllCourses);

module.exports = openRoutes;
