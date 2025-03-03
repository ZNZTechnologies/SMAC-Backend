const express = require('express')
const productRouter = express.Router()
const { getAllProducts, createProduct, getAProduct, deleteProduct, getMyProducts ,getAllProductsForASpecificUser, getProductParentCatByNames, getProductSubCatByNames, getBySubCats} = require('../../controller/Product/product')
const { handleMulterUpload } = require('../../middleware/multer')
const productModel = require('../../models/product')


productRouter.get('/getallProductsOfSpecificUser/:userId', getAllProductsForASpecificUser)
productRouter.get('/', getAllProducts)
productRouter.get('/my-products', getMyProducts)

productRouter.post('/', handleMulterUpload("images[]", false, 10), createProduct)
productRouter.get('/getById/:id', getAProduct)
productRouter.delete("/:id", deleteProduct)

productRouter.get("/getBySubCat", getBySubCats);
productRouter.post("/parentCatByNames", getProductParentCatByNames);
productRouter.post("/subCatByNames", getProductSubCatByNames);

productRouter.patch("/updateAllProdcuts", async (req, res) => {
    const products = await productModel.findAll();

    for (let i = 0; i < products.length; i++) {
        const product = products[i];

        const image = product.images[0];
        if (image) product.thumbnail = image;

        await product.save();
    }

    return res.status(200).send("all ok")
})



module.exports = productRouter