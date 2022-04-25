const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-subscriptions-sqlite')

module.exports = async () => {
  const prefixedDatabaseFile = process.env.SUBSCRIPTIONS_SQLITE_DATABASE_FILE || process.env.SQLITE_DATABASE_FILE
  const prefixedDatabaseName = process.env.SUBSCRIPTIONS_SQLITE_DATABASE || process.env.SQLITE_DATABASE
  let sequelize
  if (prefixedDatabaseFile) {
    sequelize = new Sequelize(prefixedDatabaseName || 'subscriptions', '', '', {
      storage: prefixedDatabaseFile,
      dialect: 'sqlite',
      logging: (sql) => {
        return Log.info(sql)
      },
      pool: {
        max: process.env.SUBSCRIPTIONS_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.SUBSCRIPTIONS_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  } else {
    sequelize = new Sequelize('sqlite::memory', {
      dialect: 'sqlite',
      logging: (sql) => {
        return Log.info(sql)
      },
      pool: {
        max: process.env.SUBSCRIPTIONS_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
        min: 0,
        idle: process.env.SUBSCRIPTIONS_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
      }
    })
  }
  return sequelize
}
