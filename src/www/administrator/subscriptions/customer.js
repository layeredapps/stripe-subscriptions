const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-customer.js')
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
    customerRaw = await global.api.administrator.subscriptions.Customer.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    if (error.message === 'invalid-customerid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const customer = formatStripeObject(customerRaw)
  customer.discount = customer.discount || {
    coupon: {}
  }
  req.query.all = true
  const invoices = await global.api.administrator.subscriptions.Invoices.get(req)
  if (invoices && invoices.length) {
    for (const i in invoices) {
      const invoice = formatStripeObject(invoices[i])
      invoices[i] = invoice
    }
  }
  const subscriptions = await global.api.administrator.subscriptions.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    for (const i in subscriptions) {
      const subscription = formatStripeObject(subscriptions[i])
      subscriptions[i] = subscription
    }
  }
  req.data = { customer, invoices, subscriptions }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
  navbar.setup(doc, req.data.customer)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('customers-table')
    }
  } else {
    if (!req.data.customer.delinquent) {
      removeElements.push('delinquent-amount')
    }
    if (!req.data.customer.discount || !req.data.customer.discount.coupon || !req.data.customer.discount.coupon.id) {
      removeElements.push('discount')
    }
    if (!req.data.customer.account_balance) {
      removeElements.push('account-balance')
    }
    if (req.data.invoices && req.data.invoices.length) {
      dashboard.HTML.renderTable(doc, req.data.invoices, 'invoice-row', 'invoices-table')
      for (const invoice of req.data.invoices) {
        if (invoice.status === 'open') {
          removeElements.push(`paid-${invoice.id}`)
        } else {
          removeElements.push(`open-${invoice.id}`)
        }
      }
    } else {
      removeElements.push('invoices-container')
    }
    if (req.data.subscriptions && req.data.subscriptions.length) {
      dashboard.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
      const statuses = ['active', 'trialing', 'past_due', 'canceled', 'unpaid']
      for (const subscription of req.data.subscriptions) {
        if (subscription.cancel_at_period_end) {
          subscription.status = 'canceling'
        }
        for (const status of statuses) {
          if (subscription.status === status) {
            continue
          }
          removeElements.push(`${status}-subscription-${subscription.id}`)
        }
        if (subscription.status === 'active') {
          removeElements.push(`canceling-subscription-${subscription.id}`)
        } else {
          if (!subscription.cancel_at_period_end) {
            removeElements.push(`canceling-subscription-${subscription.id}`)
          }
        }
      }
    } else {
      removeElements.push('subscriptions-container')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
