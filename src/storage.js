const { Sequelize, Model, DataTypes } = require('sequelize')
const metrics = require('@layeredapps/dashboard/src/metrics.js')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-subscriptions')

module.exports = async () => {
  let dateType
  const prefixedStorage = process.env.SUBSCRIPTIONS_STORAGE || process.env.STORAGE || 'sqlite'
  switch (prefixedStorage) {
    case 'mariadb':
    case 'mysql':
      dateType = DataTypes.DATE(6)
      break
    case 'postgresql':
    case 'postgres':
    case 'db2':
    case 'mssql':
    case 'sqlite':
    default:
      dateType = DataTypes.DATE
      break
  }
  const sequelize = await createConnection(prefixedStorage)
  class Charge extends Model {}
  Charge.init({
    chargeid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    accountid: DataTypes.STRING(64),
    subscriptionid: DataTypes.STRING(64),
    customerid: DataTypes.STRING(64),
    paymentmethodid: DataTypes.STRING(64),
    invoiceid: DataTypes.STRING(64),
    refundRequested: dateType,
    refundReason: DataTypes.TEXT,
    refundDenied: dateType,
    refundDeniedReason: DataTypes.TEXT,
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'charge'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'charge'
  })
  class Coupon extends Model {}
  Coupon.init({
    couponid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'coupon'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    publishedAt: dateType,
    unpublishedAt: dateType,
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'coupon'
  })
  class Customer extends Model {}
  Customer.init({
    customerid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'customer'
      }
    },
    accountid: DataTypes.STRING(64),
    couponid: DataTypes.STRING(64),
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'customer'
  })
  class Dispute extends Model {}
  Dispute.init({
    disputeid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'dispute'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'dispute'
  })
  class Invoice extends Model {}
  Invoice.init({
    invoiceid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'invoice'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    customerid: DataTypes.STRING(64),
    subscriptionid: DataTypes.STRING(64),
    accountid: DataTypes.STRING(64),
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'invoice'
  })
  class PaymentIntent extends Model {}
  PaymentIntent.init({
    paymentintentid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'paymentintent'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    accountid: DataTypes.STRING(64),
    customerid: DataTypes.STRING(64),
    paymentmethodid: DataTypes.STRING(64),
    subscriptionid: DataTypes.STRING(64),
    invoiceid: DataTypes.STRING(64),
    status: DataTypes.STRING(64),
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'paymentintent'
  })
  class PaymentMethod extends Model {}
  PaymentMethod.init({
    paymentmethodid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'paymentmethod'
      }
    },
    accountid: DataTypes.STRING(64),
    customerid: DataTypes.STRING(64),
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'paymentmethod'
  })
  class Payout extends Model {}
  Payout.init({
    payoutid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'payout'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'payout'
  })
  class Price extends Model {}
  Price.init({
    priceid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'price'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    productid: DataTypes.STRING(64),
    publishedAt: dateType,
    unpublishedAt: dateType,
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'price'
  })
  class Product extends Model {}
  Product.init({
    productid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'product'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    publishedAt: dateType,
    unpublishedAt: dateType,
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'product'
  })
  class Refund extends Model {}
  Refund.init({
    refundid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'refund'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    accountid: DataTypes.STRING(64),
    subscriptionid: DataTypes.STRING(64),
    customerid: DataTypes.STRING(64),
    invoiceid: DataTypes.STRING(64),
    priceids: {
      type: DataTypes.STRING,
      get () {
        const value = this.getDataValue('priceids')
        return value ? value.split(',') : undefined
      },
      set (array) {
        this.setDataValue('priceids', array.join(','))
      }
    },
    productid: DataTypes.STRING(64),
    paymentmethodid: DataTypes.STRING(64),
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'refund'
  })
  class SetupIntent extends Model {}
  SetupIntent.init({
    setupintentid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    accountid: DataTypes.STRING(64),
    customerid: DataTypes.STRING(64),
    paymentmethodid: DataTypes.STRING(64),
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'setupintent'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'setupintent'
  })
  class Subscription extends Model {}
  Subscription.init({
    subscriptionid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'subscription'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    customerid: DataTypes.STRING(64),
    accountid: DataTypes.STRING(64),
    paymentmethodid: DataTypes.STRING(64),
    productid: DataTypes.STRING(64),
    priceids: {
      type: DataTypes.STRING,
      get () {
        const value = this.getDataValue('priceids')
        return value ? value.split(',') : undefined
      },
      set (array) {
        this.setDataValue('priceids', array.join(','))
      }
    },
    couponid: DataTypes.STRING(64),
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'subscription'
  })
  class TaxCode extends Model {}
  TaxCode.init({
    taxcodeid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'taxcode'
      }
    },
    description: DataTypes.STRING,
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'taxcode'
  })
  class TaxId extends Model {}
  TaxId.init({
    taxid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'taxid'
      }
    },
    accountid: DataTypes.STRING(64),
    customerid: DataTypes.STRING(64),
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    type: DataTypes.STRING,
    value: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'taxid'
  })
  class TaxRate extends Model {}
  TaxRate.init({
    taxrateid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'dispute'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'taxrate'
  })
  class UsageRecord extends Model {}
  UsageRecord.init({
    usagerecordid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'usagerecord'
      }
    },
    stripeObject: {
      type: DataTypes.TEXT,
      get () {
        const raw = this.getDataValue('stripeObject')
        if (raw) {
          return JSON.parse(raw)
        }
      },
      set (value) {
        this.setDataValue('stripeObject', JSON.stringify(value))
      }
    },
    customerid: DataTypes.STRING(64),
    accountid: DataTypes.STRING(64),
    subscriptionid: DataTypes.STRING(64),
    subscriptionitemid: DataTypes.STRING(64),
    appid: {
      type: DataTypes.STRING(64),
      defaultValue: global.appid
    },
    // 'createdAt' is specified for each model because mysql/mariadb truncate
    // the ms and this makes the return order unpredictable and throws off the
    // test suites expecting the write order to match the return order
    createdAt: {
      type: dateType,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'usagerecord'
  })
  // table creation
  await sequelize.sync()
  // exception logging
  const originalQuery = sequelize.query
  sequelize.query = function () {
    return originalQuery.apply(this, arguments).catch((error) => {
      Log.error(error)
      throw error
    })
  }
  // metrics
  Charge.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'charge-created', new Date())
  })
  Coupon.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'coupon-created', new Date())
  })
  Customer.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'customer-created', new Date())
  })
  Dispute.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'dispute-created', new Date())
  })
  Invoice.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'invoice-created', new Date())
  })
  PaymentIntent.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'paymentintent-created', new Date())
  })
  Payout.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'payout-created', new Date())
  })
  PaymentMethod.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'paymentmethod-created', new Date())
  })
  Price.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'price-created', new Date())
  })
  Product.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'product-created', new Date())
  })
  Refund.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'refund-created', new Date())
  })
  SetupIntent.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'setupintent-created', new Date())
  })
  Subscription.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'subscription-created', new Date())
  })
  TaxRate.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'taxrate-created', new Date())
  })
  UsageRecord.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'usagerecord-created', new Date())
  })
  return {
    flush: async () => {
      if (process.env.NODE_ENV === 'testing') {
        await Charge.sync({ force: true })
        await Coupon.sync({ force: true })
        await Customer.sync({ force: true })
        await Dispute.sync({ force: true })
        await Invoice.sync({ force: true })
        await PaymentIntent.sync({ force: true })
        await PaymentMethod.sync({ force: true })
        await Payout.sync({ force: true })
        await Price.sync({ force: true })
        await Product.sync({ force: true })
        await Refund.sync({ force: true })
        await SetupIntent.sync({ force: true })
        await Subscription.sync({ force: true })
        await TaxId.sync({ force: true })
        await TaxRate.sync({ force: true })
        await UsageRecord.sync({ force: true })
      }
    },
    Charge,
    Coupon,
    Customer,
    Dispute,
    Invoice,
    PaymentIntent,
    PaymentMethod,
    Payout,
    Price,
    Product,
    Refund,
    SetupIntent,
    Subscription,
    TaxCode,
    TaxId,
    TaxRate,
    UsageRecord
  }
}

