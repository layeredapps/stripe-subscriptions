const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.customerid) {
    req.error = 'invalid-customerid'
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    return
  }
  let customerRaw
  try {
    customerRaw = await global.api.user.subscriptions.Customer.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    if (error.message === 'invalid-customerid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const customer = formatStripeObject(customerRaw)
  if (customer.invoice_settings.default_payment_method) {
    req.query.paymentmethodid = customer.invoice_settings.default_payment_method
    const paymentMethod = await global.api.user.subscriptions.PaymentMethod.get(req)
    customer.paymentMethod = formatStripeObject(paymentMethod)
  } else {
    customer.paymentMethod = {
      card: {
      }
    }
  }
  req.query.accountid = req.account.accountid
  customer.numSubscriptions = await global.api.user.subscriptions.SubscriptionsCount.get(req)
  req.query.all = true
  const invoices = await global.api.user.subscriptions.Invoices.get(req)
  const subscriptions = await global.api.user.subscriptions.Subscriptions.get(req)
  req.data = { customer, invoices, subscriptions }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('customers-table')
    }
  } else {
    if (!req.data.customer.paymentMethod.id) {
      removeElements.push('payment-method-brand', 'payment-method-last4', 'payment-method-expiration')
    } else {
      removeElements.push('no-payment-method')
    }
    if (!req.data.customer.discount) {
      removeElements.push('has-discount')
    }
    if (req.data.customer.balance <= 0) {
      removeElements.push('has-balance')
    }
    if (!req.data.customer.delinquent) {
      removeElements.push('is-delinquent')
    }
    if (req.data.invoices && req.data.invoices.length) {
      dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
      removeElements.push('no-invoices')
    } else {
      removeElements.push('invoices-table')
    }
    if (req.data.subscriptions && req.data.subscriptions.length) {
      dashboard.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
      removeElements.push('no-subscriptions')
    } else {
      removeElements.push('subscriptions-table')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
