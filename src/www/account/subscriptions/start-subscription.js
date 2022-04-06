const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.all = true
  const plans = await global.api.user.subscriptions.PublishedPlans.get(req)
  if (plans && plans.length) {
    for (const i in plans) {
      const plan = formatStripeObject(plans[i])
      plans[i] = plan
    }
  }
  req.data = { plans }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success' || messageTemplate === 'duplicate-subscription') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.plans && req.data.plans.length) {
    dashboard.HTML.renderList(doc, req.data.plans, 'plan-option', 'planid')
    if (req.query.planid && req.method === 'GET') {
      dashboard.HTML.setSelectedOptionByValue(doc, 'planid', req.query.planid)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || !req.body.planid) {
    return renderPage(req, res)
  }
  if (!req.data.plans || !req.data.plans.length) {
    return renderPage(req, res, 'invalid-planid')
  }
  let found = false
  for (const plan of req.data.plans) {
    found = plan.id === req.body.planid
    if (found) {
      break
    }
  }
  req.query.accountid = req.account.accountid
  const customers = await global.api.user.subscriptions.Customers.get(req)
  if (!customers || !customers.length) {
    return dashboard.Response.redirect(req, res, `/account/subscriptions/create-billing-profile?return-url=/account/subscriptions/confirm-subscription%3Fplanid=${req.body.planid}`)
  }
  return dashboard.Response.redirect(req, res, `/account/subscriptions/confirm-subscription?planid=${req.body.planid}`)
}
