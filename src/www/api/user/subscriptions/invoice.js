const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.invoiceid) {
      throw new Error('invalid-invoiceid')
    }
    let invoice = await dashboard.StorageCache.get(req.query.invoiceid)
    if (!invoice) {
      const invoiceInfo = await subscriptions.Storage.Invoice.findOne({
        where: {
          invoiceid: req.query.invoiceid,
          appid: req.appid || global.appid
        }
      })
      if (!invoiceInfo) {
        throw new Error('invalid-invoiceid')
      }
      if (invoiceInfo.dataValues.accountid !== req.account.accountid) {
        throw new Error('invalid-account')
      }
      invoice = {}
      for (const field of invoiceInfo._options.attributes) {
        invoice[field] = invoiceInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.invoiceid, invoice)
    }
    return invoice
  }
}
