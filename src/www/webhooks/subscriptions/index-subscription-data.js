const dashboard = require('@layeredapps/dashboard')
const Log = require('@layeredapps/dashboard/src/log.js')('stripe-subscriptions')
const packageJSON = require('../../../../package.json')
const stripe = require('stripe')({
  apiVersion: global.stripeAPIVersion,
  telemetry: false,
  maxNetworkRetries: global.maximumStripeRetries || 0,
  appInfo: {
    version: packageJSON.version,
    name: '@layeredapps/stripe-subscriptions',
    url: 'https://github.com/layeredapps/stripe-subscriptions'
  }
})
const stripeCache = require('../../../stripe-cache.js')
const subscriptions = require('../../../../index.js')

module.exports = {
  auth: false,
  template: false,
  post: async (req, res) => {
    res.statusCode = 200
    if (!req.body || !req.bodyRaw) {
      return res.end()
    }
    let stripeEvent
    try {
      stripeEvent = stripe.webhooks.constructEvent(req.bodyRaw, req.headers['stripe-signature'], req.endpointSecret || global.subscriptionWebhookEndPointSecret)
    } catch (error) {
    }
    if (!stripeEvent) {
      return res.end()
    }
    Log.info('stripe event', stripeEvent.type)
    res.statusCode = 200
    switch (stripeEvent.type) {
      case 'setup_intent.canceled':
      case 'setup_intent.created':
      case 'setup_intent.setup_failed':
      case 'setup_intent.succeeded':
        await updateSetupIntent(stripeEvent, req.stripeKey)
        break
      case 'source.canceled':
      case 'source.chargeable':
      case 'source.failed':
      case 'source.mandate_notification':
      case 'source.refund_attributes_required':
      case 'source.transaction.created':
      case 'source.transaction.updated':
        return
      case 'product.created':
      case 'product.updated':
        await updateProduct(stripeEvent, req.stripeKey)
        break
      case 'plan.created':
      case 'plan.updated':
        await updatePlan(stripeEvent, req.stripeKey)
        break
      case 'payment_intent.amount_capturable_updated':
      case 'payment_intent.canceled':
      case 'payment_intent.created':
      case 'payment_intent.payment_failed':
      case 'payment_intent.processing':
      case 'payment_intent.succeeded':
        await updatePaymentIntent(stripeEvent, req.stripeKey)
        break
      case 'payment_method.attached':
      case 'payment_method.card_automatically_updated':
      case 'payment_method.detached':
      case 'payment_method.updated':
        await updatePaymentMethod(stripeEvent, req.stripeKey)
        break
      case 'invoice.created':
      case 'invoice.finalized':
      case 'invoice.marked_uncollectible':
      case 'invoice.paid':
      case 'invoice.payment_action_required':
      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded':
      case 'invoice.sent':
      case 'invoice.upcoming':
      case 'invoice.updated':
      case 'invoice.voided':
        await updateInvoice(stripeEvent, req.stripeKey)
        break
      case 'coupon.created':
      case 'coupon.updated':
        await updateCoupon(stripeEvent, req.stripeKey)
        break
      case 'customer.created':
      case 'customer.updated':
        await updateCustomer(stripeEvent, req.stripeKey)
        break
      case 'customer.source.created':
      case 'customer.source.expiring':
      case 'customer.source.updated':
        break
      case 'customer.discount.created':
      case 'customer.discount.updated':
        await updateDiscount(stripeEvent, req.stripeKey)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
      case 'customer.subscription.trial_will_end':
      case 'customer.subscription.updated':
        await updateSubscription(stripeEvent, req.stripeKey)
        break
      case 'charge.captured':
      case 'charge.expired':
      case 'charge.failed':
      case 'charge.pending':
      case 'charge.refunded':
      case 'charge.succeeded':
      case 'charge.updated':
      case 'charge.dispute.closed':
      case 'charge.dispute.created':
      case 'charge.dispute.funds_reinstated':
      case 'charge.dispute.funds_withdrawn':
      case 'charge.dispute.updated':
      case 'charge.refund.updated':
        await updateCharge(stripeEvent, req.stripeKey)
        break
    }
    if (stripeEvent.data && stripeEvent.data.object && stripeEvent.data.object.id) {
      await dashboard.StorageCache.remove(stripeEvent.data.object.id)
    }
    // for testing we stash the webhooks for analysis
    if (global.testNumber) {
      global.webhooks = global.webhooks || []
      global.webhooks.unshift(stripeEvent)
    }
    return res.end()
  }
}

