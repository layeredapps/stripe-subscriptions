const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let where
    if (req.query.customerid) {
      where = {
        customerid: req.query.customerid
      }
    } else if (req.query.accountid) {
      where = {
        accountid: req.query.accountid
      }
    } else if (req.query.subscriptionid) {
      where = {
        subscriptionid: req.query.subscriptionid
      }
    }
    let invoiceids
    if (req.query.all) {
      invoiceids = await subscriptions.Storage.Invoice.findAll({
        where,
        attributes: ['invoiceid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      invoiceids = await subscriptions.Storage.Invoice.findAll({
        where,
        attributes: ['invoiceid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!invoiceids || !invoiceids.length) {
      return null
    }
    const items = []
    for (const invoiceInfo of invoiceids) {
      req.query.invoiceid = invoiceInfo.dataValues.invoiceid
      const invoice = await global.api.administrator.subscriptions.Invoice.get(req)
      items.push(invoice)
    }
    return items
  }
}
