const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const plans = await global.api.administrator.subscriptions.Plans.get(req)
  if (plans && plans.length) {
    for (const i in plans) {
      const plan = formatStripeObject(plans[i])
      plans[i] = plan
    }
  }
  const coupons = await global.api.administrator.subscriptions.Coupons.get(req)
  if (coupons && coupons.length) {
    for (const i in coupons) {
      const coupon = formatStripeObject(coupons[i])
      coupons[i] = coupon
    }
  }
  delete (req.query.couponid)
  const subscriptions = await global.api.administrator.subscriptions.Subscriptions.get(req)
  if (subscriptions && subscriptions.length) {
    for (const i in subscriptions) {
      const subscription = formatStripeObject(subscriptions[i])
      subscriptions[i] = subscription
    }
  }
  // subscriptions chart
  req.query.keys = dashboard.Metrics.metricKeys('subscriptions-created').join(',')
  const subscriptionsChart = await global.api.administrator.MetricKeys.get(req)
  const subscriptionsChartMaximum = dashboard.Metrics.maximumDay(subscriptionsChart)
  const subscriptionsChartDays = dashboard.Metrics.days(subscriptionsChart, subscriptionsChartMaximum)
  const subscriptionsChartHighlights = dashboard.Metrics.highlights(subscriptionsChart, subscriptionsChartDays)
  const subscriptionsChartValues = dashboard.Metrics.chartValues(subscriptionsChartMaximum)
  // invoices chart
  req.query.keys = dashboard.Metrics.metricKeys('invoices-created').join(',')
  const invoicesChart = await global.api.administrator.MetricKeys.get(req)
  const invoicesChartMaximum = dashboard.Metrics.maximumDay(invoicesChart)
  const invoicesChartDays = dashboard.Metrics.days(invoicesChart, invoicesChartMaximum)
  const invoicesChartHighlights = dashboard.Metrics.highlights(invoicesChart, invoicesChartDays)
  const invoicesChartValues = dashboard.Metrics.chartValues(invoicesChartMaximum)
  // charges chart
  req.query.keys = dashboard.Metrics.metricKeys('charges-created').join(',')
  const chargesChart = await global.api.administrator.MetricKeys.get(req)
  const chargesChartMaximum = dashboard.Metrics.maximumDay(chargesChart)
  const chargesChartDays = dashboard.Metrics.days(chargesChart, chargesChartMaximum)
  const chargesChartHighlights = dashboard.Metrics.highlights(chargesChart, chargesChartDays)
  const chargesChartValues = dashboard.Metrics.chartValues(chargesChartMaximum)
  req.data = {
    plans,
    coupons,
    subscriptions,
    subscriptionsChartDays,
    subscriptionsChartHighlights,
    subscriptionsChartValues,
    invoicesChartDays,
    invoicesChartHighlights,
    invoicesChartValues,
    chargesChartDays,
    chargesChartHighlights,
    chargesChartValues
  }
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
    removeElements.push('no-plans')
  } else {
    removeElements.push('plans-table')
  }
  if (req.data.coupons && req.data.coupons.length) {
    dashboard.HTML.renderTable(doc, req.data.coupons, 'coupon-row', 'coupons-table')
    for (const coupon of req.data.coupons) {
      if (coupon.unpublishedAt) {
        removeElements.push(`draft-coupon-${coupon.id}`, `published-coupon-${coupon.id}`)
      } else if (coupon.publishedAt) {
        removeElements.push(`draft-coupon-${coupon.id}`, `unpublished-coupon-${coupon.id}`)
      } else {
        removeElements.push(`published-coupon-${coupon.id}`, `unpublished-coupon-${coupon.id}`)
      }
      if (coupon.amount_off) {
        removeElements.push(`percent_off-${coupon.id}`)
      } else {
        removeElements.push(`amount_off-${coupon.id}`)
      }
    }
    removeElements.push('no-coupons')
  } else {
    removeElements.push('coupons-table')
  }
  if (req.data.subscriptions && req.data.subscriptions.length) {
    dashboard.HTML.renderTable(doc, req.data.subscriptions, 'subscription-row', 'subscriptions-table')
    for (const subscription of req.data.subscriptions) {
      if (!subscription.discount) {
        removeElements.push(`has-discount-${subscription.id}`)
      } else {
        removeElements.push(`no-discount-${subscription.id}`)
      }
    }
    removeElements.push('no-subscriptions')
  } else {
    removeElements.push('subscriptions-table')
  }
  if (req.data.subscriptionsChartDays && req.data.subscriptionsChartDays.length) {
    dashboard.HTML.renderList(doc, req.data.subscriptionsChartDays, 'chart-column', 'subscriptions-chart')
    dashboard.HTML.renderList(doc, req.data.subscriptionsChartValues, 'chart-value', 'subscriptions-values')
    dashboard.HTML.renderTemplate(doc, req.data.subscriptionsChartHighlights, 'metric-highlights', 'subscriptions-highlights')
  } else {
    removeElements.push('subscriptions-chart-container')
  }
  if (req.data.invoicesChartDays && req.data.invoicesChartDays.length) {
    dashboard.HTML.renderList(doc, req.data.invoicesChartDays, 'chart-column', 'invoices-chart')
    dashboard.HTML.renderList(doc, req.data.invoicesChartValues, 'chart-value', 'invoices-values')
    dashboard.HTML.renderTemplate(doc, req.data.invoicesChartHighlights, 'metric-highlights', 'invoices-highlights')
  } else {
    removeElements.push('invoices-chart-container')
  }
  if (req.data.chargesChartDays && req.data.chargesChartDays.length) {
    dashboard.HTML.renderList(doc, req.data.chargesChartDays, 'chart-column', 'charges-chart')
    dashboard.HTML.renderList(doc, req.data.chargesChartValues, 'chart-value', 'charges-values')
    dashboard.HTML.renderTemplate(doc, req.data.chargesChartHighlights, 'metric-highlights', 'charges-highlights')
  } else {
    removeElements.push('charges-chart-container')
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
