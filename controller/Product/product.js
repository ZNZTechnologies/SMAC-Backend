const { validateProduct } = require('../../joiSchemas/Product/product')
const productModel = require('../../models/product')
const userModel = require('../../models/userModel')
const { uploadMultipleToCloudinary } = require('../../utils/cloudinary/cloudinary')
const { responseObject } = require('../../utils/responseObject')
const { } = require('../../')
const { Op } = require("sequelize");
const productParentCategory = require('../../models/productParentCategory')
const productSubCategory = require('../../models/productSubCategory')
const { sortData } = require('../../utils/sortdata')

const userAtrributesObject = {
    include: [
        { model: userModel, attributes: ['email', 'profilePic', 'coverPic', 'firstName', 'lastName'] , where:{isBlocked:false}},
        { model: productParentCategory, attributes: ['productParentCategoryId', 'name'] },
        { model: productSubCategory, as: 'subCategories', through: { attributes: [] } }
    ],
    attributes: {
        exclude: ["parentCategory"]
    },
}

const getAllProducts = async (req, res) => {
  const attributes = [
    "parentCategory",
    "title",
    "authorEmail",
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
      data = await productModel.findAll({
        where: conditions.length == 0 ? whereClause : {
            [Op.and]: conditions
        },
        limit,
        offset,
        ...userAtrributesObject,
      });
    } else {
      data = await productModel.findAll({
        ...userAtrributesObject,
      });
    }
    data = sortData(data);
    return res.status(200).send(responseObject("Successfull", 200, data));
  } catch (error) {
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};

const getMyProducts = async (req, res) => {
    try {
        const userEmail = req.userEmail;
        let productData;
        if (Object.keys(req.query).length > 0) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
            productData = await productModel.findAll({
                where: {
                    authorEmail: userEmail,
                },
                ...userAtrributesObject,
                limit,
                offset
            });
        } else {
            productData = await productModel.findAll({
                where: {
                    authorEmail: userEmail,
                },
                ...userAtrributesObject,
            });
        }
        const sortedData = productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return res.status(200).send(responseObject("Successfully Reterived Data", 200, sortedData))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
    }
}

const getAProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await productModel.findByPk(id, {
            ...userAtrributesObject
        })
        if (!product) return res.status(404).send(responseObject("Not Found", 404, "", "ID is Not Valid"))
        return res.status(200).send(responseObject("Successfully Retrieved Data", 200, product))
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
    }
}

const createProduct = async (req, res) => {
    try {

        const { error, value } = validateProduct(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))

        const parentCategory = await productParentCategory.findByPk(value.parentCategory)
        if (!parentCategory) return res.status(404).send(responseObject("Parent Category found", 404, "", "Parent Category id is invalid"))

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                statusCode: 400,
                message: "Missing required parameter - images",
            });
        }

        const imagesUploadResponse = await uploadMultipleToCloudinary(req.files, "product")
        if (!imagesUploadResponse.isSuccess) return res.status(500).json({
            statusCode: 500,
            message: "Internal server error",
            error: imagesUploadResponse.error,
        });

        const imageUrls = imagesUploadResponse.data

        let product = await productModel.create({
            ...value,
            images: imageUrls,
            thumbnail: imageUrls[0],
            authorEmail: req.userEmail
        })

        if (value.subCategories && value.subCategories.length > 0) {
            const subCategories = await productSubCategory.findAll({
                where: {
                    productSubCategoryId: value.subCategories,
                    parentCategoryId: value.parentCategory
                },
            });
            if (subCategories && !subCategories.length > 0) {
                await product.destroy();
                return res.status(400).send(responseObject("Atleast One subcategory is required", "400", "", "Sub category id's are not valid"))
            }
            await product.addSubCategories(subCategories);
        }


        product = await productModel.findByPk(product.productId, {
            ...userAtrributesObject
        })

        return res.status(200).send(responseObject("Successfully Created", 200, product))
    } catch (error) {
        console.log(error);
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
    }
}

const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const authorEmail = req.userEmail;
        const product = await productModel.findOne({
            where: {
                productId,
                authorEmail
            },
            ...userAtrributesObject
        })
        if (!product) return res.status(404).send(responseObject("Product not found", 404, "", "Id is not valid"))
        await product.destroy();
        return res.status(200).send(responseObject("Successfully Deleted", 200, product))
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
    }
}

// 
const getAllProductsForASpecificUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        let user = await userModel.findOne({
          where: {
            id: userId
          },
          attributes: ["email"]
        });
        if (userId) {
            const data = await productModel.findAll({
                where: {
                    authorEmail: user.email
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
        } else {
            return res.status(400).send(responseObject("User have not listed any product", 400))

        }
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
    }
}

const getProductParentCatByNames = async (req, res) => {
    try {
      let data = await productParentCategory.findAll({
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

  const getProductSubCatByNames = async (req, res) => {
    try {
      let data = await productSubCategory.findAll({
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
        "productName",
        "productSubCategoryId"
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
              if(key == 'productName') {
                whereClause1['title'] = {
                  [Op.like]: `%${queryParams[key]}%`
                };
              }
              if(key == 'productSubCategoryId') {
                whereClause2[key] = {
                  [Op.eq]: `${queryParams[key]}`
                };
              }
            }
          }
          data = await productModel.findAll({
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
                model: productParentCategory,
                attributes: ["productParentCategoryId", "name"],
              },
              {
                model: productSubCategory,
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
  }

module.exports = { getAllProducts, createProduct, getAProduct, deleteProduct, getMyProducts,getAllProductsForASpecificUser, getProductParentCatByNames, getProductSubCatByNames, getBySubCats }