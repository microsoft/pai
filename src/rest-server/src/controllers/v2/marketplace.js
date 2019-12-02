// postgresql
const Pool = require('pg').Pool;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'root',
  port: 5432,
});

const getMarketList = (req, res) => {
  pool.query(
    `select * from marketplaceitem`,
    function(error, results) {
      if (error == null) {
        return res.status(200).json(results.rows);
      } else {
        return res.status(404).json({
          message: 'fetch failed',
        });
      }
    }
  );
};

const createMarketItem = (req, res) => {
  const { id, name, author, createDate, updateDate, category, tags, introduction, description, jobConfig, submits, stars } = req.body;

  let data = [id, name, author, createDate, updateDate, category, tags, introduction, description, jobConfig, submits, stars];
  let stmt_insert = 'insert into marketplaceitem(id, name, author, createDate, updateDate, category, tags, introduction, description, jobconfig, submits, stars) values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)';
  pool.query(
    stmt_insert,
    data,
    function(error, results) {
      if (error == null) {
        return res.status(200).json({
          message: 'created successfully',
        });
      } else {
        return res.status(500).json({
          message: 'create failed',
        });
      }
    }
  );
};

const getMarketItem = (req, res) => {
  var itemId = req.params.itemId;
  pool.query(
    `select * from marketplaceitem where id = $1`,
    [itemId],
    function(error, results) {
      if (error == null){
        return res.status(200).json(results.rows[0]);
      } else {
        return res.status(404).json({
          message: 'fetch failed',
        });
      }
    }
  );
};

const updateMarketItem = (req, res) => {
  const itemId = req.params.itemId;
  const { name, updateDate, category, tags, introduction, description, submits, stars } = req.body;

  let data = [name, updateDate, category, tags, introduction, description, submits, stars, itemId];
  let stmt_update = `update marketplaceitem set name = $1, updatedate = $2, category = $3, tags = $4, introduction = $5, description = $6, submits = $7, stars = $8 where id = $9`;
  pool.query(
    stmt_update,
    data,
    function(error, results) {
      // success
      if (error == null) {
        return res.status(200).json({
          message: `updated successfully`,
        });
      } else {
        // failure
        return res.status(404).json({
          message: 'update failed',
        });
      }
    }
  );
};

const deleteMarketItem = (req, res) => {
  const itemId = req.params.itemId;

  let stmt_del = `delete from marketplaceitem where id = $1`;
  db.run(
    stmt_del,
    [itemId],
    function(error, results) {
      //success
      if (error == null) {
        return res.status(200).json({
          message: `deleted marketItem ${itemId} successfully!`,
        });
      } else {
        // failure
        return res.status(404).json({
          message: 'delete failed',
        });
      }
    }
  );
};

const getStarRelation = (req, res) => {
  const itemId = req.params.itemId;
  const userName = req.params.userName;
  pool.query(
    'select status from starrelation where marketitemid = $1 and userid = $2',
    [itemId, userName],
    function(error, results) {
      if (error) {
        return res.status(500).json({message: 'service internal error', });
      } else {
        if (results.rowCount === 1) {
          return res.status(200).json({
            message: results.rows[0].status.toString(),
          });
        } else {
          return res.status(200).json({
            message: 'false',
          });
        }
      }
    }
  );
};

const updateStarRelation = (req, res) => {
  const itemId = req.params.itemId;
  const userName = req.params.userName;

  pool.query(
    'select status from starrelation where marketitemid = $1 and userid = $2',
    [itemId, userName],
    function(error, results) {
      if (error) {
        return res.status(500).json({message: 'service internal error', });
      } else {
        if (results.rowCount === 1 && results.rows[0].status === true) {
          deleteStarRelation(req, res);
        } else {
          addStarRelation(req, res);
        }
      }
    }
  );
};

const addStarRelation = (req, res) => {
  const itemId = req.params.itemId;
  const userName = req.params.userName;
  // add star count
  pool.query(
    `select stars from marketplaceitem where id = $1`,
    [itemId],
    function(error, results) {
      const row = results.rows[0];
      if (error == null) {
        var stars = row.stars + 1;

        // count + 1 in table marketItem
        const stmt_update = `update marketplaceitem set stars = $1 where id = $2`;
        const data_update = [stars, itemId];
        pool.query(
          stmt_update,
          data_update,
          function(error, results) {
            // fail
            if (error) {
              return res.status(500).json({message: 'service internal error', });
            }
          }
        );
      } else {
        // fail
        return res.status(500).json({message: 'service internal error', });
      }
    }
  );

  // update star-relation
  pool.query(
    `select * from starrelation where marketitemid = $1 and userid = $2`,
    [itemId, userName],
    function(error, results) {
      if (error) {
        return res.status(500).json({message: 'service internal error', });
      } else {
        if (results.rowCount === 0) {
          // add relation in table StarRelation
          const stmt_add = `insert into starrelation(marketitemid, userid, status) values($1, $2, $3)`;
          const data_add = [itemId, userName, true];
          pool.query(
            stmt_add,
            data_add,
            function(error, results) {
              // success
              if (error == null) {
                return res.status(200).json({
                  message: 'true',
                });
              } else {
                // failure
                return res.status(500).json({message: 'service internal error', });
              }
            }
          );
        } else {
          // change relation-status
          const stmt_update = 'update starrelation set status = $1 where marketitemid = $2 and userid = $3';
          const data_update = [true, itemId, userName];
          pool.query(
            stmt_update,
            data_update,
            function(error, results) {
              if (error == null) {
                return res.status(200).json({
                  message: 'true',
                });
              } else {
                return res.status(500).json({message: 'service internal error', });
              }
            }
          );
        }
      }
    }
  );
};

const deleteStarRelation = (req, res) => {
  const itemId = req.params.itemId;
  const userName = req.params.userName;
  // decrement star count
  pool.query(
    `select stars from marketplaceitem where id = $1`,
    [itemId],
    function(error, results) {
      const row = results.rows[0];
      if (error == null) {
        stars = row.stars - 1;

        // count - 1 in table marketItem
        const stmt_update = `update marketplaceitem set stars = $1 where id = $2`;
        const data_update = [stars, itemId];
        pool.query(
          stmt_update,
          data_update,
          function(error, results) {
            // fail
            if (error) {
              return res.status(500).json({message: 'service internal error', });
            }
          }
        );
      } else {
        // fail
        return res.status(500).json({message: 'service internal error', });
      }
    }
  );

  // unstar relation in table StarRelation
  const stmt_del = `update starrelation set status = $1 where marketitemid = $2 and userid = $3`;
  const data_del = [false, itemId, userName];
  pool.query(
    stmt_del,
    data_del,
    function(error, results) {
      // success
      if (error == null) {
        return res.status(200).json({
          message: 'false',
        });
      } else {
        // failure
        return res.status(500).json({
          message: 'service internal error',
        });
      }
    }
  );
};

module.exports = {
  getMarketList,
  createMarketItem,
  getMarketItem,
  updateMarketItem,
  deleteMarketItem,
  getStarRelation,
  updateStarRelation,
};
