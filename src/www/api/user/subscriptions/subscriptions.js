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
    } else {
      where = {
        accountid: req.query.accountid
      }
    }
    let subscriptionids
    if (req.query.all) {
      subscriptionids = await subscriptions.Storage.Subscription.findAll({
        where,
        attributes: ['subscriptionid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      subscriptionids = await subscriptions.Storage.Subscription.findAll({
        where,
        attributes: ['subscriptionid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!subscriptionids || !subscriptionids.length) {
      return null
    }
    const items = []
    for (const subscriptionInfo of subscriptionids) {
      req.query.subscriptionid = subscriptionInfo.dataValues.subscriptionid
      const subscription = await global.api.user.subscriptions.Subscription.get(req)
      items.push(subscription)
    }
    return items
  }
}