async function upsert (dataStore, idName, id, newValues) {
  const existing = await dataStore.findOne({
    where: {
      [idName]: id
    }
  })
  if (!existing) {
    return dataStore.upsert(newValues)
  }
  const object = {}
  for (const field in newValues) {
    object[field] = newValues[field] || existing.dataValues[field]
  }
  return dataStore.update(object, {
    where: {
      [idName]: id
    }
  })
}

async function load (id, group, key) {
  try {
    return stripeCache.retrieve(id, group, key)
  } catch (error) {

  }
}

async function updatePlan (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'plans', stripeKey)
  await upsert(subscriptions.Storage.Plan, 'planid', stripeObject.id, {
    planid: stripeObject.id,
    stripeObject
  })
  const properties = {}
  if (stripeObject.product) {
    properties.productid = stripeObject.product
  }
  return subscriptions.Storage.Plan.update(properties, {
    where: {
      planid: stripeObject.id
    }
  })
}

async function updateProduct (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'products', stripeKey)
  await upsert(subscriptions.Storage.Product, 'productid', stripeObject.id, {
    productid: stripeObject.id,
    stripeObject
  })
}

async function updateSetupIntent (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'setupIntents', stripeKey)
  await upsert(subscriptions.Storage.SetupIntent, 'setupintentid', stripeObject.id, {
    setupintentid: stripeObject.id,
    stripeObject
  })
  const properties = {}
  const customerInfo = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'accountid'],
    where: {
      customerid: stripeObject.customer
    }
  })
  if (customerInfo && customerInfo.dataValues.customerid) {
    properties.customerid = customerInfo.dataValues.customerid
  }
  if (customerInfo && customerInfo.dataValues.customerid) {
    properties.accountid = customerInfo.dataValues.accountid
  }
  if (!Object.keys(properties).length) {
    return
  }
  return subscriptions.Storage.SetupIntent.update(properties, {
    where: {
      setupintentid: stripeObject.id
    }
  })
}

async function updatePaymentIntent (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'paymentIntents', stripeKey)
  const updateObject = {
    paymentintentid: stripeObject.id,
    stripeObject,
    status: stripeObject.status
  }
  await upsert(subscriptions.Storage.PaymentIntent, 'paymentintentid', stripeObject.id, updateObject)
  const properties = {}
  if (stripeObject.customer) {
    properties.customerid = stripeObject.customer
  }
  const customerInfo = await subscriptions.Storage.Customer.findOne({
    attributes: ['accountid'],
    where: {
      customerid: stripeObject.customer
    }
  })
  if (customerInfo && customerInfo.dataValues.accountid) {
    properties.accountid = customerInfo.dataValues.accountid
  }
  if (stripeObject.subscription) {
    properties.subscriptionid = stripeObject.subscription
  }
  if (stripeObject.invoice) {
    properties.invoiceid = stripeObject.invoice
  }
  if (!Object.keys(properties).length) {
    return
  }
  return subscriptions.Storage.PaymentIntent.update(properties, {
    where: {
      paymentintentid: stripeObject.id
    }
  })
}