async function createConnection (dialect) {
  // sqlite
  if (dialect === 'sqlite') {
    const databaseFile = process.env.SUBSCRIPTIONS_DATABASE_FILE || process.env.DATABASE_FILE
    if (databaseFile) {
      return new Sequelize(process.env.DATABASE || 'dashboard', '', '', {
        storage: databaseFile,
        dialect: 'sqlite',
        logging: (sql) => {
          return Log.info(sql)
        }
      })
    } else {
      return new Sequelize('sqlite::memory', {
        dialect: 'sqlite',
        logging: (sql) => {
          return Log.info(sql)
        }
      })
    }
  }
  // all other databases
  let url = global.subscriptionsDatabaseURL || process.env.SUBSCRIPTIONS_DATABASE_URL || global.databaseURL || process.env.DATABASE_URL
  const sslModeRequiredIndex = url.indexOf('?sslmode=require')
  const dialectOptions = {}
  if (sslModeRequiredIndex > -1) {
    url = url.substring(0, sslModeRequiredIndex)
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    }
    dialectOptions.keepAlive = true
  }
  if (dialect === 'mssql') {
    dialectOptions.driver = 'SQL Server Native Client 11.0'
  }
  const pool = {
    max: process.env.SUBSCRIPTIONS_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
    min: 0,
    idle: process.env.SUBSCRIPTIONS_IDLE_CONNECION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
  }
  const replicationEnabled = process.env.SUBSCRIPTIONS_REPLICATION || process.env.STORAGE_REPLICATION
  if (replicationEnabled) {
    const replication = {
      read: [],
      write: parseConnectionString(url)
    }
    let i = 1
    while (true) {
      if (!global[`subscriptionsReadDatabaseURL${i}`] && !process.env[`SUBSCRIPTIONS_READ_DATABASE_URL${i}`] && !global[`readDatabaseURL${i}`] && !process.env[`READ_DATABASE_URL${i}`]) {
        break
      }
      replication.read.push(parseConnectionString(
        global[`subscriptionsReadDatabaseURL${i}`] || process.env[`SUBSCRIPTIONS_READ_DATABASE_URL${i}`] || global[`readDatabaseURL${i}`] || process.env[`READ_DATABASE_URL${i}`]
      ))
      i++
    }
    const sequelize = new Sequelize({
      dialect,
      dialectOptions,
      replication,
      pool,
      logging: (sql) => {
        return Log.info(sql)
      }
    })
    return sequelize
  }
  const sequelize = new Sequelize(url, {
    dialect,
    dialectOptions,
    pool,
    logging: (sql) => {
      return Log.info(sql)
    }
  })
  return sequelize
}

function parseConnectionString (url) {
  // dialect://username:password@host:port/database
  if (url.indexOf('://') > -1) {
    const urlParts = url.parse(url, true)
    const object = {}
    object.host = urlParts.hostname
    if (urlParts.pathname) {
      object.database = urlParts.pathname.replace(/^\//, '')
    }
    if (urlParts.port) {
      object.port = urlParts.port
    }
    if (urlParts.auth) {
      const authParts = urlParts.auth.split(':')
      object.username = authParts[0]
      if (authParts.length > 1) {
        object.password = authParts.slice(1).join(':')
      }
    }
    return object
  }
  // User Id=X;Password=X;Server=X;Database=X;Port=X
  const params = url.split(';')
  const rawParams = {}
  for (const param of params) {
    const parts = param.split('=')
    rawParams[parts[0]] = parts.slice(1).join('=')
  }
  const object = {}
  object.host = rawParams.Server || rawParams.server
  object.username = rawParams['User Id'] || rawParams['user id']
  object.password = rawParams.Password || rawParams.password
  object.database = rawParams.Database || rawParams.database
  object.port = rawParams.Port || rawParams.port
  return object
}
