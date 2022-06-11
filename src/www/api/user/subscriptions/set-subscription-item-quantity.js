const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionitemid) {
      throw new Error('invalid-subscriptionitemid')
    }
    const subscriptionItem = await global.api.user.subscriptions.SubscriptionItem.get(req)
    if (!subscriptionItem) {
      throw new Error('invalid-subscriptionitemid')
    }
    if (subscriptionItem.accountid !== req.account.accountid) {
      throw new Error('invalid-account')
    }
    if (!req.body || !req.body.quantity) {
      throw new Error('invalid-quantity')
    }
    try {
      const quantity = parseInt(req.body.quantity, 10)
      if (quantity < 1 || quantity.toString() !== req.body.quantity) {
        throw new Error('invalid-quantity')
      }
      if (subscriptionItem.stripeObject.quantity === quantity) {
        throw new Error('invalid-quantity')
      }
    } catch (error) {
      throw new Error('invalid-quantity')
    }
    const updateInfo = {
      items: [{
        id: req.query.subscriptionitemid,
        quantity: req.body.quantity
      }]
    }
    const subscriptionNow = await stripeCache.execute('subscriptions', 'update', subscriptionItem.subscriptionid, updateInfo, req.stripeKey)
    if (!subscriptionNow) {
      throw new Error('unknown-error')
    }
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow
    }, {
      where: {
        subscriptionid: subscriptionItem.subscriptionid,
        appid: req.appid || global.appid
      }
    })
    for (const item of subscriptionNow.items.data) {
      if (item.id !== req.query.subscriptionitemid) {
        continue
      }
      await subscriptions.Storage.SubscriptionItem.update({
        stripeObject: item
      }, {
        where: {
          subscriptionitemid: subscriptionItem.subscriptionitemid,
          appid: req.appid || global.appid
        }
      })
      break
    }
    await dashboard.StorageCache.remove(subscriptionItem.subscriptionid)
    await dashboard.StorageCache.remove(req.query.subscriptionitemid)
    return global.api.user.subscriptions.SubscriptionItem.get(req)
  }
}
