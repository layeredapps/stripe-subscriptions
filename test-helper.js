/* eslint-env mocha */
global.appid = global.appid || 'tests'
global.language = global.language || 'en'
global.applicationPath = global.applicationPath || __dirname
global.stripeAPIVersion = '2020-03-02'
global.maximumStripeRetries = 0
global.testConfiguration = global.testConfiguration || {}
global.testConfiguration.requireSubscription = false
global.testConfiguration.requirePayment = false
global.testConfiguration.requirePaymentConfirmation = false
global.testConfiguration.stripeJS = false
global.testConfiguration.startSubscriptionPath = '/account/subscriptions/start-subscription'
global.testConfiguration.subscriptionRefundPeriod = 7 * 24 * 60 * 60
global.testConfiguration.minimumCouponLength = 1
global.testConfiguration.maximumCouponLength = 100
global.testConfiguration.minimumPlanIDLength = 1
global.testConfiguration.maximumPlanIDLength = 100
global.testConfiguration.minimumProductNameLength = 1
global.testConfiguration.maximumProductNameLength = 100
global.testConfiguration.stripeKey = process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
global.testConfiguration.stripePublishableKey = process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
global.testConfiguration.subscriptionWebhookEndPointSecret = process.env.SUBSCRIPTIONS_WEBHOOK_SECRET || false

const enabledEvents = [
  'setup_intent.canceled',
  'setup_intent.created',
  'setup_intent.setup_failed',
  'setup_intent.succeeded',
  // 'sigma.scheduled_query_run.created',
  // 'review.closed',
  // 'review.opened',
  // 'sku.created',
  // 'sku.deleted',
  // 'sku.updated',
  'source.canceled',
  'source.chargeable',
  'source.failed',
  'source.mandate_notification',
  'source.refund_attributes_required',
  'source.transaction.created',
  'source.transaction.updated',
  // 'tax_rate.created',
  // 'tax_rate.updated',
  // 'topup.canceled',
  // 'topup.created',
  // 'topup.failed',
  // 'topup.reversed',
  // 'topup.succeeded',
  // 'transfer.created',
  // 'transfer.failed',
  // 'transfer.paid',
  // 'transfer.reversed',
  // 'transfer.updated',
  // 'reporting.report_run.failed',
  // 'reporting.report_run.succeeded',
  // 'reporting.report_type.updated',
  // 'product.created',
  // 'product.deleted',
  // 'product.updated',
  // 'price.created',
  // 'price.deleted',
  // 'price.updated',
  // 'plan.created',
  // 'plan.deleted',
  // 'plan.updated',
  // 'order_return.created',
  'payment_intent.amount_capturable_updated',
  'payment_intent.canceled',
  'payment_intent.created',
  'payment_intent.payment_failed',
  'payment_intent.processing',
  'payment_intent.succeeded',
  // 'order.payment_succeeded',
  'payment_method.attached',
  'payment_method.card_automatically_updated',
  'payment_method.detached',
  'payment_method.updated',
  // 'payout.canceled',
  // 'payout.created',
  // 'payout.failed',
  // 'payout.paid',
  // 'payout.updated',
  // 'mandate.updated',
  // 'person.created',
  // 'person.deleted',
  // 'person.updated',
  // 'issuing_card.created',
  // 'issuing_card.updated',
  // 'order.created',
  // 'order.payment_failed',
  // 'order.updated',
  // 'issuing_dispute.created',
  // 'issuing_dispute.funds_reinstated',
  // 'issuing_dispute.updated',
  // 'issuing_transaction.created',
  // 'issuing_transaction.updated',
  // 'issuing_authorization.created',
  // 'issuing_authorization.request',
  // 'issuing_authorization.updated',
  // 'file.created',
  // 'credit_note.created',
  // 'credit_note.updated',
  // 'credit_note.voided',
  // 'issuing_cardholder.created',
  // 'issuing_cardholder.updated',
  // 'invoiceitem.created',
  // 'invoiceitem.deleted',
  // 'invoiceitem.updated',
  'invoice.created',
  // 'invoice.deleted',
  'invoice.finalized',
  'invoice.marked_uncollectible',
  'invoice.paid',
  'invoice.payment_action_required',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
  'invoice.sent',
  'invoice.upcoming',
  'invoice.updated',
  'invoice.voided',
  // 'coupon.created',
  // 'coupon.deleted',
  // 'coupon.updated',
  // 'checkout.session.async_payment_failed',
  // 'checkout.session.async_payment_succeeded',
  // 'checkout.session.completed',
  // 'customer.created',
  // 'customer.deleted',
  'customer.updated',
  'customer.discount.created',
  // 'customer.discount.deleted',
  'customer.discount.updated',
  // 'customer.source.created',
  // 'customer.source.deleted',
  'customer.source.expiring',
  'customer.source.updated',
  // 'customer.subscription.created',
  // 'customer.subscription.deleted',
  'customer.subscription.pending_update_applied',
  'customer.subscription.pending_update_expired',
  'customer.subscription.trial_will_end',
  'customer.subscription.updated',
  // 'customer.tax_id.created',
  // 'customer.tax_id.deleted',
  // 'customer.tax_id.updated',
  // 'account.external_account.deleted',
  'charge.captured',
  'charge.expired',
  'charge.failed',
  'charge.pending',
  'charge.refunded',
  'charge.succeeded',
  'charge.updated',
  'charge.dispute.closed',
  'charge.dispute.created',
  'charge.dispute.funds_reinstated',
  'charge.dispute.funds_withdrawn',
  'charge.dispute.updated',
  'charge.refund.updated'
  // 'capability.updated',
  // 'balance.available',
  // 'account.updated',
  // 'account.external_account.created',
  // 'account.external_account.updated',
  // 'subscription_schedule.aborted',
  // 'subscription_schedule.canceled',
  // 'subscription_schedule.completed',
  // 'subscription_schedule.created',
  // 'subscription_schedule.expiring',
  // 'subscription_schedule.released',
  // 'subscription_schedule.updated'
]

