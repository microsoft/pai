## Synchronizer

Synchronizer is designed for synchronizing from K8S object to database. It follows `list and watch` behavior. A `list` process queries certain K8S object periodically, and compares them with records in database. If any missing/redundant/inconsistent records are found, INSERT/DELETE/UPDATE will be executed correspondingly. Meanwhile, a `watch` process is always listening to object change in K8S, and synchronizing them to database.

Currently, postgresql is the only tested database.

### Implementation

We make the following assumptions to simplify the problem:

  - Each k8s object corresponds to a record in database. e.g. A framework object corresponds to a record in table `jobs`, and a secret object under `pai-user-v2` namespace corresponds to a record in table `users`.
  - Each k8s object only contains fields of basic DataTypes. Compound DataTypes, such as list and map, will not be synchronized.
  - Each k8s object contains a `uuid` field, which is always unique.

For a `watch` process, it listens to 3 kinds of events: `ADDED`, `MODIFIED`, and `DELETED`. When any events are detected, it does the following in database:

  - `ADDED` event: INSERT `uuid`
  - `MODIFIED` event: UPDATE `uuid`
  - `DELETED` event: DELETE `uuid`

For a `list` process, it list all objects in k8s, and compares them with records in database. The comparison is based on `uuid`. Then it does the following in database:

  - `uuid` is in k8s but not in database: INSERT `uuid`
  - `uuid` is in database but not in k8s: DELETE by `uuid`
  - `uuid` is both in database and k8s, but the two records are not the same: UPDATE by `uuid`

Currently, we synchronize basic job and user information. For job information, there is a `watch` process and `list` process, which is the same for user information. Therefore

### Table Schema

Synchronizer uses `Sequelize` to connect database. It supports Postgres, MySQL, MariaDB, SQLite and Microsoft SQL Server. Postgresql is the only tested database for now. Database tables include `users` and `jobs`, they are defined by:

```javascript
UserModel.init({
  uuid: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  email: Sequelize.STRING,
  grouplist: Sequelize.STRING
}, {
  sequelize,
  modelName: 'user'
})

JobModel.init({
  uuid: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  startTime: Sequelize.DATE,
  transitionTime: Sequelize.DATE,
  completionTime: Sequelize.DATE,
  userName: Sequelize.STRING,
  virtualCluster: Sequelize.STRING,
  retries: Sequelize.INTEGER,
  tasks: Sequelize.INTEGER,
  gpus: Sequelize.INTEGER,
  status: Sequelize.STRING
}, {
  sequelize,
  modelName: 'job'
})
```

### Environmental Varaibales Accepted by Containers

All the following variables are read by `core/config.js`:

  - `RBAC_IN_CLUSTER`
  - `K8S_APISERVER_URI`
  - `K8S_APISERVER_CA_FILE`
  - `K8S_APISERVER_TOKEN_FILE`
  - `K8S_TIMEOUT_SECONDS`
  - `DB_CONNECTION_STR`
  - `DB_MAX_CONNECTION`
  - `LIST_INTERVAL_SECONDS`

### Known Issues

Since `uuid` is unique, thus the consistence of `INSERT` and `DELETE` will be guaranteed. However, there is a risk that `UPDATE` happens in different orders. The record in database will be an old version until the next `list` happens in `LIST_INTERVAL_SECONDS`.


