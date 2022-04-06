const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if ((subscription.stripeObject.status !== 'active' && subscription.stripeObject.status !== 'trialing') || subscription.stripeObject.cancel_at_period_end) {
      throw new Error('invalid-subscription')
    }
    if (!req.body || !req.body.planid) {
      throw new Error('invalid-planid')
    }
    if (subscription.planid === req.body.planid) {
      throw new Error('invalid-plan')
    }
    req.query.customerid = subscription.customerid
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    req.query.planid = req.body.planid
    const newPlan = await global.api.user.subscriptions.PublishedPlan.get(req)
    if (!newPlan.publishedAt || newPlan.unpublishedAt) {
      throw new Error('invalid-plan')
    }
    if (newPlan.stripeObject.amount) {
      if (!req.body.paymentmethodid || !req.body.paymentmethodid.length) {
        throw new Error('invalid-paymentmethodid')
      }
      req.query.paymentmethodid = req.body.paymentmethodid
      const paymentMethod = await global.api.user.subscriptions.PaymentMethod.get(req)
      if (!paymentMethod) {
        throw new Error('invalid-paymentmethodid')
      }
    }
    const updateInfo = {
      items: [{
        id: subscription.stripeObject.items.data[0].id,
        plan: req.body.planid
      }]
    }
    // const oldPlan = subscription.plan
    const subscriptionNow = await stripeCache.execute('subscriptions', 'update', req.query.subscriptionid, updateInfo, req.stripeKey)
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow,
      planid: req.body.planid
    }, {
      where: {
        subscriptionid: req.query.subscriptionid
      }
    })
    // if (newPlan.stripeObject.amount > oldplan.stripeObject.amount || newPlan.stripeObject.interval !== oldplan.stripeObject.interval) {
    //   const upcomingInvoice = await stripeCache.execute('invoices', 'create', {
    //     customer: customer.id,
    //     subscription: subscription.subscriptionid,
    //     metadata: {
    //       appid: req.appid,
    //       accountid: req.account.accountid
    //     }
    //   }, req.stripeKey)
    //   const upcomingInvoiceNow = await stripeCache.execute('invoices', 'pay', upcomingInvoice.id, {
    //     payment_method: req.body.paymentmethodid
    //   }, req.stripeKey)
    //   await stripeCache.update(upcomingInvoiceNow)
    // }
    await dashboard.StorageCache.remove(req.query.subscriptionid)
    return global.api.user.subscriptions.Subscription.get(req)
  }
}