const util = require('util')
const TestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestHelperPuppeteer = require('@layeredapps/dashboard/test-helper-puppeteer.js')
const Log = require('@layeredapps/dashboard/src/log.js')('test-helper-stripe-subscriptions')
const ngrok = require('ngrok')
const packageJSON = require('./package.json')
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-subscriptions (test suite)',
    url: 'https://github.com/layeredapps/stripe-subscriptions'
  }
})

const stripeKey = {
  apiKey: process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
}
const wait = util.promisify((time, callback) => {
  if (time && !callback) {
    callback = time
    time = 100
  }
  return setTimeout(callback, time)
})

const waitForWebhook = util.promisify(async (webhookType, matching, callback) => {
  Log.info('waitForWebhook', webhookType)
  if (!webhook) {
    return callback()
  }
  async function wait () {
    if (global.testEnded) {
      return
    }
    if (!global.webhooks || !global.webhooks.length) {
      return setTimeout(wait, 10)
    }
    for (const received of global.webhooks) {
      if (received.type !== webhookType) {
        continue
      }
      const match = await matching(received)
      if (match) {
        return callback()
      }
    }
    return setTimeout(wait, 10)
  }
  return setTimeout(wait, 10)
})

module.exports = {
  cancelSubscription,
  createAmountOwed,
  createPaymentMethod,
  createPaymentIntent,
  createSetupIntent,
  createCoupon,
  createCustomer,
  createCustomerDiscount,
  createPayout,
  createPlan,
  createProduct,
  createRefund,
  createUsageRecord,
  changeSubscription,
  changeSubscriptionQuantity,
  createSubscription,
  createSubscriptionDiscount,
  deleteCustomerDiscount,
  deleteOldWebhooks,
  deleteSubscription,
  deleteSubscriptionDiscount,
  denyRefund,
  flagCharge,
  forgiveInvoice,
  setPlanPublished,
  setPlanUnpublished,
  setProductPublished,
  setProductUnpublished,
  setCouponPublished,
  setCouponUnpublished,
  toggleRefunds,
  toggleOverdueInvoiceThreshold,
  requestRefund,
  rotateWebhook,
  waitForWebhook,
  setupWebhook,
  setupBefore,
  setupBeforeEach
}

