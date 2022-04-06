const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.couponid) {
      throw new Error('invalid-couponid')
    }
    let coupon = await dashboard.StorageCache.get(req.query.couponid)
    if (!coupon) {
      const couponInfo = await subscriptions.Storage.Coupon.findOne({
        where: {
          couponid: req.query.couponid
        }
      })
      if (!couponInfo) {
        throw new Error('invalid-couponid')
      }
      coupon = {}
      for (const field of couponInfo._options.attributes) {
        coupon[field] = couponInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.couponid, coupon)
    }
    return coupon
  }
}
