const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if (!req.body || !req.body.quantity) {
      throw new Error('invalid-quantity')
    }
    if (!req.body.priceid) {
      throw new Error('invalid-priceid')
    }
    req.query.priceid = req.body.priceid
    const price = await global.api.administrator.subscriptions.Price.get(req)
    if (!price) {
      throw new Error('invalid-priceid')
    }
    if (!price.active) {
      throw new Error('invalid-price')
    }
    try {
      const quantity = parseInt(req.body.quantity, 10)
      if (quantity < 1 || quantity.toString() !== req.body.quantity) {
        throw new Error('invalid-quantity')
      }
    } catch (error) {
      throw new Error('invalid-quantity')
    }
    for (const item of subscription.stripeObject.items.data) {
      if (item.price.id === req.body.priceid) {
        throw new Error('duplicate-price')
      }
    }
    const updateInfo = {
      subscription: req.query.subscriptionid,
      price: price.priceid,
      quantity: req.body.quantity
    }
    await stripeCache.execute('subscriptionItems', 'create', updateInfo, req.stripeKey)
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
    return global.api.administrator.subscriptions.Subscription.get(req)
  }
}
