const { get } = require("lodash");

const init = async models => {
  await models.sequelize.sync();
  await models.User.orm.create({ name: "mintao" });
  await models.User.orm.create({ name: "debuggy" });
  await models.User.orm.create({ name: "test" });
};

const modelSyncHandler = fn => {
  return async (...args) => {
    try {
      return await fn(...args.slice(0, args.length - 1));
    } catch (error) {
      if (get(error, "original.code") === "42P01") {
        // Error 42P01: relation does not exist
        try {
          await init(args[args.length - 1]);
          return await fn(...args.slice(0, args.length - 1));
        } catch (error) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  };
};

// module exports
module.exports = modelSyncHandler;
