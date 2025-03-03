const productParentCategory = require("../../../models/productParentCategory");
const userModel = require("../../../models/userModel");
const productModel = require("../../../models/product");
const { Op } = require("sequelize");
const { responseObject } = require("../../../utils/responseObject");

// using same validation for both
const {
  validateCreateParentCat,
  validateCreateSubCat,
} = require("../../../joiSchemas/Admin/course");
const productSubCategory = require("../../../models/productSubCategory");
const {
  uploadSingleToCloudinary,
  deleteFromCloudinary,
} = require("../../../utils/cloudinary/cloudinary");

const subCategoryOptionObject = {
  include: [
    {
      model: productParentCategory,
      attributes: ["productParentCategoryId", "name"],
    },
  ],
  attributes: {
    exclude: ["parentCategoryId"],
  },
};

const getAllParentCat = async (req, res) => {
  const attributes = [
    "productParentCategoryId",
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
      data = await productParentCategory.findAll({
        where: whereClause,
        limit,
        offset,
      });
    } else {
      data = await productParentCategory.findAll();
    }
    //  data = await productParentCategory.findAll();
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
      data = await productSubCategory.findAll({
        ...subCategoryOptionObject,
        where: {
          parentCategoryId,
        },
      });
    } else {
      data = await productSubCategory.findAll({ ...subCategoryOptionObject });
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
    const data = await productParentCategory.findByPk(id);

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
    const data = await productParentCategory.findByPk(id, {
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

    const category = await productParentCategory.findOne({
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
      "parent_product_icon"
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
      "parent_product_banner"
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

    const data = await productParentCategory.create({
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

    const parentCategory = await productParentCategory.findByPk(
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

    const category = await productSubCategory.findOne({
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

    const data = await productSubCategory.create({ ...value, icon: cloudinaryResponse.data, });
    const subCat = await productSubCategory.findByPk(
      data.productSubCategoryId,
      { ...subCategoryOptionObject }
    );

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
    const data = await productParentCategory.findByPk(id);

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
    const data = await productSubCategory.findByPk(id, {
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
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

// categories

// const deleteParentCat = async (req, res) => {
//     try {
//         const id = req.params.id
//         const data = await courseParentCat.findByPk(id);

//         if (!data) return res.status(404).send(responseObject("Id is not valid", 404, "parent category not found"))

//         await data.destroy()
//         return res.status(200).send(responseObject("Succesfully deleted data", 200, data))
//     } catch (error) {
//         return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
//     }
// }

// const deleteSubCat = async (req, res) => {
//     try {
//         const id = req.params.id
//         const data = await courseSubCat.findByPk(id, { ...subCategoryOptionObject });

//         if (!data) return res.status(404).send(responseObject("Id is not valid", 404, "sub category not found"))

//         await data.destroy()
//         return res.status(200).send(responseObject("Succesfully deleted data", 200, data))
//     } catch (error) {
//         return res.status(500).send(responseObject("Internal Server Error", 500, "", "Server Error"))
//     }
// }

//
const getAllProductsForASpecificUser = async (req, res) => {
  try {
    const userEmail = req.params.userEmail;
    if (userEmail) {
      const data = await productModel.findAll({
        where: {
          authorEmail: userEmail,
        },
      });
      return res
        .status(200)
        .send(responseObject("Successfully Retrieved", 200, data));
    } else {
      return res
        .status(400)
        .send(responseObject("User have not listed any product", 400));
    }
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};
const getAllProducts = async (req, res) => {
  try {
    const data = await productModel.findAll({
      include: [
        { model: userModel, attributes: ["email", "firstName", "lastName"] },
      ],
    });

    return res
      .status(200)
      .send(responseObject("Successfully Retrieved Data", 200, data));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const deleteAProduct = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await productModel.findByPk(id, {
      include: [
        { model: userModel, attributes: ["email", "firstName", "lastName"] },
      ],
    });

    if (!product)
      return res
        .status(404)
        .send(responseObject("Product Not Found", 404, "", "Id is not valid"));

    await product.destroy();
    return res
      .status(200)
      .send(responseObject("Product Deleted Successfully", 200, product));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};
const searchProductParentCategories = async (req, res) => {
  try {
    const searchQuery = req.query.searchQuery;

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

    let results = await productParentCategory.findAll({
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
const searchProductSubCategories = async (req, res) => {
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

    let results = await productSubCategory.findAll({
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

const updateParentCat = async (req, res) => {
  try {
    let value = req.body;
      
      let producteParentCat = await productParentCategory.findByPk(req.params.id);
      if (!producteParentCat) return res.status(400).send(responseObject("no productParentCat found with given id", 400, "", "no productParentCat found with given id"))
      
      if(req.files && req.files['icon']) {
      if(producteParentCat.dataValues.icon) {
          await deleteFromCloudinary(producteParentCat.dataValues.icon);
      }
      
      const cloudinaryResponse = await uploadSingleToCloudinary(req.files['icon'][0], 'parent_cat_icon')
      if (!cloudinaryResponse.isSuccess) {
          return res.status(500).send(responseObject("Internal server error during icon upload", 500, "", cloudinaryResponse.error));
      }
      
      value.icon = cloudinaryResponse.data;
      }
      
      if(req.files && req.files['banner']) {
        if(producteParentCat.dataValues.banner) {
            await deleteFromCloudinary(producteParentCat.dataValues.banner);
        }
        
        const cloudinaryResponse = await uploadSingleToCloudinary(req.files['banner'][0], 'parent_cat_banner')
        if (!cloudinaryResponse.isSuccess) {
            return res.status(500).send(responseObject("Internal server error during banner upload", 500, "", cloudinaryResponse.error));
        }
        
        value.banner = cloudinaryResponse.data;
        }
      
      await producteParentCat.update({ name: value.name, description: value.description, icon: value.icon, banner: value.banner });
      
      return res
      .status(200)
      .send(responseObject("Succesfully updated data", 200, value));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

module.exports = {
  getAllProducts,
  getAllProductsForASpecificUser,
  deleteAProduct,
  getAllParentCat,
  getAllSubCat,
  getAParentCat,
  getASubCat,
  createSubCat,
  createParentCat,
  deleteParentCat,
  deleteSubCat,
  searchProductParentCategories,
  searchProductSubCategories,
  updateParentCat
};
