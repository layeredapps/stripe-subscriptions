const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    if (!req.body || !req.body.planid) {
      throw new Error('invalid-planid')
    }
    if (req.body.quantity) {
      try {
        const quantity = parseInt(req.body.quantity, 10)
        if (quantity < 1 || quantity.toString() !== req.body.quantity) {
          throw new Error('invalid-quantity')
        }
      } catch (error) {
        throw new Error('invalid-quantity')
      }
    }
    req.query.planid = req.body.planid
    const plan = await global.api.user.subscriptions.PublishedPlan.get(req)
    if (!plan) {
      throw new Error('invalid-planid')
    }
    if (plan.unpublishedAt) {
      throw new Error('invalid-plan')
    }
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (plan.stripeObject.amount && !plan.stripeObject.trial_period_days && (!req.body.paymentmethodid || !req.body.paymentmethodid.length)) {
      if (customer.stripeObject.invoice_settings && customer.stripeObject.invoice_settings.default_payment_method) {
        req.body.paymentmethodid = customer.stripeObject.invoice_settings.default_payment_method
      }
    }
    // TODO: create an ENV toggle for allowing no payment info on trials
    if (plan.stripeObject.amount && !plan.stripeObject.trial_period_days) {
      if (!req.body.paymentmethodid || !req.body.paymentmethodid.length) {
        throw new Error('invalid-paymentmethodid')
      }
      req.query.paymentmethodid = req.body.paymentmethodid
      const paymentMethod = await global.api.user.subscriptions.PaymentMethod.get(req)
      if (!paymentMethod) {
        throw new Error('invalid-paymentmethodid')
      }
    }
    const subscriptionInfo = {
      customer: req.query.customerid,
      items: [{
        plan: req.body.planid
      }],
      enable_incomplete_payments: true
    }
    if (req.body.quantity && plan.stripeObject.usage_type === 'licensed') {
      subscriptionInfo.items[0].quantity = req.body.quantity
    }
    if (req.body.paymentmethodid) {
      subscriptionInfo.default_payment_method = req.body.paymentmethodid
    }
    if (plan.stripeObject.trial_period_days) {
      subscriptionInfo.trial_end = Math.floor(new Date().getTime() / 1000) + (plan.stripeObject.trial_period_days * 24 * 60 * 60)
    }
    const subscription = await stripeCache.execute('subscriptions', 'create', subscriptionInfo, req.stripeKey)
    if (!subscription) {
      throw new Error('unknown-error')
    }
    await subscriptions.Storage.Subscription.create({
      appid: req.appid || global.appid,
      subscriptionid: subscription.id,
      customerid: req.query.customerid,
      accountid: req.account.accountid,
      productid: plan.productid,
      planid: plan.planid,
      stripeObject: subscription
    })
    req.query.subscriptionid = subscription.id
    return global.api.user.subscriptions.Subscription.get(req)
  }
}
