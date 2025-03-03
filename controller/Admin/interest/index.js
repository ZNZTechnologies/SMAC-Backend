const interestModel = require("../../../models/interestModel");
const { validateInterest } = require("../../../joiSchemas/Admin/interest");
const { responseObject } = require("../../../utils/responseObject");
const {
  uploadSingleToCloudinary,
} = require("../../../utils/cloudinary/cloudinary");
const { Op } = require("sequelize");

const createInterest = async (req, res) => {
  const { error, value } = validateInterest(req.body);
  if (error) return res.status(400).send(error.message);

  try {
    const checkInterest = await interestModel.findOne({
      where: { name: value.name },
    });
    if (checkInterest)
      return res
        .status(409)
        .json(
          responseObject(
            "Interest already exists",
            400,
            "",
            "Interst already exist"
          )
        );

    const cloudinaryResponse1 = await uploadSingleToCloudinary(
      req.files["icon"][0],
      "interest_icon"
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
      "interest_banner"
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

    const newInterest = await interestModel.create({
      name: value.name,
      description: value.description,
      icon: cloudinaryResponse1.data, //
      banner: cloudinaryResponse2.data, //
    });
    return res
      .status(200)
      .json(responseObject("Interest created succesfully", 200, newInterest));
  } catch (error) {
    return res
      .status(500)
      .json(responseObject("Internal Server Error", 500, error));
  }
};

const updateInterest = async (req, res) => {
  try {
    let value = req.body;
      
      let interest = await interestModel.findByPk(req.params.id);
      if (!interest) return res.status(400).send(responseObject("no interest found with given id", 400, "", "no interest found with given id"))
      
      if(req.files && req.files['icon']) {
      if(interest.dataValues.icon) {
          await deleteFromCloudinary(interest.dataValues.icon);
      }
      
      const cloudinaryResponse = await uploadSingleToCloudinary(req.files['icon'][0], 'parent_cat_icon')
      if (!cloudinaryResponse.isSuccess) {
          return res.status(500).send(responseObject("Internal server error during icon upload", 500, "", cloudinaryResponse.error));
      }
      
      value.icon = cloudinaryResponse.data;
      }
      
      if(req.files && req.files['banner']) {
        if(interest.dataValues.banner) {
            await deleteFromCloudinary(interest.dataValues.banner);
        }
        
        const cloudinaryResponse = await uploadSingleToCloudinary(req.files['banner'][0], 'parent_cat_banner')
        if (!cloudinaryResponse.isSuccess) {
            return res.status(500).send(responseObject("Internal server error during banner upload", 500, "", cloudinaryResponse.error));
        }
        
        value.banner = cloudinaryResponse.data;
        }
      
      await interest.update({ name: value.name, description: value.description, icon: value.icon, banner: value.banner });
      
      return res
      .status(200)
      .send(responseObject("Succesfully updated data", 200, value));
  } catch (error) {
    return res
      .status(500)
      .send(responseObject("Internal Server Error", 500, "", "Server Error"));
  }
};

const deleteInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const interest = await interestModel.findByPk(id);

    if (!interest)
      return res
        .status(404)
        .send(responseObject("Interest Not Found", 404, "", "Id is not valid"));
    await interest.destroy();

    return res
      .status(200)
      .json(responseObject("Interest Deleted Successfully", 200, interest));
  } catch (error) {
    return res
      .status(500)
      .json(responseObject("Internal Server Error", 500, "", error));
  }
};

const getAllInterest = async (req, res) => {
  try {
    const interest = await interestModel.findAll();

    res
      .status(200)
      .json(responseObject("All interset retrived Sucessfully", 200, interest));
  } catch (error) {
    console.log("internal server error getting all interest", error);
    return res
      .status(500)
      .json(responseObject("Internal Server Error", 500, "", error));
  }
};

const getAInterest = async (req, res) => {
  try {
    const { id } = req.params;
    const interest = await interestModel.findByPk(id);

    return res
      .status(200)
      .json(responseObject("Intereset retrived successfully", 200, interest));
  } catch (error) {
    return res
      .status(500)
      .json(responseObject("Internal Server Error", 500, "", error));
  }
};
const searchInterest = async (req, res) => {
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

    let results = await interestModel.findAll({
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

module.exports = {
  createInterest,
  getAInterest,
  getAllInterest,
  deleteInterest,
  updateInterest,
  searchInterest,
};
