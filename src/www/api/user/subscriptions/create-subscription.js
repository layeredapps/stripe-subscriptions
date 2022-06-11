const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    if (!req.body || !req.body.priceids) {
      throw new Error('invalid-priceids')
    }
    if (!req.body || !req.body.quantities) {
      throw new Error('invalid-quantities')
    }
    const priceids = req.body.priceids.split(',')
    let metered = false
    for (const priceid of priceids) {
      req.query.priceid = priceid
      const price = await global.api.user.subscriptions.PublishedPrice.get(req)
      if (!price) {
        throw new Error('invalid-priceid')
      }
      if (price.unpublishedAt) {
        throw new Error('invalid-price')
      }
      if (price.stripeObject.recurring.usage_type === 'metered') {
        metered = true
      }
    }
    let quantities
    if (!metered) {
      quantities = req.body.quantities.split(',')
      for (const value of quantities) {
        try {
          const quantity = parseInt(value, 10)
          if (quantity < 1 || quantity.toString() !== value) {
            throw new Error('invalid-quantity')
          }
        } catch (error) {
          throw new Error('invalid-quantity')
        }
      }
      if (quantities.length !== priceids.length) {
        throw new Error('invalid-price-quantity-mismatch')
      }
    }
    if (req.body.couponid) {
      req.query.couponid = req.body.couponid
      const coupon = await global.api.user.subscriptions.PublishedCoupon.get(req)
      if (!coupon) {
        throw new Error('invalid-couponid')
      }
    }
    if (req.body.taxrateids) {
      const taxRates = req.body.taxrateids.split(',')
      for (const taxrateid of taxRates) {
        req.query.taxrateid = taxrateid
        const taxRate = await global.api.user.subscriptions.TaxRate.get(req)
        if (!taxRate) {
          throw new Error('invalid-taxrateid')
        }
        if (!taxRate.stripeObject.active) {
          throw new Error('invalid-tax-rate')
        }
      }
    }
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (customer.stripeObject.default_source) {
      req.body.paymentmethodid = customer.stripeObject.default_source
    } else if (customer.stripeObject.invoice_settings && customer.stripeObject.invoice_settings.default_payment_method) {
      req.body.paymentmethodid = customer.stripeObject.invoice_settings.default_payment_method
    }
    const subscriptionInfo = {
      customer: req.query.customerid,
      items: [],
      enable_incomplete_payments: true
    }
    for (let i = 0; i < priceids.length; i++) {
      subscriptionInfo.items.push({
        price: priceids[i],
        quantity: metered ? undefined : quantities[i]
      })
    }
    if (req.body.paymentmethodid) {
      subscriptionInfo.default_payment_method = req.body.paymentmethodid
    }
    if (req.body.trial_period_days) {
      subscriptionInfo.trial_period_days = req.body.trial_period_days
    }
    if (req.body.billing_cycle_anchor) {
      subscriptionInfo.billing_cycle_anchor = req.body.billing_cycle_anchor
    }
    if (req.body.couponid) {
      subscriptionInfo.coupon = req.body.couponid
    }
    if (req.body.taxrateids) {
      subscriptionInfo.default_tax_rates = req.body.taxrateids.split(',')
    }
    let subscription
    try {
      subscription = await stripeCache.execute('subscriptions', 'create', subscriptionInfo, req.stripeKey)
    } catch (error) {
      if (error.message === 'invalid-paymentmethod') {
        throw new Error('invalid-customer')
      }
    }
    if (!subscription) {
      throw new Error('unknown-error')
    }
    await subscriptions.Storage.Subscription.create({
      appid: req.appid || global.appid,
      subscriptionid: subscription.id,
      customerid: req.query.customerid,
      accountid: req.account.accountid,
      priceids,
      stripeObject: subscription
    })
    for (const item of subscription.items.data) {
      await subscriptions.Storage.SubscriptionItem.create({
        accountid: req.account.accountid,
        subscriptionitemid: item.id,
        customerid: req.query.customerid,
        appid: req.appid || global.appid,
        subscriptionid: subscription.id,
        stripeObject: item
      }) 
    }
    req.query.subscriptionid = subscription.id
    return global.api.user.subscriptions.Subscription.get(req)
  }
}
