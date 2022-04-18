const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.PlansCount.get(req)
  const plans = await global.api.administrator.subscriptions.Plans.get(req)
  const offset = req.query ? req.query.offset || 0 : 0
  if (plans && plans.length) {
    for (const i in plans) {
      const plan = formatStripeObject(plans[i])
      plans[i] = plan
    }
  }
  req.data = { plans, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  const removeElements = []
  if (req.data.plans && req.data.plans.length) {
    dashboard.HTML.renderTable(doc, req.data.plans, 'plan-row', 'plans-table')
    for (const plan of req.data.plans) {
      if (plan.unpublishedAt) {
        removeElements.push(`published-plan-${plan.planid}`, `draft-plan-${plan.planid}`)
      } else if (plan.publishedAt) {
        removeElements.push(`unpublished-plan-${plan.planid}`, `draft-plan-${plan.planid}`)
      } else {
        removeElements.push(`published-plan-${plan.planid}`, `unpublished-plan-${plan.planid}`)
      }
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
