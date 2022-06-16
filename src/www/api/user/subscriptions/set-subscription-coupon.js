const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if ((subscription.stripeObject.status !== 'active' && subscription.stripeObject.status !== 'trialing') || subscription.stripeObject.cancel_at_period_end) {
      throw new Error('invalid-subscription')
    }
    if (!req.body || !req.body.couponid) {
      throw new Error('invalid-couponid')
    }
    if (subscription.stripeObject.discount) {
      throw new Error('invalid-subscription')
    }
    req.query.couponid = req.body.couponid
    const coupon = await global.api.user.subscriptions.Coupon.get(req)
    if (!coupon) {
      throw new Error('invalid-couponid')
    }
    const subscriptionInfo = {
      coupon: req.body.couponid
    }
    let subscriptionNow
    try {
      subscriptionNow = await stripeCache.execute('subscriptions', 'update', req.query.subscriptionid, subscriptionInfo, req.stripeKey)
    } catch (error) {
      if (error.message === 'invalid-currency') {
        throw new Error('invalid-coupon')
      }
      throw error
    }
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
    return global.api.user.subscriptions.Subscription.get(req)
  }
}
