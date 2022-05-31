const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    const where = {
      appid: req.appid || global.appid
    }
    if (req.query.customerid) {
      const customer = await global.api.user.subscriptions.Customer.get(req)
      if (!customer) {
        throw new Error('invalid-customerid')
      }
      where.customerid = req.query.customerid
    } else if (req.query.subscriptionid) {
      const subscription = await global.api.user.subscriptions.Subscription.get(req)
      if (!subscription) {
        throw new Error('invalid-subscriptionid')
      }
      where.subscriptionid = req.query.subscriptionid
    } else {
      where.accountid = req.query.accountid
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
      const invoice = await global.api.user.subscriptions.Invoice.get(req)
      items.push(invoice)
    }
    return items
  }
}
