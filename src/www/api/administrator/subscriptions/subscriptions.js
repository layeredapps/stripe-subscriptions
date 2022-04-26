const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.customerid) {
      const customer = await global.api.administrator.subscriptions.Customer.get(req)
      if (!customer) {
        throw new Error('invalid-customer')
      }
      where.customerid = req.query.customerid
    } else if (req.query.accountid) {
      const account = await global.api.administrator.Account.get(req)
      if (!account) {
        throw new Error('invalid-account')
      }
      where.accountid = req.query.accountid
    } else if (req.query.couponid) {
      const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
      if (!coupon) {
        throw new Error('invalid-couponid')
      }
      where.couponid = req.query.couponid
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
      const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
      items.push(subscription)
    }
    return items
  }
}