async function updatePaymentMethod (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'paymentMethods', stripeKey)
  await upsert(subscriptions.Storage.PaymentMethod, 'paymentmethodid', stripeObject.id, {
    paymentmethodid: stripeObject.id,
    stripeObject
  })
  const properties = {}
  if (stripeObject.customer) {
    properties.customerid = stripeObject.customer
  }
  const customerInfo = await subscriptions.Storage.Customer.findOne({
    attributes: ['accountid'],
    where: {
      customerid: stripeObject.customer
    }
  })
  if (customerInfo && customerInfo.dataValues.accountid) {
    properties.accountid = customerInfo.dataValues.accountid
  }
  if (!Object.keys(properties).length) {
    return
  }
  return subscriptions.Storage.PaymentMethod.update(properties, {
    where: {
      paymentmethodid: stripeObject.id
    }
  })
}

async function updateInvoice (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'invoices', stripeKey)
  await upsert(subscriptions.Storage.Invoice, 'invoiceid', stripeObject.id, {
    invoiceid: stripeObject.id,
    stripeObject
  })
  const properties = {}
  if (stripeObject.customer) {
    properties.customerid = stripeObject.customer
  }
  if (stripeObject.subscription) {
    properties.subscriptionid = stripeObject.subscription
  }
  const customerInfo = await subscriptions.Storage.Customer.findOne({
    attributes: ['accountid'],
    where: {
      customerid: stripeObject.customer
    }
  })
  if (customerInfo && customerInfo.dataValues.accountid) {
    properties.accountid = customerInfo.dataValues.accountid
  }
  if (!Object.keys(properties).length) {
    return
  }
  return subscriptions.Storage.Invoice.update(properties, {
    where: {
      invoiceid: stripeObject.id
    }
  })
}

async function updateCustomer (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'customers', stripeKey)
  await upsert(subscriptions.Storage.Customer, 'customerid', stripeObject.id, {
    customerid: stripeObject.id,
    stripeObject
  })
}

async function updateCoupon (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'coupons', stripeKey)
  await upsert(subscriptions.Storage.Coupon, 'couponid', stripeObject.id, {
    couponid: stripeObject.id,
    stripeObject
  })
}

async function updateDiscount (stripeEvent, stripeKey) {
  if (stripeEvent.data.object.subscription) {
    const stripeObject = await load(stripeEvent.data.object.subscription, 'subscriptions', stripeKey)
    await upsert(subscriptions.Storage.Subscription, 'subscriptionid', stripeObject.id, {
      subscriptionid: stripeObject.id,
      stripeObject
    })
  } else {
    const stripeObject = await load(stripeEvent.data.object.customer, 'customers', stripeKey)
    await upsert(subscriptions.Storage.Customer, 'customerid', stripeObject.id, {
      customerid: stripeObject.id,
      stripeObject
    })
  }
}

async function updateCharge (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'charges', stripeKey)
  await upsert(subscriptions.Storage.Charge, 'chargeid', stripeObject.id, {
    chargeid: stripeObject.id,
    stripeObject
  })
  const properties = {}
  if (stripeObject.customer) {
    properties.customerid = stripeObject.customer
  }
  if (stripeObject.invoice) {
    properties.invoiceid = stripeObject.invoice
    const invoice = await load(stripeEvent.data.object.invoice, 'invoices', stripeKey)
    if (invoice && invoice.subscription) {
      properties.subscriptionid = invoice.subscription
    }
  }
  const customerInfo = await subscriptions.Storage.Customer.findOne({
    attributes: ['accountid'],
    where: {
      customerid: stripeObject.customer
    }
  })
  if (customerInfo && customerInfo.dataValues.accountid) {
    properties.accountid = customerInfo.dataValues.accountid
  }
  if (!Object.keys(properties).length) {
    return
  }
  return subscriptions.Storage.Charge.update(properties, {
    where: {
      chargeid: stripeObject.id
    }
  })
}

async function updateSubscription (stripeEvent, stripeKey) {
  const stripeObject = await load(stripeEvent.data.object.id, 'subscriptions', stripeKey)
  await upsert(subscriptions.Storage.Subscription, 'subscriptionid', stripeObject.id, {
    subscriptionid: stripeObject.id,
    stripeObject
  })
}
