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
      req.body.percentage = parseFloat(req.body.percentage)
      if (!req.body.percentage || req.body.percentage < 0 || req.body.percentage !== req.body.percentage.toString()) {
        throw new Error('invalid-percentage')
      }
    } catch (error) {
      throw new Error('invalid-percentage')
    }
    if (req.body.active && (req.body.active !== 'true' && req.body.active !== 'false')) {
      throw new Error('invalid-active')
    }
    if (!req.body.country || !subscriptions.countryDivisions[req.body.country]) {
      throw new Error('invalid-country')
    }
    if (req.body.state && !req.body.country) {
      throw new Error('invalid-country')
    }
    if (req.body.state && subscriptions.countryDivisions[req.body.country].indexOf(req.body.state) === -1) {
      throw new Error('invalid-jurisdiction')
    }
    const taxRateInfo = {
      display_name: req.body.display_name,
      inclusive: req.body.inclusive === 'true',
      percentage: req.body.percentage
    }
    const optionalFields = ['active', 'country', 'description', 'jurisdiction', 'state', 'tax_type']
    for (const field of optionalFields) {
      if (req.body[field] !== undefined) {
        taxRateInfo[field] = req.body[field]
      }
    }
    const taxRate = await stripeCache.execute('taxRates', 'create', taxRateInfo, req.stripeKey)
    await subscriptions.Storage.TaxRate.create({
      taxrateid: taxRate.id,
      stripeObject: taxRate
    })
    req.query.taxrateid = taxRate.id
    return global.api.administrator.subscriptions.TaxRate.get(req)
  }
}
