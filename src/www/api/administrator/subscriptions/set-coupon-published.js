const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.couponid) {
      throw new Error('invalid-couponid')
    }
    const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
    if (!coupon) {
      throw new Error('invalid-couponid')
    }
    if (coupon.publishedAt || coupon.unpublishedAt) {
      throw new Error('invalid-coupon')
    }
    await subscriptions.Storage.Coupon.update({
      publishedAt: new Date()
    }, {
      where: {
        couponid: req.query.couponid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.couponid)
    return global.api.administrator.subscriptions.Coupon.get(req)
  }
}
