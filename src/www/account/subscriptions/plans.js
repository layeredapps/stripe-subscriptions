const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')
const navbar = require('./navbar.s')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (global.viewSubscriptionPlans === false) {
    return
  }
  const total = await global.api.user.subscriptions.PublishedPlansCount.get(req)
  const plans = await global.api.user.subscriptions.PublishedPlans.get(req)
  for (const i in plans) {
    const plan = formatStripeObject(plans[i])
    plans[i] = plan
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { plans, total, offset }
}

async function renderPage (req, res) {
  if (global.viewSubscriptionPlans === false) {
    return dashboard.Response.redirect(req, res, '/account/subscriptions')
  }
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  await navbar.setup(doc)
  const removeElements = []
  if (req.data.plans && req.data.plans.length) {
    dashboard.HTML.renderTable(doc, req.data.plans, 'plan-row', 'plans-table')
    for (const plan of req.data.plans) {
      if (!plan.trial_period_days) {
        removeElements.push(`trial-plan-${plan.planid}`)
      } else {
        removeElements.push(`no-trial-plan-${plan.planid}`)
      }
      if (!plan.amount) {
        removeElements.push(`amount-plan-${plan.planid}`)
      } else {
        removeElements.push(`free-plan-${plan.planid}`)
      }
    }
    if (req.data.total <= global.pageSize) {
      removeElements.push('page-links')
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    removeElements.push('no-plans')
  } else {
    removeElements.push('plans-table')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
