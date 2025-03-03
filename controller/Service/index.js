const { object } = require("joi");
const {
    validateCreateService,
  validateUpdateService,
} = require("../../joiSchemas/Service/");
const courseModel = require("../../models/courseModel");
const courseParentCategory = require("../../models/courseParentCategory");
const courseSubCategory = require("../../models/courseSubCategory");
const userModel = require("../../models/userModel");
const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
} = require("../../utils/cloudinary/cloudinary");
const { responseObject } = require("../../utils/responseObject");
const { sortData } = require("../../utils/sortdata");
const { Op } = require("sequelize");
const serviceParentCategory = require("../../models/serviceParentCategory");
const serviceModel = require("../../models/serviceModel");
const serviceSubCategory = require("../../models/serviceSubCategory");

const userAtrributesObject = {
  include: [
    {
      model: userModel,
      attributes: [
        "id",
        "email",
        "profilePic",
        "coverPic",
        "firstName",
        "lastName",
        "bio",
      ],
      where:{isBlocked:false}
    },
    {
      model: serviceParentCategory,
      attributes: ["serviceParentCategoryId", "name"],
    },
    {
      model: serviceSubCategory,
      as: "subCategories",
      through: { attributes: [] },
    },
  ],
};

const subCategoryOptionObject = {
  include: [
    { model: serviceParentCategory, attributes: ["serviceParentCategoryId", "name"] },
  ],
  attributes: {
    exclude: ["parentCategoryId"],
  },
};

