const express = require('express')
const { getAllServices, getAllServicesOfASpecificUserOpen, getASpecificService, deleteASpecificService, createService, updateService, getMyServices, getAParentCat, getAllParentCat, getAllSubCat, getServiceParentCatByNames, getServiceSubCatByNames, getBySubCats } = require('../../controller/Service/')
const { handleMulterUpload } = require('../../middleware/multer')
const { createOrder, getAllOrdersForASpecificService, getASingleOrder, getAllOrders } = require('../../controller/Order/Service')
const serviceRefundRouter = require("./Refund");

const serviceRouter = express.Router()

serviceRouter.get('/getAllServicesOfASpecificUserOpen/:id', getAllServicesOfASpecificUserOpen); 
serviceRouter.get('/', getAllServices)
serviceRouter.get('/getBySubCat', getBySubCats)
serviceRouter.get('/my-services', getMyServices)
serviceRouter.get('/getASpecificService/:id', getASpecificService)
serviceRouter.delete('/:id', deleteASpecificService)

serviceRouter.post('/', handleMulterUpload("images[]", false, 10), createService)

serviceRouter.get('/user/orders', getAllOrders)
serviceRouter.post('/:serviceId/orders', createOrder)
serviceRouter.get('/:serviceId/orders', getAllOrdersForASpecificService)
serviceRouter.get('/:serviceId/orders/:orderId', getASingleOrder)

// this need to be change
serviceRouter.put('/:id', handleMulterUpload("images[]", false, 10, false), updateService)

serviceRouter.use("/orders", serviceRefundRouter)

serviceRouter.get("/parent/:id", getAParentCat);
serviceRouter.get("/parent", getAllParentCat);
serviceRouter.get("/sub", getAllSubCat);
serviceRouter.post("/parentCatByNames", getServiceParentCatByNames);
serviceRouter.post("/subCatByNames", getServiceSubCatByNames);

module.exports = serviceRouter