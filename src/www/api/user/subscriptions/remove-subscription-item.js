const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if (!req.body.itemid) {
      throw new Error('invalid-itemid')
    }
    let existingItem
    for (const item of subscription.stripeObject.items.data) {
      if (item.id === req.body.itemid) {
        existingItem = item
        break
      }
    }
    if (!existingItem) {
      throw new Error('invalid-itemid')
    }
    const updateInfo = {
      items: [{
        id: req.body.itemid,
        quantity: 0
      }]
    }
    const subscriptionNow = await stripeCache.execute('subscriptions', 'update', req.query.subscriptionid, updateInfo, req.stripeKey)
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
    return global.api.user.subscriptions.Subscription.get(req)
  }
}
