const { faker } = require('@faker-js/faker')
const DashboardScreenshots = require('@layeredapps/dashboard/screenshot-data.js')
const mergeStripeObject = require('./src/stripe-object')
const now = new Date()
const createDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 365, now.getHours(), now.getMinutes(), now.getSeconds())
const customers = []
const subscriptions = []
const invoices = []
const charges = []
const customerQuantities = []
const subscriptionQuantities = []
const invoiceQuantities = []
const chargeQuantities = []
const subscriptionIndex = {}
const chargeIndex = {}
const invoiceIndex = {}
const couponIndex = {}

const products = [
  mergeStripeObject(createProduct(createDate)),
  mergeStripeObject(createProduct(createDate)),
  mergeStripeObject(createProduct(createDate)),
  mergeStripeObject(createProduct(createDate))
]
const plans = [
  mergeStripeObject(createPlan(products[0])),
  mergeStripeObject(createPlan(products[1])),
  mergeStripeObject(createPlan(products[2]))
]

const coupons = [
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 35, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 65, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 85, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 105, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 125, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 145, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 165, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 185, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 205, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 225, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 255, now.getHours(), now.getMinutes(), now.getSeconds()))),
  mergeStripeObject(createCoupon(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 285, now.getHours(), now.getMinutes(), now.getSeconds())))
]

for (let i = 0; i < 365; i++) {
  if (i === 0) {
    customerQuantities[i] = 30 + Math.ceil(Math.random() * 80)
  } else {
    customerQuantities[i] = Math.ceil(customerQuantities[i - 1] * (0.85 + (Math.random() * 0.25)))
  }
}

for (let i = 0; i < customerQuantities.length; i++) {
  const dayQuantity = customerQuantities[i]
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
  for (let j = 0; j < dayQuantity; j++) {
    const customer = mergeStripeObject(createCustomer(date))
    customers.push(customer)
    const plan = plans[Math.floor(Math.random() * plans.length)]
    const subscription = mergeStripeObject(createSubscription(customer.createdAt, customer, plan))
    subscriptions.push(subscription)
    subscriptionIndex[customer.customerid] = subscription
    subscriptionQuantities[i] = subscriptionQuantities[i] || 0
    subscriptionQuantities[i]++
    let period
    switch (subscription.plan.interval) {
      case 'day':
        period = (24 * 60 * 60 * 1000)
        break
      case 'week':
        period = (7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        period = (30 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        period = (365 * 24 * 60 * 60 * 1000)
        break
    }
    let billingDate = subscription.createdAt.getTime()
    invoiceIndex[customer.id] = []
    chargeIndex[customer.id] = []
    while (billingDate < now.getTime()) {
      billingDate += period
      const invoice = mergeStripeObject(createInvoice(subscription, new Date(billingDate)))
      invoices.push(invoice)
      invoiceQuantities[i] = invoiceQuantities[i] || 0
      invoiceQuantities[i]++
      invoiceIndex[customer.id].push(invoice)
      const charge = mergeStripeObject(createCharge(subscription, invoice))
      charges.push(charge)
      chargeQuantities[i] = chargeQuantities[i] || 0
      chargeQuantities[i]++
      chargeIndex[customer.id].push(charge)
    }
  }
}

const administratorIndex = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions') {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.subscriptionsChartDays, 90, subscriptionQuantities)
      DashboardScreenshots.addMetrics(req.data.invoicesChartDays, 90, invoiceQuantities)
      DashboardScreenshots.addMetrics(req.data.chargesChartDays, 90, chargeQuantities)
      DashboardScreenshots.adjustNormalize(req.data.subscriptionsChartDays)
      DashboardScreenshots.adjustNormalize(req.data.invoicesChartDays)
      DashboardScreenshots.adjustNormalize(req.data.chargesChartDays)
      DashboardScreenshots.adjustHighlight(subscriptionQuantities, req.data.subscriptionsChartHighlights)
      DashboardScreenshots.adjustHighlight(invoiceQuantities, req.data.invoicesChartHighlights)
      DashboardScreenshots.adjustHighlight(chargeQuantities, req.data.chargesChartHighlights)
      DashboardScreenshots.adjustValues(req.data.subscriptionsChartDays, req.data.subscriptionsChartValues)
      DashboardScreenshots.adjustValues(req.data.invoicesChartDays, req.data.invoicesChartValues)
      DashboardScreenshots.adjustValues(req.data.chargesChartDays, req.data.chargesChartValues)
      req.data.products = (req.data.products || []).concat(products)
      req.data.plans = (req.data.plans || []).concat(plans)
      req.data.subscriptions = req.data.subscriptions || []
      addSubscriptionObjects(req.data.subscriptions, 10)
      req.data.invoices = req.data.invoices || []
      addInvoiceObjects(req.data.invoices, 10)
      req.data.coupons = req.data.coupons || []
      addCouponObjects(req.data.coupons, global.pageSize - req.data.coupons.length)
    }
  }
}

