const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-plan.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.planid) {
    throw new Error('invalid-planid')
  }
  const planRaw = await global.api.administrator.subscriptions.Plan.get(req)
  const plan = formatStripeObject(planRaw)
  req.data = { plan }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.plan, 'plan')
  navbar.setup(doc, req.data.plan)
  if (req.data.plan.unpublishedAt) {
    const published = doc.getElementById('published')
    published.parentNode.removeChild(published)
    const notPublished = doc.getElementById('not-published')
    notPublished.parentNode.removeChild(notPublished)
  } else if (req.data.plan.publishedAt) {
    const unpublished = doc.getElementById('unpublished')
    unpublished.parentNode.removeChild(unpublished)
    const notPublished = doc.getElementById('not-published')
    notPublished.parentNode.removeChild(notPublished)
  } else {
    const published = doc.getElementById('published')
    published.parentNode.removeChild(published)
    const unpublished = doc.getElementById('unpublished')
    unpublished.parentNode.removeChild(unpublished)
  }
  return dashboard.Response.end(req, res, doc)
}
