const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.couponid) {
      throw new Error('invalid-couponid')
    }
    const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
    if (!coupon) {
      throw new Error('invalid-couponid')
    }
    await stripeCache.execute('coupons', 'del', req.query.couponid, req.stripeKey)
    await subscriptions.Storage.Coupon.destroy({
      where: {
        couponid: req.query.couponid
      }
    })
    return true
  }
}
