const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.planid) {
    req.error = 'invalid-planid'
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
  const plan = formatStripeObject(planRaw)
  if (!plan.publishedAt) {
    req.error = 'invalid-plan'
    return
  }
  if (plan.unpublishedAt) {
    req.error = 'unpublished-plan'
    return
  }

  req.data = { plan }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.plan, 'plan')
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('plans-table')
    }
  }
  if (!req.data.plan.trial_period_days) {
    removeElements.push('trial')
  }
  if (req.data.plan.usage_type === 'metered') {
    removeElements.push('licensed')
  } else {
    removeElements.push('metered')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
