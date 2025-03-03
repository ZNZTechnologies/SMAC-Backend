const { DataTypes } = require("sequelize");
const sequelize = require("../database/connection");

const userModel = sequelize.define(
  "users",
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
      unique: true,
      validate: {
        notNull: {
          msg: "Email is required.",
        },
        isEmail: {
          msg: "Invalid email format.",
        },
        customValidator(value) {
          if (!/@/.test(value)) {
            throw new Error("Email must contain @ symbol.");
          }

          const allowedDomains = [
            "gmail.com",
            "yahoo.com",
            "hotmail.com",
            "icloud.com",
            "outlook.com",
          ];
          const domain = value.split("@")[1];

          if (!allowedDomains.includes(domain)) {
            throw new Error("Invalid email domain!");
          }
        },
      },
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "First name is required.",
        },
        len: {
          args: [3, 255],
          msg: "The firstName should be between 3 and 255 characters.",
        },
        validationForFirstName: function (value) {
          if (/[{};"'~!@#$%^&*()_+=123456789/*\-+]/.test(value)) {
            throw new Error(
              "Special characters or numeric values are not allowed in firstName."
            );
          }
        },
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Last name is required.",
        },
        len: {
          args: [3, 255],
          msg: "The lastName should be between 3 and 255 characters.",
        },
        validationForLastName: function (value) {
          if (/[{};"'~!@#$%^&*()_+=123456789/*\-+]/.test(value)) {
            throw new Error(
              "Special characters or numeric values are not allowed in lastName."
            );
          }
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        len: {
          args: [6, 255],
          msg: "Password should be between 6 and 255 characters.",
        },
      },
    },
    profilePic: {
      type: DataTypes.STRING,
      defaultValue: null,
      allowNull: true
    },
    coverPic: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    bio: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    googleUser: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'refundSupervisor'),
      defaultValue: 'user'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    socketId: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    },
    subscriptionPlanId: {
      type: DataTypes.UUID,
      allowNull: true,
      defaultValue: null,
      references: {
          model: 'plans',
          key: 'id'
      },
      onDelete: 'CASCADE'
  }
    // Add other columns as needed...
  },
  {
    tableName: "users",
    timestamps: true,
  }
);



module.exports = userModel;
