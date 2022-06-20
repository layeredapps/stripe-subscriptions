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
global.testConfiguration.automaticBillingProfileDescription = false
global.testConfiguration.automaticBillingProfileFullName = false
global.testConfiguration.automaticBillingProfileEmail = false
global.testConfiguration.skipConfirmSubscription = false
global.testConfiguration.requireBillingProfileAddress = true
global.testConfiguration.stripeJS = false
global.testConfiguration.startSubscriptionPath = '/account/subscriptions/start-subscription'
global.testConfiguration.subscriptionRefundPeriod = 7 * 24 * 60 * 60
global.testConfiguration.minimumCouponLength = 1
global.testConfiguration.maximumCouponLength = 100
global.testConfiguration.minimumProductNameLength = 1
global.testConfiguration.maximumProductNameLength = 100
global.testConfiguration.stripeKey = process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
global.testConfiguration.stripePublishableKey = process.env.SUBSCRIPTIONS_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY
global.testConfiguration.subscriptionWebhookEndPointSecret = process.env.SUBSCRIPTIONS_WEBHOOK_SECRET || false

const util = require('util')
const TestHelper = require('@layeredapps/dashboard/test-helper.js')
const TestHelperPuppeteer = require('@layeredapps/dashboard/test-helper-puppeteer.js')
const Log = require('@layeredapps/dashboard/src/log.js')('test-helper-subscriptions')
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
  apiKey: global.subscriptionsStripeKey || global.stripeKey || process.env.SUBSCRIPTIONS_STRIPE_KEY || process.env.STRIPE_KEY
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
  addSubscriptionItem,
  addSubscriptionItemTaxRate,
  cancelSubscription,
  createAmountOwed,
  createPaymentMethod,
  createPaymentIntent,
  createSetupIntent,
  createCoupon,
  createCustomer,
  createCustomerDiscount,
  createPayout,
  createPrice,
  createProduct,
  createRefund,
  createTaxId,
  createTaxRate,
  createUsageRecord,
  changeSubscriptionQuantity,
  createSubscription,
  createSubscriptionDiscount,
  deleteCustomerDiscount,
  deleteSubscription,
  deleteSubscriptionDiscount,
  deleteTaxId,
  denyRefund,
  flagCharge,
  forgiveInvoice,
  removeSubscriptionItem,
  setPriceActive,
  setPriceInactive,
  setProductActive,
  setProductInactive,
  toggleRefunds,
  toggleOverdueInvoiceThreshold,
  requestRefund,
  waitForWebhook,
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

let webhook, tunnel, subscriptions//, createdData

// direct webhook access is set up before the tests a single time
async function setupBefore () {
  Log.info('setupBefore')
  subscriptions = require('./index.js')
  await subscriptions.setup()
  webhook = await createWebHook()
  global.subscriptionWebhookEndPointSecret = webhook
  global.testConfiguration.subscriptionWebhookEndPointSecret = webhook
  const helperRoutes = require('./test-helper-routes.js')
  global.sitemap['/api/create-fake-payout'] = helperRoutes.createFakePayout
  global.sitemap['/api/fake-amount-owed'] = helperRoutes.fakeAmountOwed
  global.sitemap['/api/toggle-refunds'] = helperRoutes.toggleRefunds
  global.sitemap['/api/toggle-overdue-invoice-threshold'] = helperRoutes.toggleOverdueInvoiceThreshold
}

async function setupBeforeEach () {
  Log.info('setupBeforeEach')
  // createdData = false
  global.webhooks = []
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
}

const createWebHook = util.promisify((callback) => {
  const endpoint = `${global.dashboardServer}/webhooks/subscriptions/index-subscription-data`
  const childProcess = require('child_process')
  tunnel = childProcess.spawn('stripe', ['--log-level', 'debug', '--api-key', stripeKey.apiKey, 'listen', '--forward-to', endpoint.substring(endpoint.indexOf('://') + 3), '--latest'], { detached: true })
  // TODO: for some reason the webhook returns on stderr
  // tunnel.stdout.on('data', (raw) => {
  //   console.log('out', raw.toString())
  // })
  tunnel.stderr.on('data', (raw) => {
    // console.log('err', raw.toString())
    const data = (raw || '').toString()
    if (data.indexOf('whsec') > -1) {
      let secret = data.substring(data.indexOf('whsec'))
      secret = secret.substring(0, secret.indexOf(' '))
      return callback(null, secret)
    }
  })
})

