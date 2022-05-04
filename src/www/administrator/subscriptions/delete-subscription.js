const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-subscription.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.subscriptionid) {
    req.error = 'invalid-subscriptionid'
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  let subscriptionRaw
  try {
    subscriptionRaw = await global.api.administrator.subscriptions.Subscription.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-subscriptionid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      subscription: {
        subscriptionid: ''
      }
    }
    return
  }
  const subscription = formatStripeObject(subscriptionRaw)
  if ((subscription.status !== 'active' && subscription.status !== 'trialing') ||
      subscription.cancel_at_period_end) {
    req.error = 'invalid-subscription'
  }
  req.query.planid = subscription.planid
  let planRaw
  try {
    planRaw = await global.api.administrator.subscriptions.Plan.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-planid' || error.message === 'invalid-plan') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  const plan = formatStripeObject(planRaw)
  req.query.invoiceid = subscription.latest_invoice
  let invoiceRaw
  try {
    invoiceRaw = await global.api.administrator.subscriptions.Invoice.get(req)
  } catch (error) {
    if (error.message === 'invalid-invoiceid' || error.message === 'invalid-invoice') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      subscription: {
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  const invoice = formatStripeObject(invoiceRaw)
  req.data = { subscription, plan, invoice }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
  const removeElements = []
  if (messageTemplate) {
    if (req.removeContents) {
      removeElements.push('submit-form')
    }
    if (req.query.message === 'success') {
      if (req.query.refund === 'credit') {
        dashboard.HTML.renderTemplate(doc, null, 'success-credit', 'message-container')
      } else if (req.query.refund === 'refund') {
        dashboard.HTML.renderTemplate(doc, null, 'success-refund', 'message-container')
      } else {
        dashboard.HTML.renderTemplate(doc, null, 'success', 'message-container')
      }
    } else {
      dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    }
  } else {
    if (!req.data.plan.amount) {
      removeElements.push('refund-label', 'credit-label')
    } else if (req.data.subscription.trial_start && req.data.subscription.trial_end === req.data.subscription.current_period_end) {
      removeElements.push('refund-label', 'credit-label')
    } else {
      if (req.method === 'GET') {
        const ending = doc.getElementById('delay-checkbox')
        ending.setAttribute('checked', true)
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  let type
  try {
    if (req.body && req.body.refund === 'at_period_end') {
      type = 'at_period_end'
      await global.api.administrator.subscriptions.SetSubscriptionCanceled.patch(req)
    } else if (req.body && req.body.refund) {
      type = req.body.refund
      await global.api.administrator.subscriptions.DeleteSubscription.delete(req)
    } else {
      type = 'immediate'
      await global.api.administrator.subscriptions.DeleteSubscription.delete(req)
    }
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?subscriptionid=${req.query.subscriptionid}&message=success&refund=${type}`
    })
    return res.end()
  }
}
