const courseModel = require("../../../models/courseModel");
const { responseObject } = require("../../../utils/responseObject");
const userModel = require("../../../models/userModel");
const { Op } = require("sequelize");
const courseParentCat = require("../../../models/courseParentCategory");
const courseSubCat = require("../../../models/courseSubCategory");
const {
  validateCreateParentCat,
  validateCreateSubCat,
} = require("../../../joiSchemas/Admin/course");
const {
  uploadSingleToCloudinary,
  deleteFromCloudinary,
} = require("../../../utils/cloudinary/cloudinary");
const courseParentCategory = require("../../../models/courseParentCategory");
const courseSubCategory = require("../../../models/courseSubCategory");

const subCategoryOptionObject = {
  include: [
    { model: courseParentCat, attributes: ["courseParentCategoryId", "name"] },
  ],
  attributes: {
    exclude: ["parentCategoryId"],
  },
};

const getAllParentCat = async (req, res) => {
  const attributes = [
    "courseParentCategoryId",
    "name",
    "description",
    "icon",
    "banner",
  ];
  try {
    let data;

    if (req.query && Object.keys(req.query).length > 0) {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const queryParams = req.query;
      const whereClause = {};
      for (const key in queryParams) {
        if (attributes.includes(key)) {
          whereClause[key] = {
            [Op.like]: `%${queryParams[key]}%`,
          };
        }
      }
      data = await courseParentCat.findAll({
        where: whereClause,
        limit,
        offset,
      });
    } else {
      data = await courseParentCat.findAll();
    }
    //  data = await courseParentCat.findAll();
    return res
      .status(200)
      .send(responseObject("Succesfully retrieved Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const getAllSubCat = async (req, res) => {
  try {
    let data;
    if (Object.keys(req.query).length > 0) {
      const parentCategoryId = req.query.parentCategoryId;
      data = await courseSubCat.findAll({
        ...subCategoryOptionObject,
        where: {
          parentCategoryId,
        },
      });
    } else {
      data = await courseSubCat.findAll({ ...subCategoryOptionObject });
    }

    return res
      .status(200)
      .send(responseObject("Succesfully retrieved Data", 200, data));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const getAParentCat = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("id", id);

    const data = await courseParentCat.findByPk(id);

    if (!data)
      return res
        .status(404)
        .send(
          responseObject("Id is not valid", 404, "parent category not found")
        );
    return res
      .status(200)
      .send(responseObject("Succesfully retrieved Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const getASubCat = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await courseParentCat.findByPk(id, {
      ...subCategoryOptionObject,
    });

    if (!data)
      return res
        .status(404)
        .send(responseObject("Id is not valid", 404, "sub category not found"));
    return res
      .status(200)
      .send(responseObject("Succesfully retrieved Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const createParentCat = async (req, res) => {
  try {
    const { error, value } = validateCreateParentCat(req.body);
    if (error)
      return res
        .status(400)
        .send(responseObject(error.message, 400, "", error.message));

    const category = await courseParentCat.findOne({
      where: {
        name: value.name,
      },
    });

    if (category)
      return res
        .status(400)
        .send(
          responseObject(
            "category with same name already exist",
            400,
            "",
            "category with same name already exist"
          )
        );

    const cloudinaryResponse1 = await uploadSingleToCloudinary(
      req.files["icon"][0],
      "parent_cat_icon"
    );
    if (!cloudinaryResponse1.isSuccess) {
      return res
        .status(500)
        .send(
          responseObject(
            "Internal server error during icon upload",
            500,
            "",
            cloudinaryResponse1.error
          )
        );
    }

    const cloudinaryResponse2 = await uploadSingleToCloudinary(
      req.files["banner"][0],
      "parent_cat_banner"
    );
    if (!cloudinaryResponse2.isSuccess) {
      return res
        .status(500)
        .send(
          responseObject(
            "Internal server error during banner upload",
            500,
            "",
            cloudinaryResponse2.error
          )
        );
    }

    const data = await courseParentCat.create({
      ...value,
      icon: cloudinaryResponse1.data, //
      banner: cloudinaryResponse2.data, //
    });

    return res
      .status(201)
      .send(responseObject("created successfully", 201, data));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "Server Error"));
  }
};

const createSubCat = async (req, res) => {
  try {
    const { error, value } = validateCreateSubCat(req.body);
    if (error)
      return res
        .status(400)
        .send(responseObject(error.message, 400, "", error.message));

    const parentCategory = await courseParentCat.findByPk(
      value.parentCategoryId
    );

    if (!parentCategory)
      return res
        .status(400)
        .send(
          responseObject(
            "Parent Category is not valid",
            400,
            "Parent Category not found"
          )
        );

    const category = await courseSubCat.findOne({
      where: {
        name: value.name,
      },
    });

    if (category)
      return res
        .status(400)
        .send(
          responseObject(
            "category with same name already exist",
            400,
            "",
            "category with same name already exist"
          )
        );

    const cloudinaryResponse = await uploadSingleToCloudinary(
      req.file,
      "sub_cat_icon"
    );
    if (!cloudinaryResponse.isSuccess) {
      return res
        .status(500)
        .send(
          responseObject(
            "Internal server error during image upload",
            500,
            "",
            cloudinaryResponse.error
          )
        );
    }

    const data = await courseSubCat.create({
      ...value,
      icon: cloudinaryResponse.data,
    });
    const subCat = await courseSubCat.findByPk(data.courseSubCategoryId, {
      ...subCategoryOptionObject,
    });

    return res
      .status(201)
      .send(responseObject("created successfully", 201, subCat));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "Server Error"));
  }
};

const deleteParentCat = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await courseParentCat.findByPk(id);

    if (!data)
      return res
        .status(404)
        .send(
          responseObject("Id is not valid", 404, "parent category not found")
        );

    await data.destroy();
    return res
      .status(200)
      .send(responseObject("Succesfully deleted data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const deleteSubCat = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await courseSubCat.findByPk(id, {
      ...subCategoryOptionObject,
    });

    if (!data)
      return res
        .status(404)
        .send(responseObject("Id is not valid", 404, "sub category not found"));

    await data.destroy();
    return res
      .status(200)
      .send(responseObject("Succesfully deleted data", 200, data));
  } catch (error) {
    console.log();
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

// need to create update routes
const updateParentCat = async (req, res) => {
  try {
    let value = req.body;
      
      let courseParentCat = await courseParentCategory.findByPk(req.params.id);
      if (!courseParentCat) return res.status(400).send(responseObject("no courseParentCat found with given id", 400, "", "no courseParentCat found with given id"))
      
      if(req.files && req.files['icon']) {
      if(courseParentCat.dataValues.icon) {
          await deleteFromCloudinary(courseParentCat.dataValues.icon);
      }
      
      const cloudinaryResponse = await uploadSingleToCloudinary(req.files['icon'][0], 'parent_cat_icon')
      if (!cloudinaryResponse.isSuccess) {
          return res.status(500).send(responseObject("Internal server error during icon upload", 500, "", cloudinaryResponse.error));
      }
      
      value.icon = cloudinaryResponse.data;
      }
      
      if(req.files && req.files['banner']) {
        if(courseParentCat.dataValues.banner) {
            await deleteFromCloudinary(courseParentCat.dataValues.banner);
        }
        
        const cloudinaryResponse = await uploadSingleToCloudinary(req.files['banner'][0], 'parent_cat_banner')
        if (!cloudinaryResponse.isSuccess) {
            return res.status(500).send(responseObject("Internal server error during banner upload", 500, "", cloudinaryResponse.error));
        }
        
        value.banner = cloudinaryResponse.data;
        }
      
      await courseParentCat.update({ name: value.name, description: value.description, icon: value.icon, banner: value.banner });
      
      return res
      .status(200)
      .send(responseObject("Succesfully updated data", 200, value));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const updateSubCat = async (req, res) => {
  try {
  } catch (error) {}
};

// course controllers
const getAllCourses = async (req, res) => {
  console.log("Cources");

  try {
    const optionObject = {
      include: [
        {
          model: userModel,
          attributes: [
            "email",
            "profilePic",
            "coverPic",
            "firstName",
            "lastName",
          ],
        },
      ],
    };
    const userEmail = req.query.userEmail;
    let data;
    if (userEmail) {
      data = await courseModel.findAll({
        where: {
          authorEmail: userEmail,
        },
        ...optionObject,
      });
    } else {
      data = await courseModel.findAll(optionObject);
    }

    return res
      .status(200)
      .send(responseObject("Successfully Retrieved", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const getAllCoursesOfASpecificUser = async (req, res) => {
  try {
    const userEmail = req.params.userEmail;

    const data = await courseModel.findAll({
      where: {
        authorEmail: userEmail,
      },
      include: {
        model: userModel,
        attributes: ["email", "firstName", "lastName"],
      },
    });
    return res
      .status(200)
      .send(responseObject("Successfully Retrieved", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const deleteCourse = async (req, res) => {
  try {
    const id = req.params.id;
    // const course = await courseModel.findByPk(id, {
    //     include: [{ model: userModel, attributes: ['email', "firstName", "lastName", "profilePic"] }],
    // })
    const course = await courseModel.findByPk(id, {
      include: [
        {
          model: userModel,
          attributes: ["email", "firstName", "lastName", "profilePic"],
        },
      ],
    });
    if (!course)
      return res
        .status(404)
        .send(
          responseObject("Course Not Found", 404, "", "Course Id is not valid")
        );

    await course.destroy();
    return res
      .status(200)
      .send(responseObject("Successfully Deleted Course", 200, course));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};
const searchCourseParentCategories = async (req, res) => {
  try {
    const searchQuery = req.query.searchQuery;
    let results;
    if (!searchQuery)
      return res
        .status(400)
        .json(
          responseObject(
            "searchQuery is required",
            400,
            "",
            "searchQuery is required"
          )
        );

    results = await courseParentCategory.findAll({
      where: {
        [Op.or]: [{ name: { [Op.like]: `%${searchQuery}%` } }],
      },
    });

    res
      .status(200)
      .send(responseObject("Data Received Successfully", 200, results));
  } catch (error) {
    console.log(error, "error in it");
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};
const searchCourseSubCategories = async (req, res) => {
  try {
    const searchQuery = req.query.searchQuery;
    const id = req.params.id;
    if (!searchQuery)
      return res
        .status(400)
        .json(
          responseObject(
            "searchQuery is required",
            400,
            "",
            "searchQuery is required"
          )
        );

    let results = await courseSubCategory.findAll({
      where: {
        [Op.or]: [{ name: { [Op.like]: `%${searchQuery}%` } }],
        parentCategoryId: id,
      },
    });

    res
      .status(200)
      .send(responseObject("Data Received Successfully", 200, results));
  } catch (error) {
    console.log(error, "error in it");
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};
module.exports = {
  getAllCourses,
  getAllCoursesOfASpecificUser,
  deleteCourse,
  getAllParentCat,
  getAllSubCat,
  getAParentCat,
  getASubCat,
  createParentCat,
  createSubCat,
  deleteParentCat,
  deleteSubCat,
  updateParentCat,
  updateSubCat,
  searchCourseSubCategories,
  searchCourseParentCategories,
};