const administratorCustomers = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/customers' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 365, customerQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustHighlight(customerQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      req.data.customers = req.data.customers || []
      addCustomerObjects(req.data.customers, global.pageSize - req.data.customers.length)
      for (const customer of req.data.customers) {
        const subscription = subscriptionIndex[customer.customerid]
        if (!subscription) {
          continue
        }
        if (subscription.status !== 'canceled') {
          customer.numSubscriptions = 1
        } else {
          customer.numSubscriptions = 0
        }
      }
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorSubscriptions = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/subscriptions' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 365, subscriptionQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustHighlight(subscriptionQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      req.data.subscriptions = req.data.subscriptions || []
      addSubscriptionObjects(req.data.subscriptions, global.pageSize - req.data.subscriptions.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorCharges = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/charges' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 365, chargeQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustHighlight(chargeQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      req.data.charges = req.data.charges || []
      addChargeObjects(req.data.charges, global.pageSize - req.data.charges.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorCoupons = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/coupons' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      req.data.coupons = req.data.coupons || []
      addCouponObjects(req.data.coupons, global.pageSize - req.data.coupons.length)
    }
  }
}

const administratorInvoices = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/invoices' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      DashboardScreenshots.addMetrics(req.data.createdChartDays, 365, invoiceQuantities)
      DashboardScreenshots.adjustNormalize(req.data.createdChartDays)
      DashboardScreenshots.adjustHighlight(invoiceQuantities, req.data.createdChartHighlights)
      DashboardScreenshots.adjustValues(req.data.createdChartDays, req.data.createdChartValues)
      req.data.invoices = req.data.invoices || []
      addInvoiceObjects(req.data.invoices, global.pageSize - req.data.invoices.length)
      req.data.total = req.data.createdChartHighlights.total
    }
  }
}

const administratorPlans = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/plans' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      req.data.plans = req.data.plans || []
      addPlanObjects(req.data.plans, global.pageSize - req.data.plans.length)
    }
  }
}

const administratorProducts = {
  before: async (req) => {
    if (req.urlPath !== '/administrator/subscriptions/products' || global.pageSize !== 50) {
      return
    }
    const route = req.route
    const oldAPI = req.route.api
    req.route = {}
    for (const key in route) {
      req.route[key] = route[key]
    }
    req.route.api = {
      before: oldAPI.before,
      get: oldAPI.get,
      post: oldAPI.post,
      patch: oldAPI.patch,
      put: oldAPI.put,
      delete: oldAPI.delete
    }
    req.route.api.before = async (req) => {
      await oldAPI.before(req)
      req.data.products = req.data.products || []
      addProductObjects(req.data.products, global.pageSize - req.data.products.length)
    }
  }
}

module.exports = {
  administratorIndex,
  administratorCharges,
  administratorCoupons,
  administratorCustomers,
  administratorInvoices,
  administratorPlans,
  administratorProducts,
  administratorSubscriptions
}

function addCustomerObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const customer of customers) {
    array.push(customer)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function addSubscriptionObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const subscription of subscriptions) {
    array.push(subscription)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function addInvoiceObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const invoice of invoices) {
    array.push(invoice)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function addChargeObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const charge of charges) {
    array.push(charge)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function addCouponObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const coupon of coupons) {
    array.push(coupon)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function addPlanObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const plan of plans) {
    array.push(plan)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function addProductObjects (array, quantity) {
  const preexisting = [].concat(array)
  for (const product of products) {
    array.push(product)
  }
  array.sort((a, b) => {
    return a.createdAt.getTime() > b.createdAt.getTime() ? -1 : 1
  })
  preexisting.reverse()
  for (const item of preexisting) {
    array.splice(array.indexOf(item), 1)
    array.unshift(item)
  }
  if (array.length > quantity + preexisting.length) {
    array.length = quantity + preexisting.length
  }
}

function createProduct (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 24)
  const name = faker.commerce.product()
  return {
    productid: `prod_${id}`,
    object: 'product',
    stripeObject: {
      id: `prod_${id}`,
      object: 'product',
      active: true,
      attributes: [],
      created: Math.floor(date.getTime() / 1000),
      description: null,
      images: [],
      livemode: false,
      metadata: {},
      name: faker.commerce.product(),
      package_dimensions: null,
      shippable: null,
      statement_descriptor: name,
      tax_code: null,
      type: 'service',
      unit_label: 'thing',
      updated: Math.floor(date.getTime() / 1000),
      url: null
    },
    publishedAt: date,
    unpublishedAt: null,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createPlan (product) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 24)
  const amount = (Math.random() < 0.5 ? 1000 + Math.ceil(Math.random() * 1000) : 0) * 100
  const trialPeriodDays = Math.random() < 0.5 ? 7 : 0
  return {
    planid: `plan_${id}`,
    object: 'plan',
    stripeObject: {
      id: `plan_${id}`,
      object: 'plan',
      active: true,
      aggregate_usage: null,
      amount,
      amount_decimal: amount.toString(),
      billing_scheme: 'per_unit',
      created: product.created,
      currency: 'usd',
      interval: 'month',
      interval_count: 1,
      livemode: false,
      metadata: {},
      nickname: `${product.name} subscription`,
      product: product.productid,
      tiers_mode: null,
      transform_usage: null,
      trial_period_days: trialPeriodDays,
      usage_type: 'licensed'
    },
    productid: product.productid,
    publishedAt: product.publishedAt,
    unpublishedAt: null,
    appid: global.appid,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt
  }
}

