const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const postModel = sequelize.define(
  "post",
  {
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "users",
        key: "email",
      },
      onDelete: "CASCADE",
    },
    postText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    images: {
      type: DataTypes.TEXT, // or DataTypes.JSON, depending on your preference
      allowNull: true,
      get() {
        const rawValue = this.getDataValue("images");
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue("images", value ? JSON.stringify(value) : null);
      },
    },
  },
  {
    tableName: "posts",
    timestamps: true,
  }
);



module.exports = postModel;
