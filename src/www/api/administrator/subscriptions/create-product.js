const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.body || !req.body.name) {
      throw new Error('invalid-name')
    }
    if (global.minimumProductNameLength > req.body.name.length ||
      global.maximumProductNameLength < req.body.name.length) {
      throw new Error('invalid-product-name-length')
    }
    if (!req.body.statement_descriptor || !req.body.statement_descriptor.length) {
      throw new Error('invalid-statement_descriptor')
    }
    if (!req.body.unit_label || !req.body.unit_label.length) {
      throw new Error('invalid-unit_label')
    }
    if (!req.body.tax_code || !req.body.tax_code.length) {
      throw new Error('invalid-tax_code')
    }
    req.query = req.query || {}
    req.query.taxcodeid = req.body.tax_code
    try {
      await global.api.administrator.subscriptions.TaxCode.get(req)
    } catch (error) {
      throw new Error('invalid-tax_code')
    }
    const productInfo = {
      type: 'service',
      name: req.body.name,
      statement_descriptor: req.body.statement_descriptor,
      unit_label: req.body.unit_label,
      tax_code: req.body.tax_code
    }
    const product = await stripeCache.execute('products', 'create', productInfo, req.stripeKey)
    if (!product) {
      throw new Error()
    }
    await subscriptions.Storage.Product.create({
      appid: req.appid || global.appid,
      productid: product.id,
      publishedAt: req.body.publishedAt ? new Date() : undefined,
      stripeObject: product
    })
    req.query = req.query || {}
    req.query.productid = product.id
    return global.api.administrator.subscriptions.Product.get(req)
  }
}