function createSubscription (date, customer, plan) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 24)
  let periodEnd = date.getTime()
  switch (plan.interval) {
    case 'day':
      periodEnd += (24 * 60 * 60 * 1000)
      break
    case 'week':
      periodEnd += (7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      periodEnd += (30 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      periodEnd += (365 * 24 * 60 * 60 * 1000)
      break
  }
  let status
  if (Math.random() < 0.75) {
    status = 'active'
  } else if (Math.random() < 0.5) {
    status = 'canceling'
  } else {
    status = 'canceled'
  }
  return {
    subscriptionid: `sub_${id}`,
    object: 'subscription',
    stripeObject: {
      id: `sub_${id}`,
      object: 'subscription',
      application_fee_percent: null,
      automatic_tax: {
        enabled: false
      },
      billing_cycle_anchor: Math.floor(date.getTime() / 1000),
      billing_thresholds: null,
      cancel_at: null,
      cancel_at_period_end: false,
      canceled_at: null,
      collection_method: 'charge_automatically',
      created: Math.floor(date.getTime() / 1000),
      current_period_end: Math.floor(periodEnd / 1000),
      current_period_start: Math.floor(date.getTime() / 1000),
      customer: customer.customerid,
      days_until_due: null,
      default_payment_method: customer.default_payment_method,
      default_source: null,
      default_tax_rates: [],
      discount: null,
      ended_at: null,
      items: {
        object: 'list',
        data: [
          {
            id: 'si_LVMyKXgSTnUHAs',
            object: 'subscription_item',
            billing_thresholds: null,
            created: Math.floor(date.getTime() / 1000),
            metadata: {},
            plan,
            price: {
              id: plan.planid,
              object: 'price',
              active: true,
              billing_scheme: 'per_unit',
              created: Math.floor(date.getTime() / 1000),
              currency: 'usd',
              livemode: false,
              lookup_key: null,
              metadata: {},
              nickname: null,
              product: plan.product,
              recurring: {
                aggregate_usage: null,
                interval: 'month',
                interval_count: 1,
                trial_period_days: null,
                usage_type: 'licensed'
              },
              tax_behavior: 'unspecified',
              tiers_mode: null,
              transform_quantity: null,
              type: 'recurring',
              unit_amount: plan.amount,
              unit_amount_decimal: plan.amount.toString()
            },
            quantity: 1,
            subscription: `sub_${id}`,
            tax_rates: []
          }
        ],
        has_more: false,
        total_count: 1,
        url: `/v1/subscription_items?subscription=sub_${id}`
      },
      latest_invoice: 'in_1KoMEZAOHKfbb1V1eJungdGX',
      livemode: false,
      metadata: {},
      next_pending_invoice_item_invoice: null,
      pause_collection: null,
      payment_settings: {
        payment_method_options: null,
        payment_method_types: null
      },
      pending_invoice_item_interval: null,
      pending_setup_intent: null,
      pending_update: null,
      plan,
      quantity: 1,
      schedule: null,
      start_date: Math.floor(date.getTime() / 1000),
      status,
      test_clock: null,
      transfer_data: null,
      trial_end: null,
      trial_start: null
    },
    customerid: customer.customerid,
    accountid: customer.accountid,
    paymentmethodid: null,
    productid: plan.product,
    planid: plan.planid,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createInvoice (subscription, date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 24)
  const charge = createCharge(subscription, date)
  let period = date.getTime()
  switch (subscription.plan.interval) {
    case 'day':
      period = (24 * 60 * 60 * 1000)
      break
    case 'week':
      period = (7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      period = (30 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      period = (365 * 24 * 60 * 60 * 1000)
      break
  }
  return {
    invoiceid: `in_${id}`,
    object: 'invoice',
    stripeObject: {
      id: `in_${id}`,
      object: 'invoice',
      account_country: 'AU',
      account_name: null,
      account_tax_ids: null,
      amount_due: subscription.plan.amount,
      amount_paid: subscription.plan.amount,
      amount_remaining: 0,
      application_fee_amount: null,
      attempt_count: 1,
      attempted: true,
      auto_advance: false,
      automatic_tax: {
        enabled: false,
        status: null
      },
      billing_reason: 'subscription_create',
      charge: charge.id,
      collection_method: 'charge_automatically',
      created: Math.floor(date.getTime() / 1000),
      currency: 'usd',
      custom_fields: null,
      customer: subscription.customerid,
      customer_address: null,
      customer_email: 'Inez10@hotmail.com',
      customer_name: null,
      customer_phone: null,
      customer_shipping: null,
      customer_tax_exempt: 'none',
      customer_tax_ids: [],
      default_payment_method: null,
      default_source: null,
      default_tax_rates: [],
      description: null,
      discount: null,
      discounts: [],
      due_date: null,
      ending_balance: 0,
      footer: null,
      hosted_invoice_url: 'https://invoice.stripe.com/i/acct_1KXYCDAOHKfbb1V1/test_YWNjdF8xS1hZQ0RBT0hLZmJiMVYxLF9MVk1rb2Q5bmE0MEdraFR2d284eGk4Nlo5RjhOazJBLDQwNDU3OTI10200L0FqHxYi?s=ap',
      invoice_pdf: 'https://pay.stripe.com/invoice/acct_1KXYCDAOHKfbb1V1/test_YWNjdF8xS1hZQ0RBT0hLZmJiMVYxLF9MVk1rb2Q5bmE0MEdraFR2d284eGk4Nlo5RjhOazJBLDQwNDU3OTI10200L0FqHxYi/pdf?s=ap',
      last_finalization_error: null,
      lines: {
        object: 'list',
        data: [
          {
            id: 'il_1KoM0rAOHKfbb1V1wSbOFMIf',
            object: 'line_item',
            amount: subscription.plan.amount,
            currency: 'usd',
            description: `1 thing × ${subscription.plan.productid} (at $10.00 / month)`,
            discount_amounts: [],
            discountable: true,
            discounts: [],
            livemode: false,
            metadata: {},
            period: {
              end: Math.floor(date.getTime() / 1000),
              start: Math.floor(date.getTime() / 1000) + Math.floor(period / 1000)
            },
            plan: subscription.plan,
            price: {
              id: subscription.plan.planid,
              object: 'price',
              active: true,
              billing_scheme: 'per_unit',
              created: Math.floor(date.getTime() / 1000),
              currency: 'usd',
              livemode: false,
              lookup_key: null,
              metadata: {},
              nickname: null,
              product: 'prod_LVMkw5ZN9hJVd3',
              recurring: {
                aggregate_usage: null,
                interval: 'month',
                interval_count: 1,
                trial_period_days: null,
                usage_type: 'licensed'
              },
              tax_behavior: 'unspecified',
              tiers_mode: null,
              transform_quantity: null,
              type: 'recurring',
              unit_amount: subscription.plan.amount,
              unit_amount_decimal: subscription.plan.amount
            },
            proration: false,
            proration_details: {
              credited_items: null
            },
            quantity: 1,
            subscription: subscription.subscriptionid,
            subscription_item: 'si_LVMk6K9xEI7cK6',
            tax_amounts: [],
            tax_rates: [],
            type: 'subscription'
          }
        ],
        has_more: false,
        total_count: 1,
        url: `/v1/invoices/in_${id}/lines`
      },
      livemode: false,
      metadata: {},
      next_payment_attempt: null,
      number: 'D6D95818-0001',
      on_behalf_of: null,
      paid: true,
      paid_out_of_band: false,
      payment_intent: 'pi_3KoM0sAOHKfbb1V10DMo4Rt3',
      payment_settings: {
        payment_method_options: null,
        payment_method_types: null
      },
      period_end: Math.floor(date.getTime() / 1000),
      period_start: Math.floor(date.getTime() / 1000),
      post_payment_credit_notes_amount: 0,
      pre_payment_credit_notes_amount: 0,
      quote: null,
      receipt_number: null,
      starting_balance: 0,
      statement_descriptor: null,
      status: 'paid',
      status_transitions: {
        finalized_at: Math.floor(date.getTime() / 1000),
        marked_uncollectible_at: null,
        paid_at: Math.floor(date.getTime() / 1000),
        voided_at: null
      },
      subscription: subscription.subscriptionid,
      subtotal: subscription.plan.amount,
      tax: null,
      test_clock: null,
      total: subscription.plan.amount,
      total_discount_amounts: [],
      total_tax_amounts: [],
      transfer_data: null,
      webhooks_delivered_at: null
    },
    customerid: subscription.customerid,
    subscriptionid: subscription.subscriptionid,
    accountid: subscription.accountid,
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createCharge (subscription, invoice) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 24)
  return {
    chargeid: `ch_${id}`,
    accountid: subscription.accountid,
    subscriptionid: subscription.id,
    customerid: subscription.customer,
    paymentmethodid: null,
    invoiceid: invoice.id,
    refundRequested: null,
    refundReason: null,
    refundDenied: null,
    refundDeniedReason: null,
    object: 'charge',
    stripeObject: {
      id: `ch_${id}`,
      object: 'charge',
      amount: subscription.plan.amount,
      amount_captured: subscription.plan.amount,
      amount_refunded: 0,
      application: null,
      application_fee: null,
      application_fee_amount: null,
      balance_transaction: 'txn_3KoLsZAOHKfbb1V10KTGSHKv',
      billing_details: {
        address: {
          city: null,
          country: null,
          line1: null,
          line2: null,
          postal_code: null,
          state: null
        },
        email: null,
        name: 'Bryan Hilpert',
        phone: null
      },
      calculated_statement_descriptor: 'PRODUCT221 DESCRIPTION',
      captured: true,
      created: invoice.createdAt,
      currency: 'usd',
      customer: subscription.customer,
      description: 'Subscription creation',
      destination: null,
      dispute: null,
      disputed: false,
      failure_balance_transaction: null,
      failure_code: null,
      failure_message: null,
      fraud_details: {},
      invoice: invoice.id,
      livemode: false,
      metadata: {},
      on_behalf_of: null,
      order: null,
      outcome: {
        network_status: 'approved_by_network',
        reason: null,
        risk_level: 'normal',
        risk_score: 41,
        seller_message: 'Payment complete.',
        type: 'authorized'
      },
      paid: true,
      payment_intent: 'pi_3KoLsZAOHKfbb1V10dDb5Y8W',
      payment_method: 'pm_1KoLsTAOHKfbb1V1USFCvd2Z',
      payment_method_details: {
        card: {
          brand: 'visa',
          checks: {
            address_line1_check: null,
            address_postal_code_check: null,
            cvc_check: 'pass'
          },
          country: 'US',
          exp_month: 1,
          exp_year: 2023,
          fingerprint: 'h5SsHyYXlUPIB9Xa',
          funding: 'credit',
          installments: null,
          last4: '1111',
          mandate: null,
          network: 'visa',
          three_d_secure: null,
          wallet: null
        },
        type: 'card'
      },
      receipt_email: null,
      receipt_number: null,
      receipt_url: `https://pay.stripe.com/receipts/${subscription.account}/ch_${id}/rcpt_LVMbdWETJOycwedYrVdczGpoJWlJdUM`,
      refunded: false,
      refunds: {
        object: 'list',
        data: [],
        has_more: false,
        total_count: 0,
        url: `/v1/charges/ch_${id}/refunds`
      },
      review: null,
      shipping: null,
      source: null,
      source_transfer: null,
      statement_descriptor: 'product221 description',
      statement_descriptor_suffix: null,
      status: 'succeeded',
      transfer_data: null,
      transfer_group: null
    },
    appid: global.appid,
    createdAt: invoice.createdAt,
    updatedAt: invoice.createdAt
  }
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
  'Work American Express',
  'Work Diners Club - Carte Blanche',
  'Work Diners Club',
  'Work Discover',
  'Work InstaPayment',
  'Work JCB',
  'Work Laser',
  'Work Maestro',
  'Work MasterCard',
  'Work Visa',
  'Work Visa Electron'
]

function createCustomer (date) {
  const id = faker.datatype.uuid().split('-').join('').substring(0, 24)
  const email = faker.internet.email()
  return {
    customerid: `cus_${id}`,
    object: 'customer',
    accountid: 'acct_326c7e561e34f49d',
    stripeObject: {
      id: `cus_${id}`,
      object: 'customer',
      address: null,
      balance: 0,
      created: Math.floor(date.getTime() / 1000),
      currency: null,
      default_source: null,
      delinquent: false,
      description: cardTypes[Math.floor(Math.random() * cardTypes.length)],
      discount: null,
      email,
      invoice_prefix: '063BA694',
      invoice_settings: {
        custom_fields: null,
        default_payment_method: 'pm_1KoLzaAOHKfbb1V1BjXqhzOp',
        footer: null
      },
      livemode: false,
      metadata: {},
      name: null,
      next_invoice_sequence: 1,
      phone: null,
      preferred_locales: [],
      shipping: null,
      tax_exempt: 'none',
      test_clock: null
    },
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
}

function createCoupon (date) {
  const coupon = {
    object: 'coupon',
    stripeObject: {
      object: 'coupon',
      amount_off: null,
      created: Math.floor(date.getTime() / 1000),
      currency: null,
      livemode: false,
      max_redemptions: null,
      metadata: {},
      name: null,
      redeem_by: null,
      times_redeemed: 0,
      valid: true
    },
    appid: global.appid,
    createdAt: date,
    updatedAt: date
  }
  if (Math.random() < 0.5) {
    let value = 10 + Math.ceil(Math.random() * 50)
    while (couponIndex[value]) {
      value = 10 + Math.ceil(Math.random() * 50)
    }
    couponIndex[value] = true
    coupon.stripeObject.percent_off = value
    coupon.couponid = coupon.stripeObject.id = `SAVE${value}PERCENT`
  } else {
    let value = 10 + Math.ceil(Math.random() * 50)
    while (couponIndex[value]) {
      value = 10 + Math.ceil(Math.random() * 50)
    }
    couponIndex[value] = true
    coupon.stripeObject.amount_off = value
    coupon.stripeObject.currency = 'usd'
    coupon.couponid = coupon.stripeObject.id = `SAVE${value}`
  }
  if (Math.random() < 0.5) {
    coupon.stripeObject.max_redemptions = Math.ceil(Math.random() * 100)
  }
  if (Math.random() < 0.5) {
    coupon.stripeObject.duration = 'once'
  } else {
    coupon.stripeObject.duration = 'repeating'
    coupon.stripeObject.duration_in_months = 3 + Math.ceil(Math.random() * 6)
  }
  if (Math.random() < 0.75) {
    coupon.publishedAt = date
    if (Math.random() < 0.25) {
      coupon.unpublishedAt = date
    }
  }
  return coupon
}