for (const x in TestHelper) {
  module.exports[x] = module.exports[x] || TestHelper[x]
}

module.exports.wait = wait
const createRequest = module.exports.createRequest = (rawURL) => {
  const req = TestHelper.createRequest(rawURL)
  req.stripeKey = stripeKey
  return req
}

let webhook, subscriptions

// direct webhook access is set up before the tests a single time
async function setupBefore () {
  Log.info('setupBefore')
  subscriptions = require('./index.js')
  await subscriptions.setup()
  await deleteOldWebhooks(true)
  await setupWebhook()
  const helperRoutes = require('./test-helper-routes.js')
  global.sitemap['/api/create-fake-payout'] = helperRoutes.createFakePayout
  global.sitemap['/api/fake-amount-owed'] = helperRoutes.fakeAmountOwed
  global.sitemap['/api/toggle-refunds'] = helperRoutes.toggleRefunds
  global.sitemap['/api/toggle-overdue-invoice-threshold'] = helperRoutes.toggleOverdueInvoiceThreshold
}

async function setupBeforeEach () {
  Log.info('setupBeforeEach')
  const bindStripeKey = require.resolve('./src/server/bind-stripe-key.js')
  if (global.packageJSON.dashboard.serverFilePaths.indexOf(bindStripeKey) === -1) {
    global.packageJSON.dashboard.serverFilePaths.push(bindStripeKey)
    global.packageJSON.dashboard.server.push(require(bindStripeKey))
  }
  const bindCountry = require.resolve('@layeredapps/maxmind-geoip/src/server/bind-country.js')
  if (global.packageJSON.dashboard.serverFilePaths.indexOf(bindCountry) === -1) {
    global.packageJSON.dashboard.serverFilePaths.push(bindCountry)
    global.packageJSON.dashboard.server.push(require(bindCountry))
  }
  global.packageJSON.dashboard.contentFilePaths.push(
    require.resolve('./src/content/embed-stripe-element-style.js')
  )
  global.packageJSON.dashboard.content.push(
    require('./src/content/embed-stripe-element-style.js')
  )
  await subscriptions.Storage.flush()
  await deleteOldData()
  if (!global.webhooks || global.webhooks.length) {
    await rotateWebhook(true)
    global.webhooks = []
  }
}

let webhookRotation = 0

async function rotateWebhook (remake) {
  Log.info('rotateWebhook', remake)
  if (!global.webhooks) {
    global.webhooks = []
    return setupWebhook()
  } else if (global.webhooks.length) {
    webhookRotation += global.webhooks.length
    if (remake || webhookRotation >= 10) {
      webhookRotation = 0
      return setupWebhook()
    }
  }
}

async function setupWebhook () {
  Log.info('setupWebhook')
  webhook = null
  while (!webhook) {
    try {
      await deleteOldWebhooks()
      await ngrok.kill()
      const tunnel = await ngrok.connect({
        port: global.port,
        // auth: process.env.NGROK_AUTH,
        onLogEvent: Log.info
      })
      webhook = await stripe.webhookEndpoints.create({
        url: `${tunnel}/webhooks/subscriptions/index-subscription-data`,
        enabled_events: enabledEvents
      }, stripeKey)
      global.subscriptionWebhookEndPointSecret = webhook.secret
      global.testConfiguration.subscriptionWebhookEndPointSecret = webhook.secret
    } catch (error) {
    }
    if (!webhook) {
      await wait(100)
    }
  }
}

before(deleteOldData)
before(setupBefore)
beforeEach(setupBeforeEach)

