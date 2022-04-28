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
      return setTimeout(wait, 1000)
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
    return setTimeout(wait, 1000)
  }
  return setTimeout(wait, 1000)
})

const TestStripeAccounts = module.exports = {
  createOwnerWithPlan: async (planData) => {
    const owner = await TestHelper.createOwner()
    await TestHelper.createProduct(owner, {
      publishedAt: 'true'
    })
    planData = planData || {}
    await TestHelper.createPlan(owner, {
      productid: owner.product.productid,
      publishedAt: 'true',
      trial_period_days: planData.trial_period_days !== undefined ? planData.trial_period_days : 0,
      amount: planData.amount !== undefined ? planData.amount : 1000,
      interval: planData.interval || 'month',
      usage_type: planData.usage_type || 'licensed'
    })
    return owner
  },
  createOwnerWithUnpublishedPlan: async (planData) => {
    const owner = await TestHelper.createOwner()
    const product = await TestHelper.createProduct(owner, {
      publishedAt: 'true'
    })
    planData = planData || {}
    await TestHelper.createPlan(owner, {
      productid: product.productid,
      publishedAt: 'true',
      unpublishedAt: 'true',
      trial_period_days: planData.trial_period_days !== undefined ? planData.trial_period_days : 0,
      amount: planData.amount !== undefined ? planData.amount : 1000,
      interval: planData.interval || 'month',
      usage_type: planData.usage_type || 'licensed'
    })
    return owner
  },
  createOwnerWithNotPublishedPlan: async (planData) => {
    const owner = await TestHelper.createOwner()
    const product = await TestHelper.createProduct(owner, {
      publishedAt: 'true'
    })
    planData = planData || {}
    await TestHelper.createPlan(owner, {
      productid: product.productid,
      trial_period_days: planData.trial_period_days !== undefined ? planData.trial_period_days : 0,
      amount: planData.amount !== undefined ? planData.amount : 1000,
      interval: planData.interval || 'month',
      usage_type: planData.usage_type || 'licensed'
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
      name: user.profile.firstName + ' ' + user.profile.lastName,
      address_line1: '285 Fulton St',
      address_line2: 'Apt 893',
      address_city: 'New York',
      address_state: 'NY',
      address_zip: '10007',
      address_country: 'US',
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
  createUserWithFreeSubscription: async (plan, user, withPaymentMethod) => {
    if (!user) {
      if (withPaymentMethod) {
        user = await TestStripeAccounts.createUserWithPaymentMethod(user)
      } else {
        user = await TestStripeAccounts.createUserWithoutPaymentMethod(user)
      }
    }
    await TestHelper.createSubscription(user, plan.planid)
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
  createUserWithFreeTrialSubscription: async (plan, user, withPaymentMethod) => {
    if (!user) {
      if (withPaymentMethod) {
        user = await TestStripeAccounts.createUserWithPaymentMethod(user)
      } else {
        user = await TestStripeAccounts.createUserWithoutPaymentMethod(user)
      }
    }
    await TestHelper.createSubscription(user, plan.planid)
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
  createUserWithPaidSubscription: async (plan, user) => {
    if (!user) {
      user = await TestStripeAccounts.createUserWithPaymentMethod(user)
    }
    await TestHelper.createSubscription(user, plan.planid)
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
    if (plan.stripeObject.usage_type === 'licensed') {
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
    if (plan.stripeObject.usage_type === 'licensed') {
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
