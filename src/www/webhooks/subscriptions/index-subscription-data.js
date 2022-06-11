const dashboard = require('@layeredapps/dashboard')
const Log = require('@layeredapps/dashboard/src/log.js')('stripe-subscriptions-webhook')
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
    if (!stripeEvent.data || !stripeEvent.data.object || !stripeEvent.data.object.id) {
      // TODO: should upcoming invoices (for free trials) be ignored until they have an id?
      return res.end()
    }
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

async function updateProduct (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Product.findOne({
    attributes: ['productid', 'appid'],
    where: {
      productid: stripeEvent.data.object.id
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.productid) {
    return
  }
  Log.info('update product', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'products', stripeKey)
  return subscriptions.Storage.Product.update({
    stripeObject
  }, {
    productid: exists.dataValues.productid,
    appid: exists.dataValues.appid
  })
}

async function updateSetupIntent (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'appid', 'accountid'],
    where: {
      customerid: stripeEvent.data.object.customer
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
    return
  }
  Log.info('update setup intent', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'setupIntents', stripeKey)
  return upsert(subscriptions.Storage.SetupIntent, 'setupintentid', stripeObject.id, {
    setupintentid: stripeObject.id,
    appid: exists.dataValues.appid,
    customerid: exists.dataValues.customerid,
    accountid: exists.dataValues.accountid,
    stripeObject
  })
}

async function updatePaymentIntent (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'accountid', 'appid'],
    where: {
      customerid: stripeEvent.data.object.customer
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
    return
  }
  Log.info('update payment intent', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'paymentIntents', stripeKey)
  const updateObject = {
    paymentintentid: stripeObject.id,
    appid: exists.dataValues.appid,
    customerid: exists.dataValues.customerid,
    accountid: exists.dataValues.accountid,
    stripeObject,
    status: stripeObject.status
  }
  if (stripeObject.subscription) {
    updateObject.subscriptionid = stripeObject.subscription
  }
  if (stripeObject.invoice) {
    updateObject.invoiceid = stripeObject.invoice
  }
  return upsert(subscriptions.Storage.PaymentIntent, 'paymentintentid', stripeObject.id, updateObject)
}

async function updatePaymentMethod (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'appid', 'accountid'],
    where: {
      customerid: stripeEvent.data.object.customer
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
    return
  }
  Log.info('update payment method', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'paymentMethods', stripeKey)
  return upsert(subscriptions.Storage.PaymentMethod, 'paymentmethodid', stripeObject.id, {
    paymentmethodid: stripeObject.id,
    appid: exists.dataValues.appid,
    accountid: exists.dataValues.accountid,
    customerid: exists.dataValues.customerid,
    stripeObject
  })
}

async function updateInvoice (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'appid', 'accountid'],
    where: {
      customerid: stripeEvent.data.object.customer
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
    return
  }
  Log.info('update invoice', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'invoices', stripeKey)
  const updateObject = {
    invoiceid: stripeObject.id,
    appid: exists.dataValues.appid,
    customerid: exists.dataValues.customerid,
    accountid: exists.dataValues.accountid,
    stripeObject
  }
  if (stripeObject.subscription) {
    updateObject.subscriptionid = stripeObject.subscription
  }
  await upsert(subscriptions.Storage.Invoice, 'invoiceid', stripeObject.id, updateObject)
  for (const item of stripeObject.lines.data) {
    await upsert(subscriptions.Storage.LineItem, 'lineitemid', item.id, {
      lineitemid: item.id,
      invoiceid: stripeObject.id,
      customerid: exists.dataValues.customerid,
      subscriptionid: stripeObject.subscription,
      stripeObject: item
    })
  }
}

async function updateCustomer (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'appid'],
    where: {
      customerid: stripeEvent.data.object.id
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
    return
  }
  Log.info('update customer', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'customers', stripeKey)
  return subscriptions.Storage.Customer.update({
    stripeObject
  }, {
    where: {
      customerid: exists.dataValues.customerid,
      appid: exists.dataValues.appid
    }
  })
}

async function updateCoupon (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Coupon.findOne({
    attributes: ['couponid', 'appid'],
    where: {
      couponid: stripeEvent.data.object.id
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.couponid) {
    return
  }
  Log.info('update coupon', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'coupons', stripeKey)
  return subscriptions.Storage.Coupon.update({
    stripeObject
  }, {
    where: {
      couponid: exists.dataValues.couponid,
      appid: exists.dataValues.appid
    }
  })
}

async function updateDiscount (stripeEvent, stripeKey) {
  Log.info('update discount', stripeEvent.data.object)
  if (stripeEvent.data.object.subscription) {
    const exists = await subscriptions.Storage.Subscription.findOne({
      attributes: ['subscriptionid', 'appid'],
      where: {
        subscriptionid: stripeEvent.data.object.subscription
      }
    })
    if (!exists || !exists.dataValues || !exists.dataValues.subscriptionid) {
      return
    }
    const stripeObject = await load(stripeEvent.data.object.subscription, 'subscriptions', stripeKey)
    return subscriptions.Storage.Subscription.update({
      stripeObject
    }, {
      where: {
        subscriptionid: exists.dataValues.subscriptionid,
        appid: exists.dataValues.appid
      }
    })
  } else {
    const exists = await subscriptions.Storage.Customer.findOne({
      attributes: ['customerid', 'appid'],
      where: {
        customerid: stripeEvent.data.object.customer
      }
    })
    if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
      return
    }
    const stripeObject = await load(stripeEvent.data.object.customer, 'customers', stripeKey)
    return subscriptions.Storage.Customer.update({
      stripeObject
    }, {
      where: {
        customerid: exists.dataValues.customerid,
        appid: exists.dataValues.appid
      }
    })
  }
}

async function updateCharge (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Customer.findOne({
    attributes: ['customerid', 'accountid', 'appid'],
    where: {
      customerid: stripeEvent.data.object.customer
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.customerid) {
    return
  }
  Log.info('update charge', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'charges', stripeKey)
  const updateObject = {
    chargeid: stripeObject.id,
    customerid: exists.dataValues.customerid,
    appid: exists.dataValues.appid,
    accountid: exists.dataValues.accountid,
    stripeObject
  }
  if (stripeObject.invoice) {
    updateObject.invoiceid = stripeObject.invoice
    const invoice = await load(stripeEvent.data.object.invoice, 'invoices', stripeKey)
    if (invoice && invoice.subscription) {
      updateObject.subscriptionid = invoice.subscription
    }
  }
  return upsert(subscriptions.Storage.Charge, 'chargeid', stripeObject.id, updateObject)
}

async function updateSubscription (stripeEvent, stripeKey) {
  const exists = await subscriptions.Storage.Subscription.findOne({
    attributes: ['subscriptionid', 'appid'],
    where: {
      subscriptionid: stripeEvent.data.object.id
    }
  })
  if (!exists || !exists.dataValues || !exists.dataValues.subscriptionid) {
    return
  }
  Log.info('update subscription', stripeEvent.data.object)
  const stripeObject = await load(stripeEvent.data.object.id, 'subscriptions', stripeKey)
  return subscriptions.Storage.Subscription.update({
    stripeObject
  }, {
    where: {
      subscriptionid: exists.dataValues.subscriptionid,
      appid: exists.dataValues.appid
    }
  })
}
