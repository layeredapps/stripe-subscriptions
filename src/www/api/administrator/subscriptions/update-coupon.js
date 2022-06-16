const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
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
    if (!req.body.name || !req.body.name.length) {
      throw new Error('invalid-name')
    }
    const updateInfo = {
      name: req.body.name
    }
    const couponNow = await stripeCache.execute('coupons', 'update', req.query.couponid, updateInfo, req.stripeKey)
    await subscriptions.Storage.Coupon.update({
      stripeObject: couponNow
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