const getAllServices = async (req, res) => {
  const attributes = [
    "parentCategory",
    "title",
    "authorId",
  ];
  try {
    let data;
    if (req.query && Object.keys(req.query).length > 0) {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      let queryParams = req.query;
      delete queryParams.limit;
      delete queryParams.page;
      const whereClause = {};
      let conditions = [];
      for (const key in queryParams) {
        if (attributes.includes(key)) {
            if(Object.keys(queryParams).length > 1) {
                if(key == 'title') {
                    conditions.push({
                      [key]: {
                            [Op.like]: `%${queryParams[key]}%`
                        }
                    });
                } else {
                    conditions.push({
                      [key]: {
                            [Op.eq]: queryParams[key]
                        }
                    });
                }
            } else {
                if(key == 'title') {
                    whereClause[key] = {
                        [Op.like]: `%${queryParams[key]}%`
                    };
                } else {
                    whereClause[key] = {
                        [Op.eq]: queryParams[key]
                    };
                }
            }
        }
      }
      data = await serviceModel.findAll({
        where: conditions.length == 0 ? whereClause : {
            [Op.and]: conditions
        },
        limit,
        offset,
        attributes: {
          exclude: ["parentCategory"],
        },
        ...userAtrributesObject,
      });
    } else {
      data = await serviceModel.findAll({
        attributes: {
          exclude: ["parentCategory"],
        },
        ...userAtrributesObject,
      });
    }
    data = sortData(data);
    return res.status(200).send(responseObject("Successfull", 200, data));
  } catch (error) {
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const getMyServices = async (req, res) => {
  try {
    let data;
    const userId = req.userId;
    if (req.query && Object.keys(req.query).length > 0) {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      data = await serviceModel.findAll({
        where: {
          authorId: userId,
        },
        limit,
        offset,
        ...userAtrributesObject,
      });
    } else {
      data = await serviceModel.findAll({
        where: {
          authorId: userId,
        },
        ...userAtrributesObject,
      });
    }
    data = sortData(data);
    return res
      .status(200)
      .send(responseObject("Successfully Reterived Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};


const getAllServicesOfASpecificUserOpen = async (req, res) => {
  try {
      const userId = req.params.id;
      
      
      const data = await serviceModel.findAll({
          where: {
              authorId: userId
          },
          include:[
            {
              model: userModel,
              attributes: [
                "email",
                "profilePic",
                "coverPic",
                "firstName",
                "lastName",
                "bio",
              ],
              where:{isBlocked:false}
            }
          ]
      })
      return res.status(200).send(responseObject("Successfully Retrieved", 200, data))
  } catch (error) {
      return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
  }
} 

const getASpecificService = async (req, res) => {
  try {
    const id = req.params.id;
    const service = await serviceModel.findByPk(id, {
      ...userAtrributesObject,
    });
    if (!service)
      return res.status(404).send(responseObject("Service Not Found", 404));
    return res.send(responseObject("Successful", 200, service));
  } catch (error) {
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const deleteASpecificService = async (req, res) => {
  try {
    const id = req.params.id;
    const service = await serviceModel.findOne({
      where: {
        serviceId: id,
        authorId: req.userId,
      },
      ...userAtrributesObject,
    });
    if (!service)
      return res.status(404).send(responseObject("Service Not Found", 404));
    await service.destroy();
    return res.send(responseObject("Deleted Successfully", 200, service));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Server Error"));
  }
};
//res.status(500).send(responseObject("", 500,"",""))
const createService = async (req, res) => {
  try {
    const { error, value } = validateCreateService(req.body);
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));

    const userId = req.userId;
    const user = await userModel.findOne({
        where: {
            id: userId
        }
    });
    if (!user) return res.status(404).send(responseObject("User not Found", 404));

    const parentCategory = await serviceParentCategory.findByPk(
      value.parentCategory
    );

    if (!parentCategory) return res.status(404).send(responseObject("Parent Category found", 404, "", "Parent Category id is invalid"));

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .send(
          responseObject(
            "Missing required parameter - images",
            400,
            "",
            "Missing required parameter - images"
          )
        );
    }

    const imagesUploadResponse = await uploadMultipleToCloudinary(
      req.files,
      "service"
    );
    if (!imagesUploadResponse.isSuccess)
      return res.status(500).send(responseObject("Image Uplaod Error", 500, "", imagesUploadResponse.error));

    const imageUrls = imagesUploadResponse.data;

    let service = await serviceModel.create({
      ...value,
      authorId: userId,
      images: imageUrls,
    });

    if (value.subCategories && value.subCategories.length > 0) {
      const subCategories = await serviceSubCategory.findAll({
        where: {
          serviceSubCategoryId: value.subCategories,
          parentCategoryId: value.parentCategory,
        },
      });
      if (subCategories && !subCategories.length > 0) {
        await service.destroy();
        return res
          .status(400)
          .send(
            responseObject(
              "At least One subcategory is required",
              "400",
              "",
              "Sub category id's are not valid"
            )
          );
      }
      await service.addSubCategories(subCategories);
    }

    if (!service) return res.status(404).send(responseObject("Service not created", 404));
    service = await serviceModel.findByPk(service.serviceId, {
      ...userAtrributesObject,
      attributes: {
        exclude: ["parentCategory"],
      },
    });
    return res.send(responseObject("Service Created Successfully", 200, service));
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Server Error", 500));
  }
};


// there are things need to change modify it again
const updateService = async (req, res) => {
  try {
    const { error, value } = validateUpdateService(req.body);
    if (error)
      return res.status(400).send({ status: 400, message: error.message });
    const userId = req.userId;
    const user = await userModel.findOne({
      where: {
        id: userId,
      }
    });
    if (!user)
      return res.status(404).send(responseObject("User not Found", 404));
    let parentCategory;
    if (value.parentCategory) {
      parentCategory = await serviceParentCategory.findByPk(
        value.parentCategory
      );
      if (!parentCategory)
        return res
          .status(404)
          .send(
            responseObject("parent category not found", 404, "", "parent category id is not valid")
          );
    }
    const id = req.params.id;
    let service = await serviceModel.findOne({
      where: {
        serviceId: id,
        authorId: userId,
      },
    });
    if (!service)
      return res
        .status(404)
        .send(responseObject("Service Not Found", 404, "", "Service Not Exist"));
    let imageUrls = [...service.images];
    if (value.deletedImages) {
      for (let i = 0; i < imageUrls.length; i++) {
        imageUrls = imageUrls.filter((url) => {
          return url === value.deletedImages[i] ? false : true;
        });
      }
      if (imageUrls.length === 0)
        return res
          .status(404)
          .send(
            responseObject(
              "Can't delete require atleast one image",
              400,
              "",
              "one image is a must"
            )
          );
    }
    if (
      value.parentCategory &&
      value.subCategories &&
      value.subCategories.length > 0
    ) {
      const subCategories = await serviceSubCategory.findAll({
        where: {
          courseSubCategoryId: value.subCategories,
          parentCategoryId: value.parentCategory,
        },
      });
      if (subCategories && !subCategories.length > 0)
        return res
          .status(400)
          .send(
            responseObject(
              "Atleast One subcategory is required",
              "400",
              "",
              "Sub category id's are not valid"
            )
          );
      await service.setSubCategories([]);
      await service.addSubCategories(subCategories);
    }
    if (req.files) {
      for (const file of req.files) {
        const cloudinaryResponse = await uploadToCloudinary(file, "znz/service");
        if (cloudinaryResponse.error) {
          return res
            .status(500)
            .json(
              responseObject(
                "Internal server error during image upload",
                500,
                "",
                cloudinaryResponse.error.message
              )
            );
        }
        imageUrls.push(cloudinaryResponse.secure_url);
      }
    }
    await service.update({
      ...value,
      authorId: userId,
      images: imageUrls,
    });
    service = await serviceModel.findByPk(service.courseId, {
      ...userAtrributesObject,
    });
    return res.send(responseObject("Service Updated Successfully", 200, service));
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const getAParentCat = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await serviceParentCategory.findByPk(id);

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

const getAllParentCat = async (req, res) => {
  const attributes = [
    "serviceParentCategoryId",
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
      data = await serviceParentCategory.findAll({
        where: whereClause,
        limit,
        offset,
      });
    } else {
      data = await serviceParentCategory.findAll();
    }

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
      data = await serviceSubCategory.findAll({
        ...subCategoryOptionObject,
        where: {
          parentCategoryId,
        },
      });
    } else {
      data = await serviceSubCategory.findAll({ ...subCategoryOptionObject });
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

const getServiceParentCatByNames = async (req, res) => {
  try {
    let data = await serviceParentCategory.findAll({
      where: {
        name: {
          [Op.in]: req.body.names
        }
      }
    });

    data = data.map(d => d.dataValues)

    return res
      .status(200)
      .send(responseObject("Succesfully retrieved Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const getServiceSubCatByNames = async (req, res) => {
  try {
    let data = await serviceSubCategory.findAll({
      where: {
        parentCategoryId: req.body.parentId,
        name: {
          [Op.in]: req.body.names
        }
      }
    });

    data = data.map(d => d.dataValues)

    return res
      .status(200)
      .send(responseObject("Succesfully retrieved Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const getBySubCats = async (req, res) => {
  const attributes = [
    "serviceName",
    "serviceSubCategoryId"
  ];
  try {
    let data = [];
    if (req.query && Object.keys(req.query).length > 0) {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      const queryParams = req.query;
      const whereClause1 = {};
      const whereClause2 = {};
      for (const key in queryParams) {
        if (attributes.includes(key)) {
          if(key == 'serviceName') {
            whereClause1['title'] = {
              [Op.like]: `%${queryParams[key]}%`
            };
          }
          if(key == 'serviceSubCategoryId') {
            whereClause2[key] = {
              [Op.eq]: `${queryParams[key]}`
            };
          }
        }
      }
      data = await serviceModel.findAll({
        limit,
        offset,
        attributes: {
          exclude: ["parentCategory"],
        },
        where: whereClause1,
        include: [
          {
            model: userModel,
            attributes: [
              "id",
              "email",
              "profilePic",
              "coverPic",
              "firstName",
              "lastName",
              "bio",
            ],
            where:{isBlocked:false}
          },
          {
            model: serviceParentCategory,
            attributes: ["serviceParentCategoryId", "name"],
          },
          {
            model: serviceSubCategory,
            as: "subCategories",
            through: { attributes: [] },
            where: whereClause2
          },
        ]
      });
      data = sortData(data);
    }
    return res.status(200).send(responseObject("Successfull", 200, data));
  } catch (error) {
    console.log(error)
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

module.exports = {
  getAllServices,
  getASpecificService,
  getMyServices,
  deleteASpecificService,
  createService,
  updateService,
  getAllServicesOfASpecificUserOpen,
  getAParentCat,
  getAllParentCat,
  getAllSubCat,
  getServiceParentCatByNames,
  getServiceSubCatByNames,
  getBySubCats
};
