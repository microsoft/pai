class Tag {
  constructor(sequelize, DataTypes) {
    this.orm = sequelize.define('Tag', {
      name: {type: DataTypes.STRING, primaryKey: true},
    });
  }

  associate(models) {
    this.orm.belongsToMany(models.MarketplaceItem.orm, {through: 'ItemTag'});
    this.models = models;
  }
}

module.exports = Tag;
