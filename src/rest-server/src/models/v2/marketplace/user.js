const { isNil, isEmpty } = require("lodash");
const modelSyncHandler = require("./modelSyncHandler");

class User {
  constructor(sequelize, DataTypes) {
    this.orm = sequelize.define("User", {
      name: { type: DataTypes.STRING, primaryKey: true }
    });
  }

  associate(models) {
    this.orm.belongsToMany(models.MarketplaceItem.orm, {
      through: "StarRelation"
    });
    this.models = models;
  }

  async listItems(username) {
    const handler = modelSyncHandler(async username => {
      const user = await this.orm.findOne({ where: { name: username } });
      if (isNil(user)) {
        return null;
      } else {
        return user.getMarketplaceItems();
      }
    });

    return await handler(username, this.models);
  }

  async getItem(username, itemId) {
    const handler = modelSyncHandler(async (username, itemId) => {
      const user = await this.orm.findOne({ where: { name: username } });
      if (isNil(user)) {
        return null;
      } else {
        const items = await user.getMarketplaceItems({
          where: { id: itemId }
        });
        return items;
      }
    });

    return await handler(username, itemId, this.models);
  }

  async updateItem(username, itemId) {
    const handler = modelSyncHandler(async (username, itemId) => {
      const user = await this.orm.findOne({ where: { name: username } });
      if (isNil(user)) {
        return null;
      } else {
        const items = await user.getMarketplaceItems({
          where: { id: itemId }
        });
        if (isEmpty(items)) {
          const item = await this.models.MarketplaceItem.orm.findOne({
            where: { id: itemId }
          });
          if (isNil(item)) {
            return "item not exists";
          }
          await user.addMarketplaceItem(item);
          return true;
        } else {
          return false;
        }
      }
    });

    return await handler(username, itemId, this.models);
  }

  async deleteItem(username, itemId) {
    const handler = modelSyncHandler(async (username, itemId) => {
      const user = await this.orm.findOne({ where: { name: username } });
      if (isNil(user)) {
        return null;
      } else {
        const items = await user.getMarketplaceItems({
          where: { id: itemId }
        });
        if (isEmpty(items)) {
          return false;
        } else {
          await user.removeMarketplaceItem(items);
          return true;
        }
      }
    });

    return await handler(username, itemId, this.models);
  }
}

module.exports = User;
