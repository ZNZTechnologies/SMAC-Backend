const { validateAdminUpdateUser } = require("../../../joiSchemas/Admin/admin")

const userModel = require("../../../models/userModel")

const { responseObject } = require("../../../utils/responseObject")
const { Sequelize, Op } = require('sequelize');

//new code
const getAllUser = async (req, res) => {
    try {
        const { isBlocked, filter } = req.query;
        // filter = filter ? filter : ""; 

        const whereClause = {
            [Op.or]: [
                { firstName: { [Op.like]: `%${ filter ? filter : ""}%` } },
                { email: { [Op.like]: `%${ filter ? filter : ""}%` } },
                Sequelize.where(
                    Sequelize.fn('CONCAT', Sequelize.col('firstName'), ' ', Sequelize.col('lastName')),
                    { [Op.like]: `%${ filter ? filter : ""}%` }
                )
            ]
        };

        if (isBlocked !== undefined) {
            whereClause.isBlocked = isBlocked === 'true' ? true : false;
        }

        const data = await userModel.findAll({
            attributes: { exclude: ['password'] },
            where: whereClause
        });

        if (data.length === 0) {
            return res.send(responseObject("No users found", 404, "", `No users found matching: ${ filter ? filter : ""}`));
        }

        return res.status(200).send(responseObject("Users retrieved successfully", 200, data));
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error, try again"));
    }
};
//new code

// const getAllUser = async (req, res) => {
//     console.log("Query builder");
//     try {
//         let userInput = req.query.filter;
//         const chkisBlockedQuery = Object.keys(req.query);

//         if (userInput) {
//             userInput = userInput.replace(/\s+/g, '');
//             let data;

//             if (chkisBlockedQuery.includes("isBlocked")) {
//                 data = await userModel.findAll({
//                     attributes: { exclude: ['password'] }, // Exclude password field
//                     where: {
//                         [Op.or]: [
//                             Sequelize.literal(`CONCAT(firstName, lastName) LIKE '%${userInput}%'`), // Search in concatenated name
//                             { email: { [Op.like]: `%${userInput}%` } } // Search in email field with wildcard
//                         ],
//                         isBlocked: req.query.isBlocked === "true" ? true : false
//                     }
//                 });

//             }
//             else {
//                 data = await userModel.findAll({
//                     attributes: { exclude: ['password'] }, // Exclude password field
//                     where: {
//                         [Op.or]: [
//                             Sequelize.literal(`CONCAT(firstName, lastName) LIKE '%${userInput}%'`), // Search in concatenated name
//                             { email: { [Op.like]: `%${userInput}%` } } // Search in email field with wildcard
//                         ]
//                     }
//                 });
//             }
//             return res.status(200).send(responseObject("Successfully Received", 200, data));
//         }

//         if (chkisBlockedQuery.includes("isBlocked")) {
//             const data = await userModel.findAll({
//                 attributes: { exclude: ['password'] }, // Exclude password field
//                 where: {
//                     isBlocked: req.query.isBlocked === "true" ? true : false
//                 }

//             });
//             return res.status(200).send(responseObject("Successfully Received", 200, data));
//         }

//         const data = await userModel.findAll({
//             // where: {
//             //     isBlocked: req.query.isBlocked === "true" ? true : false
//             // },
//             attributes: {
//                 exclude: ['password']
//             }
//         })
//         return res.status(200).send(responseObject("Successfully Received", 200, data))
//     } catch (error) {
//         return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error try again"))
//     }
// }


// const getAllUser = async (req, res) => {
//     console.log("Fetching all users");
//     try {
//         const data = await userModel.findAll({
//             attributes: { exclude: ['password'] },
//         });

//         return res.status(200).send(responseObject("Successfully Received", 200, data));
//     } catch (error) {
//         console.error("Error fetching users:", error);
//         return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error try again"));
//     }
// };


const getSingleUser = async (req, res) => {
    console.log("Fetching user by email or firstName");

    try {
        const { filter } = req.params;
        console.log(req.params);

        if (!filter) {
            return res.status(400).send(responseObject("Bad Request", 400, "", "Email or First Name is required"));
        }

        const data = await userModel.findOne({
            attributes: { exclude: ['password'] },
            where: {
                [Op.or]: [
                    { email: { [Op.like]: `%${ filter ? filter : ""}%` } },
                    Sequelize.where(
                        Sequelize.fn('CONCAT', Sequelize.col('firstName'), ' ', Sequelize.col('lastName')),
                        { [Op.like]: `%${ filter ? filter : ""}%` }
                    )
                ]
            }
        });

        if (!data) {
            return res.status(404).send(responseObject("User Not Found", 404, "", `No user found with email or firstName: ${filter}`));
        }

        return res.status(200).send(responseObject("User Found", 200, data));
    } catch (error) {
        console.error("Error fetching user:", error);
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error try again"));
    }
};




const updateUser = async (req, res) => {
    try {
        const { error, value } = validateAdminUpdateUser(req.body)
        if (error) return res.status(400).send(responseObject(error.message, 400, "", "Bad Request"));

        const user = await userModel.findByPk(value.userEmail)
        if (!user) return res.status(404).send(responseObject("User not Found", 404, "", "User not Found"))

        if (user.email === req.userEmail) return res.status(400).send(responseObject("You can't block yourself", 400, "", "The option to block yourself is not available."))

        await user.update({ isBlocked: value.isBlocked })

        return res.status(200).send(responseObject('Updated Successfully', 200, user))
    } catch (error) {
        return res.status(500).send(responseObject("Server Error", 500, "", "Internal Server Error"))
    }
}


module.exports = { getAllUser, updateUser, getSingleUser }