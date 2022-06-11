const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.subscriptionitemid) {
      throw new Error('invalid-subscriptionitemid')
    }
    const subscriptionItem = await global.api.administrator.subscriptions.SubscriptionItem.get(req)
    if (!subscriptionItem) {
      throw new Error('invalid-subscriptionitemid')
    }
    req.query.subscriptionid = subscriptionItem.subscriptionid
    const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
    if (subscription.stripeObject.items.data.length === 1) {
      throw new Error('only-item')
    }
    await stripeCache.execute('subscriptionItems', 'del', req.query.subscriptionitemid, req.stripeKey)
    await subscriptions.Storage.SubscriptionItem.destroy({
      where: {
        subscriptionitemid: req.query.subscriptionitemid,
        appid: req.appid || global.appid
      }
    })
    const subscriptionNow = await stripeCache.execute('subscriptions', 'retrieve', req.query.subscriptionid, req.stripeKey)
    if (!subscriptionNow) {
      throw new Error('unknown-error')
    }
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow
    }, {
      where: {
        subscriptionid: req.query.subscriptionid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.subscriptionid)
    return true
  }
}
