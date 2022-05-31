const subscriptions = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.productid) {
      throw new Error('invalid-productid')
    }
    const product = await global.api.administrator.subscriptions.Product.get(req)
    if (!product) {
      throw new Error('invalid-productid')
    }
    // TODO: products with prices attached cannot currently be deleted
    // except by purging all data manually in the Stripe dashboard,
    // there is a GitHub issue here on the topic:
    // https://github.com/stripe/stripe-python/issues/658
    await subscriptions.Storage.Product.destroy({
      where: {
        productid: req.query.productid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
