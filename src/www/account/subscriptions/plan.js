const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.planid) {
    throw new Error('invalid-planid')
  }
  const planRaw = await global.api.user.subscriptions.PublishedPlan.get(req)
  const plan = formatStripeObject(planRaw)
  if (!plan.publishedAt || plan.unpublishedAt) {
    throw new Error('invalid-plan')
  }
  req.data = { plan }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.plan, 'plan')
  return dashboard.Response.end(req, res, doc)
}
