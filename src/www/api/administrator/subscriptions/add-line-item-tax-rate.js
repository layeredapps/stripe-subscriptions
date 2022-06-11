const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

// TODO: this is currently only partially-implemented
// to finish the UI and API for line item manipulation
// the administrator must create a draft invoice that
// is editable
module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.lineitemid) {
      throw new Error('invalid-lineitemid')
    }
    if (!req.body || !req.body.taxrateid) {
      throw new Error('invalid-taxrateid')
    }
    req.query.taxrateid = req.body.taxrateid
    const taxRate = await global.api.administrator.subscriptions.TaxRate.get(req)
    if (!taxRate.stripeObject.active) {
      throw new Error('invalid-tax-rate')
    }
    const invoiceItem = await stripeCache.execute('invoiceItems', 'update', req.query.lineitemid, {
      tax_rates: [req.body.taxrateid]
    }, req.stripeKey)
    const invoiceNow = await stripeCache.execute('invoices', 'retrieve', invoiceItem.invoice, req.stripeKey)
    await subscriptions.Storage.Invoice.update({
      stripeObject: invoiceNow
    }, {
      where: {
        subscriptionid: invoiceNow.id
      }
    })
    await dashboard.StorageCache.remove(invoiceNow.id)
    req.query.invoiceid = invoiceNow.id
    return global.api.administrator.subscriptions.Invoice.get(req)
  }
}
