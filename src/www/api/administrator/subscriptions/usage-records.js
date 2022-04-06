const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let where
    if (req.query.customerid) {
      const customer = await global.api.administrator.subscriptions.Customer.get(req)
      if (!customer) {
        throw new Error('invalid-customerid')
      }
      where = {
        customerid: req.query.customerid
      }
    } else if (req.query.subscriptionid) {
      const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
      if (!subscription) {
        throw new Error('invalid-subscriptionid')
      }
      where = {
        subscriptionid: req.query.subscriptionid
      }
    } else if (req.query.accountid) {
      const account = await global.api.administrator.Account.get(req)
      if (!account) {
        throw new Error('invalid-accountid')
      }
      where = {
        accountid: req.query.accountid
      }
    }
    let usagerecordids
    if (req.query.all) {
      usagerecordids = await subscriptions.Storage.UsageRecord.findAll({
        where,
        attributes: ['usagerecordid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      usagerecordids = await subscriptions.Storage.UsageRecord.findAll({
        where,
        attributes: ['usagerecordid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!usagerecordids || !usagerecordids.length) {
      return null
    }
    const items = []
    for (const taxRateInfo of usagerecordids) {
      req.query.usagerecordid = taxRateInfo.dataValues.usagerecordid
      const usageRecord = await global.api.administrator.subscriptions.UsageRecord.get(req)
      items.push(usageRecord)
    }
    return items
  }
}
