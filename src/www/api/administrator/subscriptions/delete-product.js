const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.productid) {
      throw new Error('invalid-productid')
    }
    const product = await global.api.administrator.subscriptions.Product.get(req)
    if (!product) {
      throw new Error('invalid-productid')
    }
    await stripeCache.execute('products', 'del', req.query.productid, req.stripeKey)
    await subscriptions.Storage.Plan.destroy({
      where: {
        productid: req.query.productid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
