const { isNil, get } = require("lodash");
const modelSyncHandler = require("./modelSyncHandler");

class MarketplaceItem {
  constructor(sequelize, DataTypes, models) {
    this.orm = sequelize.define("MarketplaceItem", {
      name: DataTypes.STRING,
      author: DataTypes.STRING,
      category: DataTypes.STRING, // eslint-disable-line new-cap
      introduction: DataTypes.STRING,
      description: DataTypes.TEXT,
      jobConfig: DataTypes.TEXT,
      submits: DataTypes.INTEGER
    });
  }

  associate(models) {
    this.orm.belongsToMany(models.Tag.orm, { through: "ItemTag" });
    this.orm.belongsToMany(models.User.orm, {
      through: "StarRelation"
    });
    this.models = models;
  }

  async list(name, author, category) {
    const handler = modelSyncHandler(async (name, author, category) => {
      const filterStatement = {};
      if (name) {
        filterStatement.name = name;
      }
      if (author) {
        filterStatement.author = author;
      }
      if (category) {
        filterStatement.category = category;
      }
      const items = await this.orm.findAll({ where: filterStatement });
      const processItems = await Promise.all(
        items.map(async item => {
          const tags = await this.listTags(item.id);
          const starUsers = await this.listStarUsers(item.id);
          console.log(starUsers);
          item.dataValues["tags"] = tags.map(tag => tag.name);
          item.dataValues["starNumber"] = starUsers.length;
          return item;
        })
      );
      return processItems;
    });

    return await handler(name, author, category, this.models);
  }

  async create(itemReq) {
    const handler = modelSyncHandler(async itemReq => {
      const tags = get(itemReq, "tags");
      delete itemReq.tags;
      const item = await this.orm.create(itemReq);
      if (!isNil(tags)) {
        await this.updateTags(item.id, tags);
      }
      return item.id;
    });

    const itemId = await handler(itemReq, this.models);
    return itemId;
  }

  async get(itemId) {
    const handler = modelSyncHandler(async itemId => {
      const item = await this.orm.findOne({
        where: { id: itemId }
      });
      if (isNil(item)) {
        return null;
      } else {
        const tags = await this.listTags(itemId);
        const starUsers = await this.listStarUsers(itemId);
        item.dataValues["tags"] = tags.map(tag => tag.name);
        item.dataValues["starNumber"] = starUsers.length;
        return item;
      }
    });

    return await handler(itemId, this.models);
  }

  async update(itemId, newItemReq) {
    const handler = modelSyncHandler(async (itemId, newItemReq) => {
      const item = await this.orm.findOne({
        where: { id: itemId }
      });
      if (isNil(item)) {
        return null;
      } else {
        const tags = get(newItemReq, "tags");
        delete newItemReq.tags;
        await item.update(newItemReq);
        if (!isNil(tags)) {
          await this.updateTags(item.id, tags);
        }

        return item;
      }
    });

    return await handler(itemId, newItemReq, this.models);
  }

  async del(itemId) {
    const handler = modelSyncHandler(async itemId => {
      const item = await this.orm.findOne({
        where: { id: itemId }
      });
      if (isNil(item)) {
        return null;
      } else {
        return await item.destroy();
      }
    });

    return await handler(itemId, this.models);
  }

  async listTags(itemId) {
    const handler = modelSyncHandler(async itemId => {
      const item = await this.orm.findOne({
        where: { id: itemId }
      });
      if (isNil(item)) {
        return null;
      } else {
        return await item.getTags();
      }
    });

    return await handler(itemId, this.models);
  }

  async updateTags(itemId, newTags) {
    const handler = modelSyncHandler(async (itemId, newTags) => {
      const item = await this.orm.findOne({
        where: { id: itemId }
      });
      if (isNil(item)) {
        return null;
      } else {
        item.setTags([]);
        newTags.map(async tag => {
          const [newTag, created] = await this.models.Tag.orm.findOrCreate({
            where: { name: tag }
          });
          await item.addTag(newTag);
        });
        return newTags;
      }
    });

    return await handler(itemId, newTags, this.models);
  }

  async listStarUsers(itemId) {
    const handler = modelSyncHandler(async itemId => {
      const item = await this.orm.findOne({
        where: { id: itemId }
      });
      if (isNil(item)) {
        return null;
      } else {
        return await item.getUsers();
      }
    });

    return await handler(itemId, this.models);
  }
}

module.exports = MarketplaceItem;
