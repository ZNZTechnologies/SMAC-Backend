// database connection
const DB = process.env.databaseName;
const { Sequelize } = require("sequelize");

// database name znz, username root , password null (empty), host localhost

// local db code
const sequelize = new Sequelize(
  DB,
  process.env.databaseUserName,
  process.env.databasePassword,
  {
    host: process.env.databaseHost,
    dialect: process.env.databaseDialect || "mssql",
    logging: false,
  }
);

module.exports = sequelize;

// // database connection
// const { Sequelize } = require("sequelize");

// const sequelize = new Sequelize(process.env.databaseUrl, {
//   dialect: "mysql",
//   logging: false,
//   pool: {
//     max: 100, // maximum number of connections in pool
//     min: 5, // minimum number of connections in pool
//     acquire: 20000, // maximum time (ms) that pool will try to get connection before throwing error
//     idle: 5000, // maximum time (ms) that a connection can be idle before being released
//   },
//   dialectOptions: {
//     ssl: {
//       rejectUnauthorized: true, // Set to false only if using self-signed certificates
//     },
//   },
// });

// module.exports = sequelize;
