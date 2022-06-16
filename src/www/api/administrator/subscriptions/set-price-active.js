const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.priceid) {
      throw new Error('invalid-priceid')
    }
    const price = await global.api.administrator.subscriptions.Price.get(req)
    if (!price) {
      throw new Error('invalid-priceid')
    }
    if (price.stripeObject.active) {
      throw new Error('invalid-price')
    }
    const updateInfo = {
      active: true
    }
    const priceNow = await stripeCache.execute('prices', 'update', req.query.priceid, updateInfo, req.stripeKey)
    await subscriptions.Storage.Price.update({
      stripeObject: priceNow,
      active: priceNow.active
    }, {
      where: {
        priceid: req.query.priceid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.priceid)
    return global.api.administrator.subscriptions.Price.get(req)
  }
}
