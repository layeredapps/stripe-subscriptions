const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-plan.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
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
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      plan: {
        planid: req.query.planid
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
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.subscriptions.DeletePlan.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?planid=${req.query.planid}&message=success`
    })
    return res.end()
  }
}