afterEach(async () => {
  Log.info('afterEach')
  await subscriptions.Storage.flush()
  await deleteOldData()
  if (global.webhooks.length) {
    await rotateWebhook()
  }
})

after(async () => {
  Log.info('after')
  await deleteOldData()
  await deleteOldWebhooks()
  await ngrok.kill()
  await subscriptions.Storage.flush()
  await TestHelperPuppeteer.close()
})

async function deleteOldWebhooks () {
  Log.info('deleteOldWebhooks')
  webhook = null
  try {
    const webhooks = await stripe.webhookEndpoints.list({ limit: 100 }, stripeKey)
    if (webhooks && webhooks.data && webhooks.data.length) {
      for (const webhook of webhooks.data) {
        if (webhook === 0) {
          continue
        }
        await stripe.webhookEndpoints.del(webhook.id, stripeKey)
      }
    }
  } catch (error) {
  }
}

async function deleteOldData () {
  Log.info('deleteOldData')
  for (const field of ['subscriptions', 'customers', 'plans', 'products', 'coupons']) {
    try {
      const objects = await stripe[field].list({ limit: 100 }, stripeKey)
      if (objects && objects.data && objects.data.length) {
        for (const object of objects.data) {
          try {
            await stripe[field].del(object.id, stripeKey)
          } catch (error) {
            Log.error('delete old data item error', object.id, error)
          }
        }
      }
    } catch (error) {
      Log.error('delete old data list error', field, error)
    }
  }
}

let productNumber = 0
async function createProduct (administrator, properties) {
  Log.info('createProduct', administrator, properties)
  productNumber++
  const req = createRequest('/api/administrator/subscriptions/create-product')
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    name: `product${productNumber}`,
    statement_descriptor: `product${productNumber} description`,
    unit_label: 'thing'
  }
  if (properties) {
    for (const property in properties) {
      req.body[property] = properties[property].toString()
    }
  }
  let product = await req.post()
  if (properties && properties.unpublishedAt) {
    const req2 = createRequest(`/api/administrator/subscriptions/set-product-unpublished?productid=${product.productid}`)
    req2.session = req.session
    req2.account = req.account
    product = await req2.patch(req2)
  }
  administrator.product = product
  return product
}

let planNumber = 0
async function createPlan (administrator, properties) {
  Log.info('createPlan', administrator, properties)
  planNumber++
  const req = createRequest('/api/administrator/subscriptions/create-plan')
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    planid: `plan${planNumber}`,
    currency: 'USD',
    interval: 'month',
    interval_count: '1',
    amount: '0'
  }
  if (properties) {
    for (const property in properties) {
      req.body[property] = properties[property].toString()
    }
  }
  let plan = await req.post()
  if (properties && properties.unpublishedAt) {
    const req2 = createRequest(`/api/administrator/subscriptions/set-plan-unpublished?planid=${plan.planid}`)
    req2.session = req.session
    req2.account = req.account
    plan = await req2.patch(req2)
  }
  administrator.plan = plan
  return plan
}

let couponNumber = 0
let percentOff = 0
async function createCoupon (administrator, properties) {
  Log.info('createCoupon', administrator, properties)
  couponNumber++
  const req = createRequest('/api/administrator/subscriptions/create-coupon')
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    couponid: `COUPON${couponNumber}`
  }
  if (properties) {
    for (const property in properties) {
      req.body[property] = properties[property].toString()
    }
  }
  if (!req.body.percent_off && !req.body.amount_off) {
    percentOff++
    if (percentOff === 100) {
      percentOff = 1
    }
    if (Math.random() < 0.5) {
      req.body.percent_off = percentOff.toString()
    } else {
      req.body.amount_off = percentOff.toString()
      req.body.currency = 'USD'
    }
  }
  if (Math.random() < 0.5) {
    req.body.max_redemptions = Math.ceil(100 + (Math.random() * 100)).toString()
  }
  if (!req.body.duration) {
    if (Math.random() < 0.5) {
      req.body.duration = 'once'
    } else {
      req.body.duration = 'repeating'
      req.body.duration_in_months = (3 + Math.ceil(Math.random() * 6)).toString()
    }
  }
  let coupon = await req.post()
  if (properties && properties.unpublishedAt) {
    const req2 = createRequest(`/api/administrator/subscriptions/set-coupon-unpublished?couponid=${coupon.couponid}`)
    req2.session = req.session
    req2.account = req.account
    coupon = await req2.patch(req2)
  }
  administrator.coupon = coupon
  return coupon
}

