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
  if (plan.unpublishedAt) {
    req.error = 'unpublished-plan'
    req.removeContents = true
    req.data = {
      plan: {
        planid: ''
      }
    }
    return
  }
  const products = await global.api.administrator.subscriptions.Products.get(req)
  const published = []
  if (products && products.length) {
    for (const i in products) {
      const product = formatStripeObject(products[i])
      if (!product.publishedAt || product.unpublishedAt) {
        continue
      }
      published.push(product)
    }
  }
  req.data = { plan, products: published }
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
      return dashboard.Response.end(req, res, doc)
    }
  }
  const trialPeriodDaysField = doc.getElementById('trial_period_days')
  trialPeriodDaysField.setAttribute('value', req.body ? (req.body.trial_period_days || '').split("'").join('&quot;') : req.data.plan.trial_period_days || 0)
  if (req.data.products && req.data.products.length) {
    dashboard.HTML.renderList(doc, req.data.products, 'product-option-template', 'productid')
  }
  dashboard.HTML.setSelectedOptionByValue(doc, 'productid', req.body ? req.body.productid : req.data.plan.productid)
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.productid) {
    return renderPage(req, res, 'invalid-productid')
  }
  if (req.body.trial_period_days) {
    try {
      const trialPeriodDays = parseInt(req.body.trial_period_days, 10)
      if (!trialPeriodDays || trialPeriodDays < 0 || trialPeriodDays > 365) {
        return renderPage(req, res, 'invalid-trial_period_days')
      }
    } catch (s) {
      return renderPage(req, res, 'invalid-trial_period_days')
    }
  }
  req.query.productid = req.body.productid
  let product
  try {
    product = await global.api.administrator.subscriptions.Product.get(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (!product) {
    return renderPage(req, res, 'invalid-productid')
  }
  if (product.unpublishedAt || !product.publishedAt) {
    return renderPage(req, res, 'invalid-product')
  }
  try {
    await global.api.administrator.subscriptions.UpdatePlan.patch(req)
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
