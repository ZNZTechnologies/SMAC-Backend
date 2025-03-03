const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const userModel = require("../../models/userModel");
const tokenModel = require("../../models/blacklistModel");
const { handleResetPassword } = require("../../utils/nodeMailer/mailer");
const additional = require("../../models/userAdditionalInformation");
const { validateForgotPass, validateSetPass, validateAdditionalUserData, validateChangePassword, validateUserData, validateUserPersonalInfoUpdate, validaUpdateAdditionalUserData } = require("../../joiSchemas/User/userSchema");
const { uploadSingleToCloudinary } = require("../../utils/cloudinary/cloudinary");
const userDetailsModel = require("../../models/userAdditionalInformation");
const { responseObject } = require("../../utils/responseObject");
const interest = require("../../models/interestModel");
const userInterest = require("../../models/userInterest");
const followerModel = require("../../models/followerModel");
const notificationModel = require("../../models/notificationsModel");
const { Op } = require('sequelize');


const passwordExludeObj = {
  attributes: {
    exclude: ['password']
  }
}

// new
const getUserData = async (req, res) => {
  try {
    const id = req.params.id;
    let user = await userModel.findOne({
      ...passwordExludeObj,
      where: {
        id: id
      }
    });
    if (!user) return res.status(404).send(responseObject('Not Found', 404, "", 'Not Found'));

    const following = await followerModel.count({
      where: {
        userEmail: user.email,
        status: 'accepted'
      }
    });
    user.dataValues.following = following;

    const followers = await followerModel.count({
      where: {
        followingEmail: user.email,
        status: 'accepted'
      }
    });
    user.dataValues.followers = followers;

    return res.status(200).send(responseObject('Data Received Successfully', 200, user));
  } catch (error) {
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
}

const forgotPassword = async (req, res) => {
  const { error, value: { email } } = validateForgotPass(req.body);
  if (error) {
    return res.status(400).send(responseObject(error.message, 400, "", error.message));
  }

  try {
    const userToFind = await userModel.findOne({ where: { email: email } });
    if (!userToFind) {
      return res.status(400).send(responseObject("User not found", 400, "", "User not found"));
    }
    if (userToFind.googleUser) return res.status(400).send(responseObject("Google User Can't Reset Password", 400, "", "Google User Can't Reset Password"));
    if (userToFind.password === null) {
      return res.status(400).send(responseObject("Email sent already.", 400, "", "Email sent already."));
    }
    const jwtToken = jwt.sign(
      {
        email: userToFind.email,
        isPassReset: true
      },
      process.env.Secret_KEY,
      { expiresIn: '20m' }
    );
    await handleResetPassword(jwtToken, userToFind.email)
    // Send a success response to the client
    return res.status(201).send(responseObject("Reset Link Sent. Check your email.", 201, ""));
  } catch (error) {
    console.error("Error processing forgotPassword:", error);
    // Send an error response to the client
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"));
  }
};


const setPassword = async (req, res) => {
  if (!req.isPassReset) return res.status(401).send(responseObject("Token Invalid", 401, "", "Token Invalid"));
  const { error, value: { password, confirmPassword } } = validateSetPass(req.body)
  if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));
  // const email = req.params.email;
  const email = req.userEmail
  const userPassword = await userModel.findOne({
    where: { email: email }, attributes: {
      exclude: ['password']
    }
  });
  if (!userPassword) {
    return res.status(400).send(responseObject("user not found", 400, "", "user not found"));
  }
  if (password !== confirmPassword) {
    return res.status(400).send(responseObject("The password and confirm password do not match", 400, "", "The password and confirm password do not match"));
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await userPassword.update(
      { password: hashedPassword },
      { where: { email: email } }
    );
    return res.status(201).send(responseObject("Password Updated Successfully", 201, userPassword));
  } catch (error) {
    console.log("error", error);
    return res.status(500).send(responseObject("internal server error", 500, "", "internal server error"));
  }
};


const userDashboard = (req, res) => {
  res.end("hello user dashboard");
};

const logout = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  try {
    // console.log(token)
    await tokenModel.create({ token });
    res.status(200).send(responseObject("user logout successfully!", 200, token));
  } catch (error) {
    console.error("error=>", error);
    res.status(500).send(responseObject("internal server error", 500, "", "internal server error"));
  }
};