async function createRefund (administrator, chargeid) {
  Log.info('createRefund', administrator, chargeid)
  const req = createRequest(`/api/administrator/subscriptions/charge?chargeid=${chargeid}`)
  req.session = administrator.session
  req.account = administrator.account
  const charge = await req.get()
  const req2 = createRequest(`/api/administrator/subscriptions/create-refund?chargeid=${charge.chargeid}`)
  req2.session = req.session
  req2.account = req.account
  req2.body = {
    chargeid: charge.chargeid,
    amount: charge.stripeObject.amount - (charge.stripeObject.amount_refunded || 0),
    reason: 'requested_by_customer'
  }
  const refund = await req2.post(req2)
  await waitForWebhook('charge.refunded', (stripeEvent) => {
    return stripeEvent.data.object.id === chargeid
  })
  administrator.refund = refund
  return administrator.refund
}

async function createSubscriptionDiscount (administrator, subscription, coupon) {
  Log.info('createSubscriptionDiscount', administrator, subscription, coupon)
  const req = createRequest(`/api/administrator/subscriptions/set-subscription-coupon?subscriptionid=${subscription.subscriptionid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    couponid: coupon.couponid
  }
  const subscriptionNow = await req.patch()
  await waitForWebhook('customer.discount.created', (stripeEvent) => {
    return stripeEvent.data.object.customer === subscription.stripeObject.customer.customerid ||
           stripeEvent.data.object.customer === subscription.stripeObject.customer
  })
  await waitForWebhook('customer.subscription.updated', (stripeEvent) => {
    return stripeEvent.data.object.id === subscription.subscriptionid
  })
  return subscriptionNow
}

async function deleteSubscriptionDiscount (administrator, subscription, coupon) {
  Log.info('deleteSubscriptionDiscount', administrator, subscription, coupon)
  const req = createRequest(`/api/administrator/subscriptions/reset-subscription-coupon?subscriptionid=${subscription.subscriptionid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    couponid: coupon.couponid
  }
  const subscriptionNow = await req.patch()
  return subscriptionNow
}

async function createCustomerDiscount (administrator, customer, coupon) {
  Log.info('createCustomerDiscount', administrator, customer, coupon)
  const req = createRequest(`/api/administrator/subscriptions/set-customer-coupon?customerid=${customer.customerid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    couponid: coupon.couponid
  }
  const customerNow = await req.patch()
  await waitForWebhook('customer.discount.created', (stripeEvent) => {
    return stripeEvent.data.object.customer === customer.customerid
  })
  return customerNow
}

async function deleteCustomerDiscount (administrator, customer, coupon) {
  Log.info('deleteCustomerDiscount', administrator, customer, coupon)
  const req = createRequest(`/api/administrator/subscriptions/reset-customer-coupon?customerid=${customer.customerid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    couponid: coupon.couponid
  }
  const customerNow = await req.patch()
  return customerNow
}

const cardTypes = [
  'American Express',
  'Diners Club - Carte Blanche',
  'Diners Club',
  'Discover',
  'InstaPayment',
  'JCB',
  'Laser',
  'Maestro',
  'MasterCard',
  'Visa',
  'Visa Electron',
  'American Express (work)',
  'Diners Club - Carte Blanche (work)',
  'Diners Club (work)',
  'Discover (work)',
  'InstaPayment (work)',
  'JCB (work)',
  'Laser (work)',
  'Maestro (work)',
  'MasterCard (work)',
  'Visa (work)',
  'Visa Electron (work)'
]

async function createCustomer (user, properties) {
  Log.info('createCustomer', user, properties)
  const req = createRequest(`/api/user/subscriptions/create-customer?accountid=${user.account.accountid}`)
  req.session = user.session
  req.account = user.account
  req.body = properties
  req.body.description = req.body.description || cardTypes[Math.floor(Math.random() * cardTypes.length)]
  user.customer = await req.post()
  return user.customer
}

async function createSetupIntent (user, properties) {
  Log.info('createSetupIntent', user, properties)
  const req = createRequest(`/api/user/subscriptions/create-setup-intent?customerid=${user.customer.customerid}`)
  req.account = user.account
  req.session = user.session
  req.body = properties
  user.setupIntent = await req.post()
  return user.setupIntent
}

async function createPaymentIntent (user, properties) {
  Log.info('createPaymentIntent', user, properties)
  const req = createRequest(`/api/user/subscriptions/create-payment-intent?customerid=${user.customer.customerid}`)
  req.account = user.account
  req.session = user.session
  req.body = properties
  user.paymentIntent = await req.post()
  await waitForWebhook('payment_intent.created', (stripeEvent) => {
    return stripeEvent.data.object.id === user.paymentIntent.stripeObject.id
  })
  return user.paymentIntent
}

async function createUsageRecord (user, quantity) {
  Log.info('createUsageRecord', user, quantity)
  const req = createRequest(`/api/user/subscriptions/create-usage-record?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    quantity: quantity || 100,
    action: 'set',
    subscriptionitemid: user.subscription.stripeObject.items.data[0].id
  }
  user.usageRecord = await req.post()
  return user.usageRecord
}

async function createPaymentMethod (user, properties) {
  Log.info('createPaymentMethod', user, properties)
  const req = createRequest(`/api/user/subscriptions/create-payment-method?customerid=${user.customer.customerid}`)
  req.account = user.account
  req.session = user.session
  req.body = properties
  user.paymentMethod = await req.post()
  if (properties.default === 'true') {
    await waitForWebhook('customer.updated', (stripeEvent) => {
      return stripeEvent.data.object.id === user.customer.customerid &&
             stripeEvent.data.object.invoice_settings.default_payment_method === user.paymentMethod.stripeObject.id
    })
    await waitForWebhook('payment_method.attached', (stripeEvent) => {
      return stripeEvent.data.object.id === user.paymentMethod.stripeObject.id
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
  }
  return user.paymentMethod
}

async function createAmountOwed (user, dueDate) {
  Log.info('createAmountOwed', user, dueDate)
  const req = createRequest(`/api/fake-amount-owed?customerid=${user.customer.customerid}&due_date=${(dueDate || 0).toString()}`)
  req.session = user.session
  req.account = user.account
  const invoice = await req.route.api.get(req)
  const req2 = createRequest(`/api/user/subscriptions/invoice?invoiceid=${invoice.id}`)
  req2.session = user.session
  req2.account = user.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      user.invoice = await req2.route.api.get(req2)
    } catch (error) {
      await wait()
      continue
    }
    break
  }
  return user.invoice
}

async function changeSubscription (user, planid) {
  Log.info('changeSubscription', user, planid)
  const req = createRequest(`/api/user/subscriptions/set-subscription-plan?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    planid
  }
  if (user.paymentMethod) {
    req.body.paymentmethodid = user.paymentMethod.stripeObject.id
  }
  user.subscription = await req.patch()
  await waitForWebhook('customer.subscription.updated', (stripeEvent) => {
    return stripeEvent.data.object.plan.planid === planid
  })
  await waitForWebhook('invoice.created', async (stripeEvent) => {
    if (stripeEvent.data.object.id !== user.invoice.stripeObject.id &&
        stripeEvent.data.object.subscription === user.subscription.subscriptionid &&
        stripeEvent.data.object.lines.data[stripeEvent.data.object.lines.data.length - 1].plan.planid === planid) {
      user.invoice = await global.api.administrator.subscriptions.Invoice.get({
        query: {
          invoiceid: stripeEvent.data.object.id
        }
      })
      return true
    }
  })
  if (user.invoice.stripeObject.amount_due && !user.invoice.stripeObject.charge) {
    await waitForWebhook('charge.succeeded', async (stripeEvent) => {
      if (stripeEvent.data.object.id === user.invoice.stripeObject.charge) {
        user.charge = await global.api.administrator.subscriptions.Charge.get({
          query: {
            chargeid: stripeEvent.data.object.id
          }
        })
        return true
      }
    })
  }
  return user.subscription
}

async function changeSubscriptionQuantity (user, quantity) {
  Log.info('changeSubscriptionQuantity', user, quantity)
  const req = createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    quantity
  }
  if (user.paymentMethod) {
    req.body.paymentmethodid = user.paymentMethod.stripeObject.id
  }
  user.subscription = await req.patch()
  await waitForWebhook('customer.subscription.updated', (stripeEvent) => {
    return stripeEvent.data.object.quantity === quantity
  })
  if (user.subscription.stripeObject.current_period_end && !user.subscription.stripeObject.trial_end) {
    await waitForWebhook('invoice.created', async (stripeEvent) => {
      if (stripeEvent.data.object.id !== user.invoice.stripeObject.id &&
        stripeEvent.data.object.subscription === user.subscription.subscriptionid &&
        stripeEvent.data.object.lines.data[stripeEvent.data.object.lines.data.length - 1].quantity === quantity) {
        user.invoice = await global.api.administrator.subscriptions.Invoice.get({
          query: {
            invoiceid: stripeEvent.data.object.id
          }
        })
        return true
      }
    })
    if (user.invoice.stripeObject.charge) {
      await waitForWebhook('charge.succeeded', (stripeEvent) => {
        return stripeEvent.data.object.id === user.invoice.stripeObject.charge
      })
      await waitForWebhook('charge.updated', async (stripeEvent) => {
        if (stripeEvent.data.object.id === user.invoice.stripeObject.charge) {
          user.charge = await global.api.administrator.subscriptions.Charge.get({
            query: {
              chargeid: stripeEvent.data.object.id
            }
          })
          return true
        }
      })
    }
  }
  return user.subscription
}

async function createSubscription (user, planid) {
  Log.info('createSubscription', user, planid)
  const req = createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    planid
  }
  if (user.paymentMethod) {
    req.body.paymentmethodid = user.paymentMethod.stripeObject.id
  }
  user.subscription = await req.post()
  return user.subscription
}

