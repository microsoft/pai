const { Sequelize, Model } = require('sequelize')

class DatabaseModel {
  constructor (connectionStr, maxConnection = 10) {
    const sequelize = new Sequelize(
      connectionStr,
      {
        pool: {
          max: maxConnection,
          min: 1
        }
      }
    )

    class Framework extends Model {}
    Framework.init({
      insertedAt: Sequelize.DATE,
      name: {
        type: Sequelize.STRING(64),
        primaryKey: true
      },
      namespace: Sequelize.STRING(64),
      jobName: Sequelize.STRING(256),
      userName: Sequelize.STRING(256),
      jobConfig: Sequelize.TEXT,
      executionType: Sequelize.STRING(32),
      creationTime: Sequelize.DATE,
      virtualCluster: Sequelize.STRING(256),
      jobPriority: Sequelize.STRING(256),
      totalGpuNumber: Sequelize.INTEGER,
      totalTaskNumber: Sequelize.INTEGER,
      totalTaskRoleNumber: Sequelize.INTEGER,
      logPathInfix: Sequelize.STRING(256),
      submissionTime: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: false
      },
      dockerSecretDef: Sequelize.TEXT,
      configSecretDef: Sequelize.TEXT,
      priorityClassDef: Sequelize.TEXT,
      retries: Sequelize.INTEGER,
      retryDelayTime: Sequelize.INTEGER,
      platformRetries: Sequelize.INTEGER,
      resourceRetries: Sequelize.INTEGER,
      userRetries: Sequelize.INTEGER,
      completionTime: Sequelize.DATE,
      appExitCode: Sequelize.INTEGER,
      subState: Sequelize.STRING(32),
      state: Sequelize.STRING(32),
      snapshot: Sequelize.TEXT,
      requestSynced: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      apiServerDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      archived: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    }, {
      sequelize,
      indexes: [{
        unique: false,
        fields: ['submissionTime']
      }],
      modelName: 'framework',
      createdAt: 'insertedAt'
    })

    class FrameworkHistory extends Model {}
    FrameworkHistory.init({
      insertedAt: Sequelize.DATE,
      uid: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      frameworkName: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      attemptIndex: Sequelize.INTEGER,
      historyType: {
        type: Sequelize.STRING(16),
        allowNull: false,
        defaultValue: 'retry'
      },
      snapshot: Sequelize.TEXT
    }, {
      sequelize,
      modelName: 'framework_history',
      createdAt: 'insertedAt',
      indexes: [{
        unique: false,
        fields: ['frameworkName']
      }],
      freezeTableName: true
    })

    class Pod extends Model {}
    Pod.init({
      insertedAt: Sequelize.DATE,
      uid: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      frameworkName: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      attemptIndex: Sequelize.INTEGER,
      taskroleName: Sequelize.STRING(256),
      taskroleIndex: Sequelize.INTEGER,
      snapshot: Sequelize.TEXT
    }, {
      sequelize,
      modelName: 'pod',
      createdAt: 'insertedAt',
      indexes: [{
        unique: false,
        fields: ['frameworkName']
      }]
    })

    class FrameworkEvent extends Model {}
    FrameworkEvent.init({
      insertedAt: Sequelize.DATE,
      uid: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      frameworkName: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      message: Sequelize.TEXT,
      event: Sequelize.TEXT
    }, {
      sequelize,
      modelName: 'framework_event',
      createdAt: 'insertedAt',
      indexes: [{
        unique: false,
        fields: ['frameworkName']
      }]
    })

    class PodEvent extends Model {}
    PodEvent.init({
      insertedAt: Sequelize.DATE,
      uid: {
        type: Sequelize.STRING(36),
        primaryKey: true
      },
      frameworkName: {
        type: Sequelize.STRING(64),
        allowNull: false
      },
      podUid: {
        type: Sequelize.STRING(36),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING(32),
        allowNull: false
      },
      message: Sequelize.TEXT,
      event: Sequelize.TEXT
    }, {
      sequelize,
      modelName: 'pod_event',
      createdAt: 'insertedAt',
      indexes: [{
        unique: false,
        fields: ['frameworkName']
      }]
    })

    Framework.hasMany(FrameworkHistory)
    Framework.hasMany(Pod)
    Framework.hasMany(FrameworkEvent)
    Framework.hasMany(PodEvent)

    // bind to `this`
    this.sequelize = sequelize
    this.Framework = Framework
    this.FrameworkHistory = FrameworkHistory
    this.Pod = Pod
    this.FrameworkEvent = FrameworkEvent
    this.PodEvent = PodEvent
    this.synchronizeSchema = this.synchronizeSchema.bind(this)
  }

  async synchronizeSchema (force = false) {
    if (force === true) {
      await this.sequelize.sync({ force: true })
    } else {
      await Promise.all([
        this.Framework.sync({ alter: true }),
        this.FrameworkHistory.sync({ alter: true }),
        this.Pod.sync({ alter: true }),
        this.FrameworkEvent.sync({ alter: true }),
        this.PodEvent.sync({ alter: true })
      ])
    }
  }
}

module.exports = DatabaseModel
