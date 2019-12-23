const init = async models => {
  await models.sequelize.sync();
  await models.User.orm.create({ name: "mintao" });
  await models.User.orm.create({ name: "debuggy" });
  await models.User.orm.create({ name: "test" });
};

module.exports = init;