const additionalUserDetails = async (req, res) => {
  try {
    const { error, value: { country, language, gender, interests } } = validateAdditionalUserData(req.body)
    if (error) return res.status(400).send(error.message)
    // Check for the presence of the JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).send(responseObject("Token missing", 401, "", "Token missing"));
    }
    // Split the token on the base of space
    const accessToken = authHeader.split(" ")[1];
    // Verify token
    const decoded = jwt.verify(accessToken, process.env.Secret_KEY);
    // Extract user email from decoded information
    const userEmail = decoded.email;
    // Check if information is already added
    const checkInformation = await additional.findOne({ where: { email: userEmail } });
    if (checkInformation) {
      return res.status(400).send(responseObject("Information already added", 400, "", "Information already added"));
    }

    const allInterests = await interest.findAll({
      where: {
        id: interests
      }
    });

    if (allInterests.length === 0) return res.status(400).send(responseObject("Atleast One Interest Requireed", 400, null, "Interest Id's are not valid or interset ids are not provided"))
    // Add additional details
    const additionalDetails = await additional.create({
      email: userEmail,
      country: country,
      gender: gender,
      language: language,
    });

    if (interests.length > 0) {
      const validatedInterests = allInterests.map(interest => ({
        userEmail: req.userEmail,
        interestId: interest.id
      }));
      await userInterest.bulkCreate(validatedInterests);
    }

    const temp = await additional.findByPk(additionalDetails.email, {
      include: [
        {
          model: interest,
          as: "interests",
          through: {
            attributes: [],
          }
        }
      ]
    })
    return res.status(201).send(responseObject("Additional details added successfully", 201, temp));
  } catch (error) {
    console.error("Error in additionalUserDetailsController", error);
    return res.status(500).send(responseObject("internal server error", 500, "", "internal server error"));
  }
}


const updateAdditionalUserDetails = async (req, res) => {
  try {
    const { error, value } = validaUpdateAdditionalUserData(req.body)
    console.log(value, "value",);
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message));
    if (Object.keys(value).length === 0) return res.status(400).send(responseObject("Please add atleast one value", 400, "", "update request is invalid"))

    if (value.interests && value.interests.length > 0) {
      // Find all interests that match the provided IDs
      const interests = await interest.findAll({
        where: {
          id: value.interests
        }
      });



      await userInterest.destroy({
        where: {
          userEmail: req.userEmail,
        }
      });

      // Create new associations for the user
      if (interests.length > 0) {
        const validatedInterests = interests.map(interest => ({
          userEmail: req.userEmail,
          interestId: interest.id
        }));
        await userInterest.bulkCreate(validatedInterests);
      }
    }

    const userDetails = await userDetailsModel.findByPk(req.userEmail, {
      ...passwordExludeObj
    })
    if (!userDetails) return res.status(404).send(responseObject("User not found", 404, "", "Id in not valid"))
    await userDetails.update({
      ...value
    });

    const temp = await userDetailsModel.findByPk(userDetails.email, {
      include: [
        {
          model: interest,
          as: "interests",
          through: {
            attributes: [],
          }
        }
      ]
    })
    return res.status(200).send(responseObject("Details Updated Successfully", 200, temp))
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
  }
}


const addProfilePic = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.userEmail, {
      ...passwordExludeObj
    })
    if (!user) return res.status(400).send(responseObject('user not found', 400, "", 'user not found'));
    const cloudinaryResponse = await uploadSingleToCloudinary(req.file, 'user')
    if (!cloudinaryResponse.isSuccess) {
      return res.status(500).send(responseObject("Internal server error during image upload", 500, "", cloudinaryResponse.error));
    }
    await user.update({
      profilePic: cloudinaryResponse.data
    })
    return res.status(201).send(responseObject("Profile Picture Updated Successfully", 201, user));
  } catch (error) {
    // console.log(error);
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
  }
}

const addCoverPic = async (req, res) => {
  try {
    const user = await userModel.findByPk(req.userEmail, {
      ...passwordExludeObj
    })
    if (!user) return res.status(400).send(responseObject('user not found', 400, "", 'user not found'))
    const cloudinaryResponse = await uploadSingleToCloudinary(req.file, 'user');
    if (cloudinaryResponse.error) {
      return res.status(500).send(responseObject("Internal server error during image upload", 500, "", cloudinaryResponse.error.message))
    }
    await user.update({
      coverPic: cloudinaryResponse.data
    })
    return res.status(201).send(responseObject("Cover Photo Updated Successfully", 201, user))
  } catch (error) {
    res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
  }
}

