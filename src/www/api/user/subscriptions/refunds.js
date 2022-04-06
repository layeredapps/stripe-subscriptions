const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    let where
    if (req.query.customerid) {
      const customer = await global.api.user.subscriptions.Customer.get(req)
      if (!customer) {
        throw new Error('invalid-customerid')
      }
      where = {
        customerid: req.query.customerid
      }
    } else if (req.query.subscriptionid) {
      const subscription = await global.api.user.subscriptions.Subscription.get(req)
      if (!subscription) {
        throw new Error('invalid-subscriptionid')
      }
      where = {
        subscriptionid: req.query.subscriptionid
      }
    } else {
      where = {
        accountid: req.query.accountid
      }
    }
    let refundids
    if (req.query.all) {
      refundids = await subscriptions.Storage.Refund.findAll({
        where,
        attributes: ['refundid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      refundids = await subscriptions.Storage.Refund.findAll({
        where,
        attributes: ['refundid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!refundids || !refundids.length) {
      return null
    }
    const items = []
    for (const refundInfo of refundids) {
      req.query.refundid = refundInfo.dataValues.refundid
      const item = await global.api.user.subscriptions.Refund.get(req)
      items.push(item)
    }
    return items
  }
}
