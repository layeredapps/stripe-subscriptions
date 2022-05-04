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
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const plansTable = doc.getElementById('plans-table')
      plansTable.parentNode.removeChild(plansTable)
      return dashboard.Response.end(req, res, doc)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
