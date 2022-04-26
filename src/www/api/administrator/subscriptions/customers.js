const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.couponid) {
      const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
      if (!coupon) {
        throw new Error('invalid-couponid')
      }
      where.couponid = req.query.couponid
    }
    let customerids
    if (req.query.all) {
      customerids = await subscriptions.Storage.Customer.findAll({
        attributes: ['customerid'],
        order: [
          ['createdAt', 'DESC']
        ],
        where
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      customerids = await subscriptions.Storage.Customer.findAll({
        attributes: ['customerid'],
        offset,
        limit,
        where,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!customerids || !customerids.length) {
      return null
    }
    const items = []
    for (const customerInfo of customerids) {
      req.query.customerid = customerInfo.dataValues.customerid
      const customer = await global.api.administrator.subscriptions.Customer.get(req)
      items.push(customer)
    }
    return items
  }
}
