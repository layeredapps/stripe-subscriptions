const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    if (!req.body || !req.body.couponid) {
      throw new Error('invalid-couponid')
    }
    const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if (subscription.stripeObject.discount && subscription.stripeObject.discount.coupon && subscription.stripeObject.discount.coupon.id) {
      throw new Error('invalid-subscription')
    }
    if ((subscription.stripeObject.status !== 'active' && subscription.stripeObject.status !== 'trialing') || subscription.stripeObject.cancel_at_period_end) {
      throw new Error('invalid-subscription')
    }
    req.query.couponid = req.body.couponid
    const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
    if (!coupon) {
      throw new Error('invalid-couponid')
    }
    if (!coupon.publishedAt || coupon.unpublishedAt) {
      throw new Error('invalid-coupon')
    }
    const subscriptionInfo = {
      coupon: req.body.couponid
    }
    const subscriptionNow = await stripeCache.execute('subscriptions', 'update', req.query.subscriptionid, subscriptionInfo, req.stripeKey)
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow,
      couponid: req.body.couponid
    }, {
      where: {
        subscriptionid: req.query.subscriptionid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.subscriptionid)
    return global.api.administrator.subscriptions.Subscription.get(req)
  }
}
