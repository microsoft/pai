const models = require("@pai/models/v2/marketplace");
const { User, MarketplaceItem } = require("@pai/models/v2/marketplace");

let SYNC_FLAG = false;

const init = async () => {
  if (!SYNC_FLAG) {
    await models.sequelize.sync();
    await User.orm.create({ name: "mintao" });
    await User.orm.create({ name: "debuggy" });
    await User.orm.create({ name: "test" });
    SYNC_FLAG = true;
  }
};

module.exports = { init, SYNC_FLAG };
