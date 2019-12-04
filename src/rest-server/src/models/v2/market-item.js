// postgresql
const Pool = require('pg').Pool;

const pool = new Pool({
user: 'postgres',
host: 'localhost',
database: 'postgres',
password: 'root',
port: 5432,
});

const getMarketList = async () => {
  try {
    const {rows} = await pool.query('select * from marketplaceitem');
    // convert column names to upper case
    var marketList = [];
    rows.forEach(row => marketList.push({
        id: row.id,
        name: row.name,
        author: row.author,
        createDate: row.createdate,
        updateDate: row.updatedate,
        category: row.category,
        tags: row.tags,
        introduction: row.introduction,
        description: row.description,
        jobConfig: row.jobconfig,
        submits: row.submits,
        stars: row.stars,
    }));
    return marketList;
  } catch (error) {
      throw error;
  }
};

const createMarketItem = async (marketItem) => {
  try {
    let stmt_insert = 'insert into marketplaceitem(id, name, author, createDate, updateDate, category, tags, introduction, description, jobconfig, submits, stars) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
    await pool.query(stmt_insert, marketItem);
  } catch (error) {
    throw error;
  }
};

const getMarketItem = async (itemId) => {
  try{
    const {rows} = await pool.query(
      `select * from marketplaceitem where id = $1`,
      [itemId]
    );
    if (rows.length === 0) {
      return null;
    } else {
      return rows[0];
    }
  } catch (error) {
    throw error;
  }
};

const updateMarketItem = async (data) => {
  try {
    let stmt_update = `update marketplaceitem set name = $1, updatedate = $2, category = $3, tags = $4, introduction = $5, description = $6 where id = $7`;
    await pool.query(stmt_update, data);
  } catch (error) {
    throw error;
  }
};

const deleteMarketItem = async (itemId) => {
  try {
    let stmt_del = `delete from marketplaceitem where id = $1`;
    await pool.query(stmt_del, [itemId]);
  } catch (error) {
    throw error;
  }
};

const getStarRelation = async (itemId, userName) => {
  try {
    const {rows} = await pool.query(
      'select status from starrelation where marketitemid = $1 and userid = $2',
      [itemId, userName],
    );
    if (rows.length === 0 || rows[0].status === false) {
      return false;
    } else {
      return true;
    }
  } catch (error) {
    throw error;
  }
};


const addStarRelation = async (itemId, userName) => {
  // increment star count
  try {
    const {rows} = await pool.query(
      `select stars from marketplaceitem where id = $1`,
      [itemId]
    );
    // count + 1 in table marketItem
    const stmt_update = `update marketplaceitem set stars = $1 where id = $2`;
    const data_update = [rows[0].stars + 1, itemId];
    await pool.query(stmt_update, data_update);
  } catch (error) {
    throw error;
  }

  // update star-relation
  try {
    const {rows} = await pool.query(
      `select * from starrelation where marketitemid = $1 and userid = $2`,
      [itemId, userName]
    );
    // add a new star-relation
    if (rows.length === 0) {
      const stmt_add = `insert into starrelation(marketitemid, userid, status) values($1, $2, $3)`;
      const data_add = [itemId, userName, true];
      await pool.query(stmt_add, data_add);
    } else {
      // change the existed relation's status to true
      const stmt_update = 'update starrelation set status = $1 where marketitemid = $2 and userid = $3';
      const data_update = [true, itemId, userName];
      await pool.query(stmt_update, data_update);
    }
  } catch (error) {
    throw error;
  }
};

const deleteStarRelation = async (itemId, userName) => {
  // decrement star count
  try {
    const {rows} = await pool.query(
      `select stars from marketplaceitem where id = $1`,
      [itemId]
    );
    // count - 1 in table marketItem
    const stmt_update = `update marketplaceitem set stars = $1 where id = $2`;
    const data_update = [rows[0].stars - 1, itemId];
    await pool.query(stmt_update, data_update);
  } catch (error) {
    throw error;
  }

  // unstar relation in table StarRelation
  try {
    const stmt_del = `update starrelation set status = $1 where marketitemid = $2 and userid = $3`;
    const data_del = [false, itemId, userName];
    await pool.query(stmt_del, data_del);
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getMarketList,
  createMarketItem,
  getMarketItem,
  updateMarketItem,
  deleteMarketItem,
  getStarRelation,
  addStarRelation,
  deleteStarRelation,
};