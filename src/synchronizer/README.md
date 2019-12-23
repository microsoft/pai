## Synchronizer

Synchronizer is designed for synchronizing from K8S object to database. It follows `list and watch` behavior. `list` queries K8S objects of certain kind, and compares them with records in database. If any missing/redundant/inconsistent records are found, INSERT/DELETE/UPDATE will be executed correspondingly. `watch` listens to object change in K8S, and synchronizing them to database. `list` and `watch` are executed alternately.

Currently, postgresql is the only tested database.

### Supported Configuration

Default configuration is:

```yaml
synchronizer:
  # whether to enable synchronizer. If it is true, postgresql must be enabled too.
  enable: false
  # connection timeout for k8s api server
  k8s-timeout-seconds: 60
  # list interval seconds for job synchronizer
  job-list-interval-seconds: 300
  # max connection number to database for job synchronizer
  job-db-max-connection: 10
  # list interval seconds for user synchronizer 
  user-list-interval-seconds: 120
  # max connection number to database for user synchronizer
  user-db-max-connection: 2
```

### Implementation

We make the following assumptions to simplify the problem:

  - Each k8s object corresponds to a record in database. e.g. A framework object corresponds to a record in table `jobs`, and a secret object under `pai-user-v2` namespace corresponds to a record in table `users`.
  - Each k8s object only contains fields of basic DataTypes. Compound DataTypes, such as list and map, will not be synchronized.
  - Each k8s object contains a `uuid` field, which is always unique.

To ensure consistence, synchronizer leverages two mechanisms:

  - The `resourceVersion` in k8s `ObjectList`. Each time, the `list` procedure queries an object list, remember its `resourceVersion`, and synchronizes all objects to database. Then, the `watch` procedure starts exactly from `resourceVersion`, to make sure we didn't miss any change. If the `watch` connection is broken or it has lasted for a certain timeout seconds, we will do `list` again. The `list` -> `watch` -> `list` -> `watch` -> ...... will repeat forever.
  - Since multiple database connections are supported, we should ensure all database modification can be executed in order. More specifically, if a `uuid` has two `MODIFIED` events, the second modification must be executed after the first modification is done. In NodeJS, it is achieved by using queued promise. Every `uuid` has its promise queue. If the first promise is not fulfilled, the next one will never be executed.

For a `watch` procedure, it listens to 3 kinds of events: `ADDED`, `MODIFIED`, and `DELETED`. When any events are detected, it does the following in database:

  - `ADDED` event: INSERT `uuid`
  - `MODIFIED` event: UPDATE `uuid`
  - `DELETED` event: DELETE `uuid`

For a `list` procedure, it list all objects in k8s, and compares them with records in database. The comparison is based on `uuid`. Then it does the following in database:

  - `uuid` is in k8s but not in database: INSERT `uuid`
  - `uuid` is in database but not in k8s: DELETE by `uuid`
  - `uuid` is both in database and k8s, but the two records are not the same: UPDATE by `uuid`

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
  k8sState: Sequelize.STRING,
  completionStatus: Sequelize.STRING
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


