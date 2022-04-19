const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.planid) {
    throw new Error('invalid-planid')
  }
  const planRaw = await global.api.user.subscriptions.PublishedPlan.get(req)
  if (!planRaw) {
    throw new Error('invalid-planid')
  }
  const plan = formatStripeObject(planRaw)
  if (plan.unpublishedAt) {
    throw new Error('invalid-plan')
  }
  req.query.accountid = req.account.accountid
  req.query.all = true
  const customers = await global.api.user.subscriptions.Customers.get(req)
  for (const i in customers) {
    const customer = formatStripeObject(customers[i])
    customers[i] = customer
  }
  req.data = { plan, customers }
}

function renderPage (req, res, messageTemplate) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.plan, 'plan')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, {}, messageTemplate, 'message-container')
  }
  dashboard.HTML.renderTemplate(doc, req.data.plan, 'plan-row', 'plan-table')
  if (req.data.plan.trial_period_days) {
    dashboard.HTML.renderTemplate(doc, req.data.plan, 'charge-later', 'charge')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.plan, 'charge-now', 'charge')
  }
  if (req.data.customers && req.data.customers.length) {
    dashboard.HTML.renderList(doc, req.data.customers, 'customer-option', 'customerid')
    if (req.body) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'customerid', req.body.customerid)
    }
  } else {
    const existingContainer = doc.getElementById('existing-container')
    existingContainer.parentNode.removeChild(existingContainer)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.customerid || !req.data.customers || !req.data.customers.length) {
    return renderPage(req, res, 'invalid-customerid')
  }
  let found = false
  for (const customer of req.data.customers) {
    found = customer.id === req.body.customerid
    if (found) {
      if (req.data.plan.amount && (!customer.invoice_settings || !customer.invoice_settings.default_payment_method)) {
        return renderPage(req, res, 'invalid-paymentmethodid')
      }
      if (req.data.plan.amount) {
        req.body.paymentmethodid = customer.invoice_settings.default_payment_method
      }
      break
    }
  }
  if (!found) {
    return renderPage(req, res, 'invalid-customerid')
  }
  req.query.customerid = req.body.customerid
  req.body.planid = req.query.planid

  try {
    await global.api.user.subscriptions.CreateSubscription.post(req)
    return dashboard.Response.redirect(req, res, '/home')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
