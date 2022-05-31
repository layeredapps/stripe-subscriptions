const Log = require('@layeredapps/dashboard/src/log.js')('stripe-subscriptions')
const TestHelper = require('./test-helper.js')
const util = require('util')

const waitForWebhook = util.promisify(async (webhookType, matching, callback) => {
  Log.info('waitForWebhook', webhookType)
  async function wait () {
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 100)
    }
    for (const received of global.webhooks) {
      if (webhookType.indexOf(received.type) === -1) {
        continue
      }
      const match = await matching(received)
      if (match) {
        Log.info('waitForWebhook completed --', webhookType)
        return callback()
      }
    }
    return setTimeout(wait, 100)
  }
  return setTimeout(wait, 100)
})

const TestStripeAccounts = module.exports = {
  createOwnerWithPrice: async (priceData) => {
    const owner = await TestHelper.createOwner()
    await TestHelper.createProduct(owner, {
      publishedAt: 'true'
    })
    priceData = priceData || {}
    await TestHelper.createPrice(owner, {
      productid: owner.product.productid,
      publishedAt: 'true',
      unit_amount: priceData.unit_amount !== undefined ? priceData.unit_amount : 1000,
      recurring_interval: priceData.recurring_interval || 'month',
      recurring_usage_type: priceData.recurring_usage_type || 'licensed'
    })
    return owner
  },
  createOwnerWithUnpublishedPrice: async (priceData) => {
    const owner = await TestHelper.createOwner()
    const product = await TestHelper.createProduct(owner, {
      publishedAt: 'true'
    })
    priceData = priceData || {}
    await TestHelper.createPrice(owner, {
      productid: product.productid,
      publishedAt: 'true',
      unpublishedAt: 'true',
      unit_amount: priceData.unit_amount !== undefined ? priceData.unit_amount : 1000,
      recurring_interval: priceData.recurring_interval || 'month',
      recurring_usage_type: priceData.recurring_usage_type || 'licensed'
    })
    return owner
  },
  createOwnerWithNotPublishedPrice: async (priceData) => {
    const owner = await TestHelper.createOwner()
    const product = await TestHelper.createProduct(owner, {
      publishedAt: 'true'
    })
    priceData = priceData || {}
    await TestHelper.createPrice(owner, {
      productid: product.productid,
      unit_amount: priceData.unit_amount !== undefined ? priceData.unit_amount : 1000,
      recurring_interval: priceData.recurring_interval || 'month',
      recurring_usage_type: priceData.recurring_usage_type || 'licensed'
    })
    return owner
  },
  createUserWithPaymentMethod: async (user) => {
    user = await TestStripeAccounts.createUserWithoutPaymentMethod(user)
    await TestHelper.createPaymentMethod(user, {
      cvc: '111',
      number: '4111111111111111',
      exp_month: '1',
      exp_year: (new Date().getFullYear() + 1).toString().substring(2),
      name: user.profile.fullName,
      line1: '285 Fulton St',
      line2: 'Apt 893',
      city: 'New York',
      state: 'NY',
      postal_code: '10007',
      country: 'US',
      default: 'true'
    })
    await waitForWebhook('setup_intent.created', async (stripeEvent) => {
      if (stripeEvent.data.object.payment_method === user.paymentMethod.stripeObject.id) {
        user.setupIntent = await global.api.administrator.subscriptions.SetupIntent.get({
          query: {
            setupintentid: stripeEvent.data.object.id
          }
        })
        return true
      }
    })
    await waitForWebhook('customer.updated', (stripeEvent) => {
      return stripeEvent.data.object.id === user.customer.customerid
    })
    await waitForWebhook('payment_method.attached', (stripeEvent) => {
      return stripeEvent.data.object.customer === user.customer.customerid
    })
    await TestHelper.rotateWebhook()
    user.customer = await global.api.administrator.subscriptions.Customer.get({
      query: {
        customerid: user.customer.customerid
      }
    })
    return user
  },
  createUserWithoutPaymentMethod: async (user) => {
    user = user || await TestHelper.createUser()
    await TestHelper.createCustomer(user, {
      email: user.profile.contactEmail
    })
    user.customer = await global.api.administrator.subscriptions.Customer.get({
      query: {
        customerid: user.customer.customerid
      }
    })
    return user
  },
  createUserWithFreeSubscription: async (price, user, withPaymentMethod) => {
    if (!user) {
      if (withPaymentMethod) {
        user = await TestStripeAccounts.createUserWithPaymentMethod(user)
      } else {
        user = await TestStripeAccounts.createUserWithoutPaymentMethod(user)
      }
    }
    await TestHelper.createSubscription(user, [price.priceid])
    let invoiceid
    await waitForWebhook('invoice.created', (stripeEvent) => {
      if (stripeEvent.data.object.subscription === user.subscription.subscriptionid) {
        invoiceid = stripeEvent.data.object.id
        return true
      }
    })
    await waitForWebhook(['invoice.finalized', 'invoice.paid', 'invoice.payment_succeeded'], (stripeEvent) => {
      return stripeEvent.data.object.id === invoiceid
    })
    await TestHelper.rotateWebhook()
    user.subscription = await global.api.administrator.subscriptions.Subscription.get({
      query: {
        subscriptionid: user.subscription.subscriptionid
      }
    })
    user.invoice = await global.api.administrator.subscriptions.Invoice.get({
      query: {
        invoiceid
      }
    })
    user.customer = await global.api.administrator.subscriptions.Customer.get({
      query: {
        customerid: user.customer.customerid
      }
    })
    return user
  },
  createUserWithFreeTrialSubscription: async (price, user, withPaymentMethod) => {
    if (!user) {
      if (withPaymentMethod) {
        user = await TestStripeAccounts.createUserWithPaymentMethod(user)
      } else {
        user = await TestStripeAccounts.createUserWithoutPaymentMethod(user)
      }
    }
    await TestHelper.createSubscription(user, [price.priceid], {
      trial_period_days: '7'
    })
    let invoiceid
    await waitForWebhook('invoice.created', (stripeEvent) => {
      if (stripeEvent.data.object.subscription === user.subscription.subscriptionid) {
        invoiceid = stripeEvent.data.object.id
        return true
      }
    })
    await waitForWebhook(['invoice.finalized', 'invoice.paid', 'invoice.payment_succeeded'], (stripeEvent) => {
      return stripeEvent.data.object.id === invoiceid
    })
    await TestHelper.rotateWebhook()
    user.subscription = await global.api.administrator.subscriptions.Subscription.get({
      query: {
        subscriptionid: user.subscription.subscriptionid
      }
    })
    user.invoice = await global.api.administrator.subscriptions.Invoice.get({
      query: {
        invoiceid
      }
    })
    user.customer = await global.api.administrator.subscriptions.Customer.get({
      query: {
        customerid: user.customer.customerid
      }
    })
    return user
  },
  createUserWithPaidSubscription: async (price, user) => {
    if (!user) {
      user = await TestStripeAccounts.createUserWithPaymentMethod(user)
    }
    await TestHelper.createSubscription(user, [price.priceid])
    let invoiceid
    await waitForWebhook('invoice.created', (stripeEvent) => {
      if (stripeEvent.data.object.subscription === user.subscription.subscriptionid) {
        invoiceid = stripeEvent.data.object.id
        return true
      }
    })
    await waitForWebhook(['invoice.finalized', 'invoice.paid', 'invoice.payment_succeeded'], (stripeEvent) => {
      return stripeEvent.data.object.id === invoiceid
    })
    if (price.stripeObject.recurring.usage_type === 'licensed') {
      await waitForWebhook('charge.succeeded', (stripeEvent) => {
        return stripeEvent.data.object.invoice === invoiceid
      })
      await waitForWebhook('payment_intent.created', (stripeEvent) => {
        return stripeEvent.data.object.invoice === invoiceid
      })
    }
    await TestHelper.rotateWebhook()
    user.subscription = await global.api.administrator.subscriptions.Subscription.get({
      query: {
        subscriptionid: user.subscription.subscriptionid
      }
    })
    user.invoice = await global.api.administrator.subscriptions.Invoice.get({
      query: {
        invoiceid
      }
    })
    if (price.stripeObject.recurring.usage_type === 'licensed') {
      user.charge = await global.api.administrator.subscriptions.Charge.get({
        query: {
          chargeid: user.invoice.stripeObject.charge
        }
      })
    }
    user.customer = await global.api.administrator.subscriptions.Customer.get({
      query: {
        customerid: user.customer.customerid
      }
    })
    return user
  }
}