const getUserExtraDetails = async (req, res) => {
  try {
    const userDetails = await userDetailsModel.findByPk(req.userEmail, {
      ...passwordExludeObj,
      include: [
        {
          model: interest,
          as: "interests",
          through: {
            attributes: [],
          }
        }
      ]
    })

    return res.status(200).send(responseObject("User Extra Details", 200, userDetails))
  } catch (error) {
    return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
  }
}


const changePassword = async (req, res) => {
  try {
    const { error, value } = validateChangePassword(req.body)
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))

    const { oldPassword, newPassword, confirmPassword } = value

    if (newPassword !== confirmPassword) return res.status(400).send(responseObject("Password's doesn't match", 400, "", "Password's doesn't match"))

    const user = await userModel.findByPk(req.userEmail)
    if (!user) return res.status(404).send(responseObject("User Not Found", 404, "", "User Not Found"))

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      return res.status(401).json(responseObject("Invalid Old Password", 401, "", "Invalid Old Password"));
    }

    if (newPassword === oldPassword) return res.status(400).send(responseObject("The New Password Must Be Different From The Old Password", 400, null, "Old And Previous Are Same"))

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    // Update user's password in the database
    await user.update({ password: hashedNewPassword });
    return res.status(200).json(responseObject("Password Changed Successfully", 200, user));
  }
  catch (error) {
    console.log(error);
    return res.status(500).send(responseObject('Server error', 500, "", 'Server error'))
  }
}

const addUserDetails = async (req, res) => {
  try {
    const { error, value } = validateUserData(req.body)
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))
    const user = await userModel.findByPk(req.userEmail, {
      ...passwordExludeObj
    });
    if (!user) return res.status(404).send(responseObject('Not found User', 404, "", 'Not found User'))
    if (value.interests && value.interests.length > 0) {
      // Find all interests that match the provided IDs
      const interests = await interest.findAll({
        where: {
          id: value.interests
        }
      });

      // Create new associations for the user
      if (interests.length > 0) {
        const validatedInterests = interests.map(interest => ({
          userEmail: req.userEmail,
          interestId: interest.id
        }));
        await userInterest.bulkCreate(validatedInterests);
      }
    }

    await user.update({
      ...value
    })

    return res.status(200).send(responseObject("Deatils Updated Successfully", 200, user))
  } catch (error) {
    return res.status(500).send(responseObject('Server error', 500, "", 'Server error'))
  }
}

const updateUserPersonalInfo = async (req, res) => {
  try {
    const { error, value } = validateUserPersonalInfoUpdate(req.body)
    if (error) return res.status(400).send(responseObject(error.message, 400, "", error.message))
    const userEmail = req.userEmail
    const user = await userModel.findByPk(userEmail, {
      ...passwordExludeObj
    })
    if (!user) return res.status(404).send(responseObject('User Not Found', 404, "", 'User Not Found'))
    await user.update({
      ...value
    })
    return res.status(200).send(responseObject("Updated Successfully", 200, user))
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject('Server error', 500, "", 'Server error'))
  }
}

const getAllNotifications = async (req, res) => {
  try {
    let offset = req.query.offset ? req.query.offset : 0;
    let limit = req.query.limit ? req.query.limit : 20;
    //
    let allNotifications = await notificationModel.findAll({
      attributes: ['id', 'referenceId', 'type', 'message', 'createdAt', 'isRead'],
      where: {
          receiverEmail: req.userEmail
      },
      include: {
          model: userModel,
          as: "sender",
          attributes: ["id", "email", "firstName", "lastName", "profilePic"],
          where: {
              email: {
                  [Op.not]: req.userEmail
              }
          }
      },
      order: [['createdAt', 'DESC']],
      offset: parseInt(offset),
      limit: parseInt(limit)
  });
  //
  res.status(200).send(responseObject("User Notifications", 200, allNotifications))
  } catch (error) {
    console.log(error);
    return res.status(500).send(responseObject('Server error', 500, "", 'Server error'))
  }
}

module.exports = {
  forgotPassword,
  setPassword,
  userDashboard,
  logout,
  additionalUserDetails,
  updateAdditionalUserDetails,
  addProfilePic,
  addCoverPic,
  getUserExtraDetails,
  changePassword,
  addUserDetails,
  updateUserPersonalInfo,
  getUserData,
  getAllNotifications
};
