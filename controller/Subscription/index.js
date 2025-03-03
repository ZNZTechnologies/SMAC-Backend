const { object } = require("joi");
const {
  validateCreateCourse,
  validateUpdateCourse,
} = require("../../joiSchemas/Course/course");
const courseModel = require("../../models/courseModel");
const courseParentCategory = require("../../models/courseParentCategory");
const courseSubCategory = require("../../models/courseSubCategory");
const userModel = require("../../models/userModel");
const {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  uploadSingleToCloudinary,
  deleteFromCloudinary,
} = require("../../utils/cloudinary/cloudinary");
const { responseObject } = require("../../utils/responseObject");
const { sortData } = require("../../utils/sortdata");
const { Op } = require("sequelize");
const { validateSubscription } = require("../../joiSchemas/Subscription");
const subscriptionModel = require("../../models/subscriptionModel");
const benefitModel = require("../../models/benefitsModel");
const sequelize = require("../../database/connection");
const plansModel = require("../../models/plansModel");

const userAtrributesObject = {
  include: [
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
    },
    {
      model: courseParentCategory,
      attributes: ["courseParentCategoryId", "name"],
    },
    {
      model: courseSubCategory,
      as: "subCategories",
      through: { attributes: [] },
    },
  ],
};

const getAllCourses = async (req, res) => {
  const attributes = [
    "parentCategory",
    "title",
    "mode",
    "courseDuration",
    "classDays",
    "classDuration",
    "courseFee",
    "description",
    "authorEmail",
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
      data = await courseModel.findAll({
        where: whereClause,
        limit,
        offset,
        attributes: {
          exclude: ["parentCategory"],
        },
        ...userAtrributesObject,
      });
    } else {
      data = await courseModel.findAll({
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

const getMyCourses = async (req, res) => {
  try {
    let data;
    const userEmail = req.userEmail;
    if (req.query && Object.keys(req.query).length > 0) {
      const limit = parseInt(req.query.limit) || 10;
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * limit;
      data = await courseModel.findAll({
        where: {
          authorEmail: userEmail,
        },
        limit,
        offset,
        ...userAtrributesObject,
      });
    } else {
      data = await courseModel.findAll({
        where: {
          authorEmail: userEmail,
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


const getAllCoursesOfASpecificUserOpen = async (req, res) => {
  try {
      const userEmail = req.params.email;
      
      
      const data = await courseModel.findAll({
          where: {
              authorEmail: userEmail
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

const getASpecificCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const course = await courseModel.findByPk(id, {
      ...userAtrributesObject,
    });
    if (!course)
      return res.status(404).send(responseObject("Course Not Found", 404));
    // const data = await modifySinlge(course)
    return res.send(responseObject("Successful", 200, course));
  } catch (error) {
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const deleteASpecificCourse = async (req, res) => {
  try {
    const id = req.params.id;
    const course = await courseModel.findOne({
      where: {
        courseId: id,
        authorEmail: req.userEmail,
      },
      ...userAtrributesObject,
    });
    if (!course)
      return res.status(404).send(responseObject("Course Not Found", 404));
    await course.destroy();
    return res.send(responseObject("Deleted Successfully", 200, course));
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Server Error"));
  }
};
//res.status(500).send(responseObject("", 500,"",""))
const createCourse = async (req, res) => {
  try {
    const { error, value } = validateCreateCourse(req.body);
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));

    const userEmail = req.userEmail;
    const user = await userModel.findByPk(userEmail);
    if (!user) return res.status(404).send(responseObject("User not Found", 404));

    const parentCategory = await courseParentCategory.findByPk(
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
      "course"
    );
    if (!imagesUploadResponse.isSuccess)
      return res.status(500).send(responseObject("Image Uplaod Error", 500, "", imagesUploadResponse.error));

    const imageUrls = imagesUploadResponse.data;

    let course = await courseModel.create({
      ...value,
      authorEmail: userEmail,
      images: imageUrls,
    });

    if (value.subCategories && value.subCategories.length > 0) {
      const subCategories = await courseSubCategory.findAll({
        where: {
          courseSubCategoryId: value.subCategories,
          parentCategoryId: value.parentCategory,
        },
      });
      if (subCategories && !subCategories.length > 0) {
        await course.destroy();
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
      }
      await course.addSubCategories(subCategories);
    }

    if (!course) return res.status(404).send(responseObject("Course not created", 404));
    course = await courseModel.findByPk(course.courseId, {
      ...userAtrributesObject,
      attributes: {
        exclude: ["parentCategory"],
      },
    });
    return res.send(responseObject("Course Created Successfully", 200, course));
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Server Error", 500));
  }
};


// there are things need to change modify it again
const updateCourse = async (req, res) => {
  try {
    const { error, value } = validateUpdateCourse(req.body);
    if (error)
      return res.status(400).send({ status: 400, message: error.message });
    const userEmail = req.userEmail;
    const user = await userModel.findByPk(userEmail);
    if (!user)
      return res.status(404).send(responseObject("User not Found", 404));
    let parentCategory;
    if (value.parentCategory) {
      parentCategory = await courseParentCategory.findByPk(
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
    let course = await courseModel.findOne({
      where: {
        courseId: id,
        authorEmail: userEmail,
      },
    });
    if (!course)
      return res
        .status(404)
        .send(responseObject("Course Not Found", 404, "", "Course Not Exist"));
    let imageUrls = [...course.images];
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
      const subCategories = await courseSubCategory.findAll({
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
      await course.setSubCategories([]);
      await course.addSubCategories(subCategories);
    }
    if (req.files) {
      for (const file of req.files) {
        const cloudinaryResponse = await uploadToCloudinary(file, "znz/course");
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
    await course.update({
      ...value,
      authorEmail: userEmail,
      images: imageUrls,
    });
    course = await courseModel.findByPk(course.courseId, {
      ...userAtrributesObject,
    });
    return res.send(responseObject("Course Updated Successfully", 200, course));
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const checkBenefitsExist = (benefits) => {
  let b = null;
  benefits.forEach(async benefit => {
    b = await benefitModel.findOne({
      attributes: ["title"]
    });
    if(b) {
      return true; // found
    }
    b = null;
  });
  return false; // not-found
};

const createSubscription = async (req, res) => {
  try {
    const { error, value } = validateSubscription(req.body)
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))

    const subscriptionExists = await subscriptionModel.findOne({
        where: {
            name: value.name
        }
    })

    if (subscriptionExists) return res.status(400).send(responseObject("subscription with same name already exist", 400, "", "subscription with same name already exist"))


    const cloudinaryResponse = await uploadSingleToCloudinary(req.file, 'subscription_icon')
    if (!cloudinaryResponse.isSuccess) {
        return res.status(500).send(responseObject("Internal server error during icon upload", 500, "", cloudinaryResponse.error));
    }

    let subscription = await subscriptionModel.create({
        name: value.name,
        icon: cloudinaryResponse.data
    })
    subscription = subscription.dataValues;

    let p = value.plans.map(plan => {
      return {
        ...plan,
        subscriptionId: subscription.id
      }
    });

    let plans = await plansModel.bulkCreate(p);
    subscription.plans = plans.map(p => p.dataValues);

    let b = new Array();
    value.benefits.forEach(benefit => {
      b.push({
        title: benefit,
        subscriptionId: subscription.id
      });
    });

    let benefits = await benefitModel.bulkCreate(b);

    subscription.benefits = benefits.map(b => {
      return {
        id: b.dataValues.id,
        title: b.dataValues.title
      }
    });

    return res.status(201).send(responseObject("created successfully", 201, subscription))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
  };

const getSubscription = async (req, res) => {
  try {
    let subscriptionExists = await subscriptionModel.findOne({
      where: {
        id: req.params.id
      },
      attributes: ['id', 'name', 'icon'],
      include: [
        {
          model: benefitModel,
          as: "benefits",
          attributes: ['id', 'title']
        },
        {
          model: plansModel,
          as: "plans",
          attributes: ['id', 'title', 'price', 'coursesLimit', 'productsLimit', 'servicesLimit']
        }
      ]
    })

    if (!subscriptionExists) return res.status(400).send(responseObject("subscription doesn't exist", 400, "", "subscription doesn't exist"))
    
    subscriptionExists.dataValues.benefits = subscriptionExists.dataValues.benefits.map(benefit => benefit.dataValues);
    subscriptionExists.dataValues.plans = subscriptionExists.dataValues.plans.map(plan => plan.dataValues);

    return res.status(200).send(responseObject("Subscription Details", 200, subscriptionExists.dataValues))
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
  }
}

const getAllSubscriptions = async (req, res) => {
  try {
    let subscriptions = await subscriptionModel.findAll({
      attributes: ['id', 'name', 'icon'],
      include: [
        {
          model: benefitModel,
          as: "benefits",
          attributes: ['id', 'title']
        },
        {
          model: plansModel,
          as: "plans",
          attributes: ['id', 'title', 'price', 'coursesLimit', 'productsLimit', 'servicesLimit', 'createdAt']
        }
      ]
    })

    if (!subscriptions || subscriptions.length == 0) return res.status(400).send(responseObject("subscriptions don't exist", 400, "", "subscriptions don't exist"))
    
      subscriptions = subscriptions.map(subscription => {
        subscription.dataValues.benefits = subscription.dataValues.benefits.map(benefit => benefit.dataValues);
        subscription.dataValues.plans = subscription.dataValues.plans.map(plan => plan.dataValues);
        subscription.dataValues.plans = subscription.dataValues.plans.sort((a, b) => new Date(a.price) - new Date(b.price));
        return subscription.dataValues;
      });
    
    return res.status(200).send(responseObject("Subscriptions", 200, subscriptions))
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
  }
}

const updateSubscription = async (req, res) => {
  try {
    let value = req.body;
    //
    let subscriptionExists = await subscriptionModel.findByPk(req.params.id);
    if (!subscriptionExists) return res.status(400).send(responseObject("no subscription found with given id", 400, "", "no subscription found with given id"))
    //
    if(req.files && req.files['icon']) { // if icon was uploaded
      if(subscriptionExists.dataValues.icon) { // if icon exists, delete it first
        await deleteFromCloudinary(subscriptionExists.dataValues.icon);
      }
      // upload the new one
      const cloudinaryResponse = await uploadSingleToCloudinary(req.files['icon'][0], 'subscription_icon')
      if (!cloudinaryResponse.isSuccess) {
          return res.status(500).send(responseObject("Internal server error during icon upload", 500, "", cloudinaryResponse.error));
      }
      //
      value.icon = cloudinaryResponse.data;
    }
    //
    await subscriptionExists.update({ name: value.name, icon: value.icon });
    //
    let BIDs = value.benefits.map(b => b.id);
    value.benefits = value.benefits.map(b => {
      return { title: b.title }
    });
    (async () => {
      for (let i = 0; i < BIDs.length; i++) {
        await benefitModel.update(value.benefits[i], {
          where: {
            id: BIDs[i]
          }
        });
      }
    })();
    //
    let PIDs = value.plans.map(p => p.id);
    value.plans = value.plans.map(p => {
      return {
        title: p.title,
        price: p.price,
        coursesLimit: p.coursesLimit,
        productsLimit: p.productsLimit,
        servicesLimit: p.servicesLimit
      }
    });
    (async () => {
      for (let i = 0; i < PIDs.length; i++) {
        await plansModel.update(value.plans[i], {
          where: {
            id: PIDs[i]
          }
        });
      }
    })();
    //
    return res.status(200).send(responseObject("Subscription Details", 200, "Subscription was Updated"))
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
  }
}

const addSubscription = async (req, res) => {
  try {

    let user = await userModel.findByPk(req.userEmail);
    
    if (!user) return res.status(400).send(responseObject("user doesn't exist", 400, "", "user doesn't exist"))

    await user.update({
      subscriptionPlanId: req.body.subscriptionPlanId
    });

    return res.status(201).send(responseObject("subscription added successfully", 201, user))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
}

const removeSubscription = async (req, res) => {
  try {

    let user = await userModel.findByPk(req.userEmail);
    
    if (!user) return res.status(400).send(responseObject("user doesn't exist", 400, "", "user doesn't exist"))

    await user.update({
      subscriptionPlanId: null
    });

    return res.status(201).send(responseObject("subscription removed successfully", 201, user))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
}

const changeSubscription = async (req, res) => {
  try {

    let user = await userModel.findByPk(req.userEmail);
    
    if (!user) return res.status(400).send(responseObject("user doesn't exist", 400, "", "user doesn't exist"))

    await user.update({
      subscriptionPlanId: req.body.subscriptionPlanId
    });

    return res.status(201).send(responseObject("subscription removed successfully", 201, user))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Internal Server Error", 500, "Server Error"))
    }
}

module.exports = {
  getAllCourses,
  getASpecificCourse,
  getMyCourses,
  deleteASpecificCourse,
  createCourse,
  updateCourse,
  getAllCoursesOfASpecificUserOpen,
  //
  createSubscription,
  getSubscription,
  getAllSubscriptions,
  updateSubscription,
  addSubscription,
  removeSubscription,
  changeSubscription
};