async function cancelSubscription (user) {
  Log.info('cancelSubscription', user)
  const req = createRequest(`/api/user/subscriptions/set-subscription-canceled?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.stripeKey = stripeKey
  user.subscription = await req.patch()
  return user.subscription
}

async function setPlanPublished (administrator, plan) {
  Log.info('setPlanPublished', administrator, plan)
  const req = createRequest(`/api/administrator/subscriptions/set-plan-published?planid=${plan.planid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setPlanUnpublished (administrator, plan) {
  Log.info('setPlanUnpublished', administrator, plan)
  const req = createRequest(`/api/administrator/subscriptions/set-plan-unpublished?planid=${plan.planid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setProductPublished (administrator, product) {
  Log.info('setProductPublished', administrator, product)
  const req = createRequest(`/api/administrator/subscriptions/set-product-published?productid=${product.productid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setProductUnpublished (administrator, product) {
  Log.info('setProductUnpublished', administrator, product)
  const req = createRequest(`/api/administrator/subscriptions/set-product-unpublished?productid=${product.productid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setCouponPublished (administrator, coupon) {
  Log.info('setCouponPublished', administrator, coupon)
  const req = createRequest(`/api/administrator/subscriptions/set-coupon-published?couponid=${coupon.couponid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setCouponUnpublished (administrator, coupon) {
  Log.info('setCouponUnpublished', administrator, coupon)
  const req = createRequest(`/api/administrator/subscriptions/set-coupon-unpublished?couponid=${coupon.couponid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function deleteSubscription (user, refund) {
  Log.info('deleteSubscription', user, refund)
  if (refund) {
    const req = createRequest(`/api/user/subscriptions/create-cancelation-refund?subscriptionid=${user.subscription.subscriptionid}`)
    req.session = user.session
    req.account = user.account
    const object = await req.post()
    user.refund = object
    await waitForWebhook('charge.refunded', (stripeEvent) => {
      return stripeEvent.data.object.id === user.refund.charge
    })
  }
  const req2 = createRequest(`/api/user/subscriptions/delete-subscription?subscriptionid=${user.subscription.subscriptionid}`)
  req2.session = user.session
  req2.account = user.account
  const subscription = await req2.delete()
  await waitForWebhook('customer.subscription.deleted', (stripeEvent) => {
    return stripeEvent.data.object.id === user.subscription.subscriptionid
  })
  req2.query.customerid = user.customer.customerid
  req2.stripeKey = stripeKey
  user.customer = await global.api.user.subscriptions.Customer.get(req2)
  user.subscription = subscription
  return user.subscription
}

async function forgiveInvoice (administrator, invoiceid) {
  Log.info('forgiveInvoice', administrator, invoiceid)
  const req = createRequest(`/api/administrator/subscriptions/set-invoice-uncollectible?invoiceid=${invoiceid}`)
  req.session = administrator.session
  req.account = administrator.account
  const invoice = await req.patch()
  if (invoice.subscription) {
    await waitForWebhook('customer.subscription.updated', (stripeEvent) => {
      return stripeEvent.data.object.id !== invoice.invoiceid
    })
  }
  return invoice
}

async function denyRefund (administrator, user, chargeid) {
  Log.info('denyRefund', administrator, user, chargeid)
  const req = createRequest(`/api/administrator/subscriptions/set-refund-request-denied?chargeid=${chargeid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    reason: 'refund denied'
  }
  user.charge = await req.patch()
  return user.charge
}

async function requestRefund (user, chargeid) {
  Log.info('requestRefund', user, chargeid)
  const req = createRequest(`/api/user/subscriptions/create-refund-request?chargeid=${chargeid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    reason: 'unused subscription'
  }
  user.charge = await req.post()
  return user.charge
}

async function flagCharge (administrator, chargeid) {
  Log.info('flagCharge', administrator, chargeid)
  const req = createRequest(`/api/administrator/subscriptions/set-charge-flagged?chargeid=${chargeid}`)
  req.session = administrator.session
  req.account = administrator.account
  const charge = await req.patch()
  return charge
}

async function createPayout (administrator) {
  Log.info('createPayout', administrator)
  const req = createRequest('/api/create-fake-payout')
  req.session = administrator.session
  req.account = administrator.account
  const payout = await req.get()
  const req2 = createRequest(`/api/administrator/subscriptions/payout?payoutid=${payout.id}`)
  req2.session = administrator.session
  req2.account = administrator.account
  req2.stripeKey = stripeKey
  while (true) {
    try {
      administrator.payout = await req2.route.api.get(req2)
    } catch (error) {
      await wait()
      continue
    }
    break
  }
  return payout
}

async function toggleRefunds (user, enable) {
  Log.info('toggleRefunds', user, enable)
  const req = createRequest(`/api/toggle-refunds?enable=${enable || ''}`)
  req.session = user.session
  req.account = user.account
  return req.get(req)
}

async function toggleOverdueInvoiceThreshold (user, enable) {
  Log.info('toggleOverdueInvoiceThreshold', user, enable)
  const req = createRequest(`/api/toggle-overdue-invoice-threshold?enable=${enable || ''}`)
  req.session = user.session
  req.account = user.account
  await req.get()
}
