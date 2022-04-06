const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {

  patch: async (req) => {
    if (!req.query || !req.query.invoiceid) {
      throw new Error('invalid-invoiceid')
    }
    const invoice = await global.api.administrator.subscriptions.Invoice.get(req)
    if (!invoice) {
      throw new Error('invalid-invoiceid')
    }
    if (invoice.stripeObject.status !== 'open' && invoice.stripeObject.status !== 'draft') {
      throw new Error('invalid-invoice')
    }
    const invoiceNow = await stripeCache.execute('invoices', 'markUncollectible', req.query.invoiceid, req.stripeKey)
    await subscriptions.Storage.Invoice.update({
      stripeObject: invoiceNow
    }, {
      where: {
        invoiceid: req.query.invoiceid
      }
    })
    await dashboard.StorageCache.remove(req.query.invoiceid)
    return global.api.administrator.subscriptions.Invoice.get(req)
  }
}
