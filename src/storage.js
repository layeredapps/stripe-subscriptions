const { Model, DataTypes } = require('sequelize')
const metrics = require('@layeredapps/dashboard/src/metrics.js')

module.exports = async () => {
  let storage, dateType
  const prefixedStorage = process.env.SUBSCRIPTIONS_STORAGE || process.env.STORAGE
  switch (prefixedStorage) {
    case 'postgresql':
    case 'postgres':
      storage = require('./storage-postgresql.js')
      dateType = DataTypes.DATE
      break
    case 'mariadb':
      storage = require('./storage-mariadb.js')
      dateType = DataTypes.DATE(6)
      break
    case 'mysql':
      storage = require('./storage-mysql.js')
      dateType = DataTypes.DATE(6)
      break
    case 'db2':
      storage = require('./storage-db2.js')
      dateType = DataTypes.DATE
      break
    case 'mssql':
      storage = require('./storage-mssql.js')
      dateType = DataTypes.DATE
      break
    case 'sqlite':
    default:
      storage = require('./storage-sqlite.js')
      dateType = DataTypes.DATE
      break
  }
  const sequelize = await storage()
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
  class Plan extends Model {}
  Plan.init({
    planid: {
      type: DataTypes.STRING(64),
      primaryKey: true,
      allowNull: false
    },
    object: {
      type: DataTypes.VIRTUAL,
      get () {
        return 'plan'
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
    modelName: 'plan'
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
    planid: DataTypes.STRING(64),
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
    planid: DataTypes.STRING(64),
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
    productid: DataTypes.STRING(64),
    planid: DataTypes.STRING(64),
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
  await sequelize.sync({ force: true, alter: true })
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
  Plan.afterCreate(async (object) => {
    if (global.disableMetrics) {
      return
    }
    await metrics.aggregate(object.dataValues.appid, 'plan-created', new Date())
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
        await Charge.destroy({ where: {} })
        await Coupon.destroy({ where: {} })
        await Customer.destroy({ where: {} })
        await Dispute.destroy({ where: {} })
        await Invoice.destroy({ where: {} })
        await PaymentIntent.destroy({ where: {} })
        await PaymentMethod.destroy({ where: {} })
        await Payout.destroy({ where: {} })
        await Plan.destroy({ where: {} })
        await Product.destroy({ where: {} })
        await Refund.destroy({ where: {} })
        await SetupIntent.destroy({ where: {} })
        await Subscription.destroy({ where: {} })
        await TaxRate.destroy({ where: {} })
        await UsageRecord.destroy({ where: {} })
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
    Plan,
    Product,
    Refund,
    SetupIntent,
    Subscription,
    TaxRate,
    UsageRecord
  }
}
