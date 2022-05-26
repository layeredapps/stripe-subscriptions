const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.priceid) {
      throw new Error('invalid-priceid')
    }
    const price = await global.api.administrator.subscriptions.Price.get(req)
    if (!price) {
      throw new Error('invalid-priceid')
    }
    // TODO: there is currently no endpoint for deleting prices
    // await stripeCache.execute('prices', 'del', req.query.priceid, req.stripeKey)
    await subscriptions.Storage.Price.destroy({
      where: {
        priceid: req.query.priceid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
