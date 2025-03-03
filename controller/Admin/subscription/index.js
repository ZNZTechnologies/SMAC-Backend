
const { validateSubscription } = require("../../../joiSchemas/Subscription");
const benefitModel = require("../../../models/benefitsModel");
const plansModel = require("../../../models/plansModel");
const subscriptionModel = require("../../../models/subscriptionModel");
const { uploadSingleToCloudinary, deleteFromCloudinary } = require("../../../utils/cloudinary/cloudinary");
const { responseObject } = require("../../../utils/responseObject");


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
    };


module.exports = { createSubscription, updateSubscription }