before(deleteOldData)
before(setupBefore)
beforeEach(setupBeforeEach)

afterEach(async () => {
  Log.info('afterEach')
  await subscriptions.Storage.flush()
  if (global.webhooks.length) {
    await deleteOldData()
    process.kill(-tunnel.pid)
    tunnel.kill()
    webhook = await createWebHook()
    global.connectWebhookEndPointSecret = webhook
    global.testConfiguration.connectWebhookEndPointSecret = webhook
  }
})

after(async () => {
  Log.info('after')
  process.kill(-tunnel.pid)
  tunnel.kill()
  await deleteOldData()
  await subscriptions.Storage.flush()
  await TestHelperPuppeteer.close()
})

async function deleteOldData () {
  if (!global.webhooks || !global.webhooks.length) {
    return
  }
  Log.info('deleteOldData')
  // TODO: stripe don't support deleting invoices, charges, products
  // payment intents etc the issue with leaving this residual test
  // data is it may accumulate and overwhelm the API limits
  for (const field of ['subscriptions', 'customers', 'products', 'coupons', 'taxRates']) {
    try {
      const listParameters = {
        limit: 100
      }
      if (field === 'products' || field === 'taxRates') {
        listParameters.active = true
      }
      while (true) {
        const objects = await stripe[field].list(listParameters, stripeKey)
        if (objects && objects.data && objects.data.length) {
          for (const object of objects.data) {
            if (listParameters.active) {
              await stripe[field].update(object.id, { active: 'false' }, stripeKey)
            } else {
              try {
                await stripe[field].del(object.id, stripeKey)
              } catch (error) {
                await stripe[field].update(object.id, { active: 'false' }, stripeKey)
                Log.error('delete old data item error', object.id, error)
              }
            }
          }
        }
        if (!objects.has_more) {
          break
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
  // createdData = true
  productNumber++
  const req = createRequest('/api/administrator/subscriptions/create-product')
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    tax_code: 'txcd_41060003',
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
  if (properties && properties.active === 'false') {
    const req2 = createRequest(`/api/administrator/subscriptions/set-product-inactive?productid=${product.productid}`)
    req2.session = req.session
    req2.account = req.account
    product = await req2.patch(req2)
  }
  administrator.product = product
  return product
}

async function createPrice (administrator, properties) {
  Log.info('createPrice', administrator, properties)
  const req = createRequest('/api/administrator/subscriptions/create-price')
  req.session = administrator.session
  req.account = administrator.account
  req.body = properties || {
    productid: administrator.product.productid,
    currency: 'USD',
    recurring_interval: 'month',
    recurring_interval_count: '1',
    recurring_aggregate_usage: 'sum',
    usage_type: 'licensed',
    unit_amount: '0',
    tax_behavior: 'inclusive',
    active: 'true'
  }
  let price = await req.post()
  if (properties && properties.active === 'false') {
    const req2 = createRequest(`/api/administrator/subscriptions/set-price-inactive?priceid=${price.priceid}`)
    req2.session = req.session
    req2.account = req.account
    price = await req2.patch(req2)
  }
  administrator.price = price
  return price
}

let couponNumber = 0
let percentOff = 0
async function createCoupon (administrator, properties) {
  Log.info('createCoupon', administrator, properties)
  // createdData = true
  couponNumber++
  const req = createRequest('/api/administrator/subscriptions/create-coupon')
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    couponid: `COUPON${couponNumber}`,
    name: 'coupon name'
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
  const coupon = await req.post()
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

async function createTaxRate (administrator, properties) {
  Log.info('createTaxRate', administrator, properties)
  // createdData = true
  properties = properties || {}
  const req = createRequest('/api/administrator/subscriptions/create-tax-rate')
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    display_name: 'NY Sales Tax',
    percentage: '17.5',
    inclusive: 'true',
    active: 'true',
    state: 'NY',
    country: 'US',
    description: 'Sales tax in NY',
    jurisdiction: 'US',
    tax_type: 'sales_tax'
  }
  if (properties) {
    for (const key in properties) {
      req.body[key] = properties[key]
    }
  }
  const taxRate = await req.post()
  administrator.taxRate = taxRate
  return taxRate
}

async function createTaxId (user, customer, properties) {
  Log.info('createTaxId', user, customer, properties)
  properties = properties || {}
  const req = createRequest(`/api/user/subscriptions/create-tax-id?customerid=${customer.customerid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    type: properties.type || 'eu_vat',
    value: properties.value || 'DE123456789'
  }
  const taxid = await req.post()
  user.taxid = taxid
  return taxid
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

async function deleteTaxId (user, taxid) {
  Log.info('deleteTaxId', user, taxid)
  const req = createRequest(`/api/user/subscriptions/delete-tax-id?taxid=${taxid}`)
  req.session = user.session
  req.account = user.account
  await req.delete()
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
  // createdData = true
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
    return stripeEvent.data.object.id === user.paymentIntent.paymentintentid
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
             stripeEvent.data.object.invoice_settings.default_payment_method === user.paymentMethod.paymentmethodid
    })
    await waitForWebhook('payment_method.attached', (stripeEvent) => {
      return stripeEvent.data.object.id === user.paymentMethod.paymentmethodid
    })
    await waitForWebhook('setup_intent.created', async (stripeEvent) => {
      if (stripeEvent.data.object.payment_method === user.paymentMethod.paymentmethodid) {
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

async function changeSubscriptionQuantity (user, quantity) {
  Log.info('changeSubscriptionQuantity', user, quantity)
  const req = createRequest(`/api/user/subscriptions/set-subscription-quantity?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    quantity
  }
  if (user.paymentMethod) {
    req.body.paymentmethodid = user.paymentMethod.paymentmethodid
  }
  user.subscription = await req.patch()
  await waitForWebhook('customer.subscription.updated', (stripeEvent) => {
    return stripeEvent.data.object.quantity === quantity
  })
  if (user.subscription.stripeObject.current_period_end && !user.subscription.stripeObject.trial_end) {
    await waitForWebhook('invoice.created', async (stripeEvent) => {
      if (stripeEvent.data.object.id !== user.invoice.paymentmethodid &&
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

async function createSubscription (user, priceids, properties) {
  Log.info('createSubscription', user, priceids)
  const quantities = []
  for (let i = 0; i < priceids.length; i++) {
    quantities.push(1)
  }
  const req = createRequest(`/api/user/subscriptions/create-subscription?customerid=${user.customer.customerid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    priceids,
    quantities: quantities.join(',')
  }
  if (user.paymentMethod) {
    req.body.paymentmethodid = user.paymentMethod.paymentmethodid
  }
  if (properties) {
    for (const property in properties) {
      req.body[property] = properties[property].toString()
    }
  }
  user.subscription = await req.post()
  return user.subscription
}

async function addSubscriptionItem (user, priceid, quantity) {
  Log.info('addSubscriptionItem', user, priceid)
  const req = createRequest(`/api/user/subscriptions/add-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    priceid,
    quantity: quantity || '1'
  }
  user.subscription = await req.patch()
  return user.subscription
}

async function removeSubscriptionItem (user, itemid) {
  Log.info('addSubscriptionItem', user, itemid)
  const req = createRequest(`/api/user/subscriptions/remove-subscription-item?subscriptionid=${user.subscription.subscriptionid}`)
  req.session = user.session
  req.account = user.account
  req.body = {
    itemid
  }
  user.subscription = await req.post()
  return user.subscription
}

async function addSubscriptionItemTaxRate (administrator, itemid, taxrateid) {
  Log.info('addSubscriptionItemTaxRate', administrator, itemid, taxrateid)
  const req = createRequest(`/api/administrator/subscriptions/add-subscription-item-tax-rate?subscriptionitemid=${itemid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.body = {
    taxrateid
  }
  const subscription = await req.patch()
  return subscription
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

async function setPriceActive (administrator, price) {
  Log.info('setPriceActive', administrator, price)
  const req = createRequest(`/api/administrator/subscriptions/set-price-active?priceid=${price.priceid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setPriceInactive (administrator, price) {
  Log.info('setPriceInactive', administrator, price)
  const req = createRequest(`/api/administrator/subscriptions/set-price-inactive?priceid=${price.priceid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setProductActive (administrator, product) {
  Log.info('setProductActive', administrator, product)
  const req = createRequest(`/api/administrator/subscriptions/set-product-active?productid=${product.productid}`)
  req.session = administrator.session
  req.account = administrator.account
  req.stripeKey = stripeKey
  return req.patch()
}

async function setProductInactive (administrator, product) {
  Log.info('setProductInactive', administrator, product)
  const req = createRequest(`/api/administrator/subscriptions/set-product-inactive?productid=${product.productid}`)
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
