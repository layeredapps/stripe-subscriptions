const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.body || !req.body.display_name) {
      throw new Error('invalid-display_name')
    }
    if (req.body.inclusive !== 'true' && req.body.inclusive !== 'false') {
      throw new Error('invalid-inclusive')
    }
    try {
      const percentage = parseFloat(req.body.percentage)
      if (!percentage || percentage < 0 | percentage > 100 || percentage.toString() !== req.body.percentage) {
        throw new Error('invalid-percentage')
      }
    } catch (error) {
      throw new Error('invalid-percentage')
    }
    if (req.body.active !== 'true' && req.body.active !== 'false') {
      throw new Error('invalid-active')
    }
    if (!req.body.country || !subscriptions.countryDivisions[req.body.country]) {
      throw new Error('invalid-country')
    }
    if (req.body.state && !req.body.country) {
      throw new Error('invalid-country')
    }
    if (req.body.state && subscriptions.countryDivisions[req.body.country].indexOf(req.body.state) === -1) {
      throw new Error('invalid-state')
    }
    if (req.body.tax_type &&
        req.body.tax_type !== 'sales_tax' &&
        req.body.tax_type !== 'vat' &&
        req.body.tax_type !== 'gst' &&
        req.body.tax_type !== 'hst' &&
        req.body.tax_type !== 'pst' &&
        req.body.tax_type !== 'qst' &&
        req.body.tax_type !== 'rst' &&
        req.body.tax_type !== 'jct') {
      throw new Error('invalid-tax_type')
    }
    const taxRateInfo = {
      display_name: req.body.display_name,
      inclusive: req.body.inclusive === 'true',
      percentage: req.body.percentage
    }
    const optionalFields = ['active', 'country', 'description', 'jurisdiction', 'state', 'tax_type']
    for (const field of optionalFields) {
      if (!req.body[field] || !req.body[field].length) {
        throw new Error(`invalid-${field}`)
      }
      taxRateInfo[field] = req.body[field]
    }
    const taxRate = await stripeCache.execute('taxRates', 'create', taxRateInfo, req.stripeKey)
    await subscriptions.Storage.TaxRate.create({
      appid: req.appid || global.appid,
      taxrateid: taxRate.id,
      stripeObject: taxRate
    })
    req.query = {}
    req.query.taxrateid = taxRate.id
    return global.api.administrator.subscriptions.TaxRate.get(req)
  }
}
