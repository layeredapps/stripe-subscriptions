const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-subscription.js')
const statuses = ['active', 'trialing', 'past_due', 'canceled', 'unpaid']
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
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
        subscriptionid: req.query.subscriptionid
      }
    }
    return
  }
  const subscription = formatStripeObject(subscriptionRaw)
  req.data = { subscription }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.subscription, 'subscription')
  navbar.setup(doc, req.data.subscription)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('subscriptions-table')
    }
  } else {
    if (req.data.subscription.cancel_at_period_end) {
      req.data.subscription.status = 'canceling'
    }
    for (const status of statuses) {
      if (req.data.subscription.status === status) {
        continue
      }
      removeElements.push(`${status}-subscription-${req.data.subscription.id}`)
    }
    if (req.data.subscription.status === 'active') {
      removeElements.push(`canceling-subscription-${req.data.subscription.id}`)
    } else {
      if (req.data.subscription.cancel_at_period_end) {
        removeElements.push(`cancel-subscription-link-${req.data.subscription.id}`)
      } else {
        removeElements.push(`canceling-subscription-${req.data.subscription.id}`)
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    if (!element) {
      continue
    }
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
