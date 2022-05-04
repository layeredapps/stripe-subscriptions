const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-plan.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
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
    planRaw = await global.api.administrator.subscriptions.Plan.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-planid' || error.message === 'invalid-plan') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      plan: {
        planid: req.query.planid
      }
    }
    return
  }
  const plan = formatStripeObject(planRaw)
  req.data = { plan }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.plan, 'plan')
  navbar.setup(doc, req.data.plan)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('plans-table')
    }
  } else {
    if (req.data.plan.unpublishedAt) {
      removeElements.push('published', 'not-published')
    } else if (req.data.plan.publishedAt) {
      removeElements.push('unpublished', 'not-published')
    } else {
      removeElements.push('published', 'unpublished')
    }
    if (!req.data.plan.trial_period_days) {
      removeElements.push('trial')
    } else {
      removeElements.push('no-trial')
    }
    if (!req.data.plan.amount) {
      removeElements.push('amount')
    } else {
      removeElements.push('free')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
