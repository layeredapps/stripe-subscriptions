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
  if (req.data.plans && req.data.plans.length) {
    dashboard.HTML.renderTable(doc, req.data.plans, 'plan-row', 'plans-table')
    for (const plan of req.data.plans) {
      const draftPlan = doc.getElementById(`draft-plan-${plan.planid}`)
      const publishedPlan = doc.getElementById(`published-plan-${plan.planid}`)
      const unpublishedPlan = doc.getElementById(`unpublished-plan-${plan.planid}`)
      if (plan.unpublishedAt) {
        draftPlan.parentNode.removeChild(draftPlan)
        publishedPlan.parentNode.removeChild(publishedPlan)
      } else if (plan.publishedAt) {
        draftPlan.parentNode.removeChild(draftPlan)
        unpublishedPlan.parentNode.removeChild(unpublishedPlan)
      } else {
        publishedPlan.parentNode.removeChild(publishedPlan)
        unpublishedPlan.parentNode.removeChild(unpublishedPlan)
      }
    }
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noPlans = doc.getElementById('no-plans')
    noPlans.parentNode.removeChild(noPlans)
  } else {
    const plansTable = doc.getElementById('plans-table')
    plansTable.parentNode.removeChild(plansTable)
  }
  return dashboard.Response.end(req, res, doc)
}
