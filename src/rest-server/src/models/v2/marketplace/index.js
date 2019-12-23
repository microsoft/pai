const Sequelize = require("sequelize");
const { DataTypes } = require("sequelize");
const MarketplaceItem = require("./marketplace-item");
const Tag = require("./tag");
const User = require("./user");
const dotnev = require("dotenv");

dotnev.config();

const SQL_CONNECTION_STR = process.env.SQL_CONNECTION_STR;
const sequelize = new Sequelize(SQL_CONNECTION_STR);

const models = {
  MarketplaceItem: new MarketplaceItem(sequelize, DataTypes),
  Tag: new Tag(sequelize, DataTypes),
  User: new User(sequelize, DataTypes)
};

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;

module.exports = models;
