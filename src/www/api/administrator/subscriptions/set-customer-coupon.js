const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    if (!req.body || !req.body.couponid) {
      throw new Error('invalid-couponid')
    }
    const customer = await global.api.administrator.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    if (customer.stripeObject.discount && customer.stripeObject.discount.coupon && customer.stripeObject.discount.coupon.id) {
      throw new Error('invalid-customer')
    }
    req.query.couponid = req.body.couponid
    const coupon = await global.api.administrator.subscriptions.Coupon.get(req)
    if (!coupon) {
      throw new Error('invalid-couponid')
    }
    if (!coupon.publishedAt || coupon.unpublishedAt) {
      throw new Error('invalid-coupon')
    }
    const customerInfo = {
      coupon: req.body.couponid
    }
    const customerNow = await stripeCache.execute('customers', 'update', req.query.customerid, customerInfo, req.stripeKey)
    await subscriptions.Storage.Customer.update({
      stripeObject: customerNow,
      couponid: req.body.couponid
    }, {
      where: {
        customerid: req.query.customerid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.customerid)
    return global.api.administrator.subscriptions.Customer.get(req)
  }
}
