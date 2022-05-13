const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-connect-postgresql')

module.exports = async () => {
  let url = process.env.SUBSCRIPTIONS_DATABASE_URL || process.env.DATABASE_URL
  const sslModeRequiredIndex = url.indexOf('?sslmode=require')
  let dialectOptions
  if (sslModeRequiredIndex > -1) {
    url = url.substring(0, sslModeRequiredIndex)
    dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      keepAlive: true
    }
  }
  const sequelize = new Sequelize(url, {
    dialect: 'postgres',
    dialectOptions,
    pool: {
      max: process.env.SUBSCRIPTIONS_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.SUBSCRIPTIONS_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
    },
    logging: (sql) => {
      return Log.info(sql)
    }
  })
  return sequelize
}
