
const { Sequelize } = require("sequelize");

// from .env (for both local and live)
const sequelize = new Sequelize(
  process.env.DATABASENAME,
  process.env.DATABASEUSERNAME,
  process.env.DATABASEPASSWORD,
  {
    host: process.env.DATABASEHOST,
    dialect: "mysql",
    logging: false,
  }
);

module.exports = sequelize;


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// const { Sequelize } = require("sequelize");

// // without .env (for old setup)
// const sequelize = new Sequelize(
//   'db_name',
//   'db_username',
//   'db_password',
//   {
//   dialect: "mysql",
//   logging: false,
//   host: 'db_host', // just ip_address like 127.0.0.1
//   pool: {
//     max: 100, // maximum number of connections in pool
//     min: 5, // minimum number of connections in pool
//     acquire: 20000, // maximum time (ms) that pool will try to get connection before throwing error
//     idle: 5000, // maximum time (ms) that a connection can be idle before being released
//   },
//   dialectOptions: {
//     ssl: {
//       rejectUnauthorized: false, // Set to false only if using self-signed certificates
//     },
//   },
// });

// module.exports = sequelize;
