const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.planid) {
    req.error = 'invalid-planid'
    req.removeContents = true
    req.data = {
      plan: {
        planid: ''
      }
    }
    return
  }
  let planRaw
  try {
    planRaw = await global.api.user.subscriptions.PublishedPlan.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      invoice: {
        planid: ''
      }
    }
    if (error.message === 'invalid-planid' || error.message === 'invalid-plan') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  if (!planRaw) {
    req.removeContents = true
    req.error = 'invalid-planid'
    return
  }
  const plan = formatStripeObject(planRaw)
  if (plan.unpublishedAt) {
    req.removeContents = true
    req.error = 'invalid-plan'
    return
  }
  req.query.accountid = req.account.accountid
  req.query.all = true
  const customers = await global.api.user.subscriptions.Customers.get(req)
  let hasPaymentMethod, defaultCustomer
  for (const i in customers) {
    const customer = formatStripeObject(customers[i])
    customers[i] = customer
    hasPaymentMethod = hasPaymentMethod || customer.default_source || (customer.invoice_settings && customer.invoice_settings.default_payment_method)
    defaultCustomer = defaultCustomer || customer
  }
  if (plan.amount && !hasPaymentMethod) {
    req.error = 'invalid-paymentmethodid'
    return
  }
  req.data = { plan, customers, defaultCustomer }
}

async function renderPage (req, res, messageTemplate) {
  if (global.automaticConfirmSubscription && req.data.defaultCustomer) {
    req.body = {
      customerid: req.data.defaultCustomer.customerid
    }
    return submitForm(req, res)
  }
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.plan, 'plan')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, {}, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  dashboard.HTML.renderTemplate(doc, req.data.plan, 'plan-row', 'plan-table')
  if (req.data.plan.trial_period_days) {
    dashboard.HTML.renderTemplate(doc, req.data.plan, `${req.data.plan.usage_type}-charge-later`, 'charge')
  } else {
    dashboard.HTML.renderTemplate(doc, req.data.plan, `${req.data.plan.usage_type}-charge-now`, 'charge')
  }
  if (req.data.customers && req.data.customers.length) {
    dashboard.HTML.renderList(doc, req.data.customers, 'customer-option', 'customerid')
    if (req.body) {
      const checked = doc.getElementById(req.body.customerid)
      checked.setAttribute('checked', true)
    } else {
      const checked = doc.getElementById(req.data.customers[0].customerid)
      checked.setAttribute('checked', true)
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
      if (req.data.plan.amount && !customer.default_source && (!customer.invoice_settings || !customer.invoice_settings.default_payment_method)) {
        return renderPage(req, res, 'invalid-paymentmethodid')
      }
      if (req.data.plan.amount) {
        req.body.paymentmethodid = customer.default_source || customer.invoice_settings.default_payment_method
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
    return dashboard.Response.redirect(req, res, global.homePath || '/home')
  } catch (error) {
    return renderPage(req, res, error.message)
  }
}
