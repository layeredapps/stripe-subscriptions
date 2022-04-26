const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    let couponids
    if (req.query.all) {
      couponids = await subscriptions.Storage.Coupon.findAll({
        where,
        attributes: ['couponid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      couponids = await subscriptions.Storage.Coupon.findAll({
        where,
        attributes: ['couponid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!couponids || !couponids.length) {
      return null
    }
    const items = []
    for (const couponInfo of couponids) {
      req.query.couponid = couponInfo.dataValues.couponid
      const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
      items.push(coupon)
    }
    return items
  }
}
