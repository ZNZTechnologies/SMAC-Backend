const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const userDetailsModel = sequelize.define(
  "userDetails",
  {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      references: {
        model: "users",
        key: "email",
      },
      onDelete: "CASCADE",
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: "userDetails",
    timestamps: true,
  }
);



module.exports = userDetailsModel;
