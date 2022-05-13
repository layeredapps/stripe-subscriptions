const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-subscriptions-mssql')

module.exports = async () => {
  const prefixedDatabaseURL = process.env.SUBSCRIPTIONS_DATABASE_URL || process.env.DATABASE_URL
  const sequelize = new Sequelize(prefixedDatabaseURL, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'mssql',
    dialectOptions: {
      driver: 'SQL Server Native Client 11.0'
    },
    pool: {
      max: process.env.SUBSCRIPTIONS_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.SUBSCRIPTIONS_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
