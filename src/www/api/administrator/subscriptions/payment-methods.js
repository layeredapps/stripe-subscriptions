const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let paymentmethodids
    if (req.query.all) {
      paymentmethodids = await subscriptions.Storage.PaymentMethod.findAll({
        attributes: ['paymentmethodid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      paymentmethodids = await subscriptions.Storage.PaymentMethod.findAll({
        attributes: ['paymentmethodid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!paymentmethodids || !paymentmethodids.length) {
      return null
    }
    const items = []
    for (const paymentmethodInfo of paymentmethodids) {
      req.query.paymentmethodid = paymentmethodInfo.dataValues.paymentmethodid
      const paymentmethod = await global.api.administrator.subscriptions.PaymentMethod.get(req)
      items.push(paymentmethod)
    }
    return items
  }
}
