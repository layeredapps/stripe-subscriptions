const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  const products = await global.api.administrator.subscriptions.Products.get(req)
  const active = []
  if (products && products.length) {
    for (const i in products) {
      const product = formatStripeObject(products[i])
      if (product.active) {
        active.push(product)
      }
    }
  }
  req.data = { products: active }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.data.products && req.data.products.length) {
    dashboard.HTML.renderList(doc, req.data.products, 'product-option-template', 'productid')
  }
  if (req.body) {
    dashboard.HTML.setSelectedOptionByValue(doc, 'productid', req.body.productid || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'currency', req.body.currency || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'billing_scheme', req.body.billing_scheme || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'tax_behavior', req.body.tax_behavior || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'type', req.body.type || '')
    const nicknameField = doc.getElementById('nickname')
    nicknameField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.nickname || ''))
    if (req.body.billing_scheme === 'per_unit') {
      const amountField = doc.getElementById('unit_amount')
      amountField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.unit_amount || req.body.unit_amount_decimal || ''))
      if (req.body.transform_quantity_divide_by) {
        const divideField = doc.getElementById('transform_quantity_divide_by')
        divideField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.transform_quantity_divide_by || ''))
        if (req.body.transform_quantity_round) {
          dashboard.HTML.setSelectedOptionByValue(doc, 'transform_quantity_round', req.body.transform_quantity_round || '')
        }
      }
    } else {
      let tier = 0
      while (true) {
        tier++
        const unitAmount = req.body[`tier${tier}_unit_amount`]
        const flatAmount = req.body[`tier${tier}_flat_amount`]
        const upto = req.body[`tier${tier}_up_to`]
        if (!unitAmount && !flatAmount && !upto) {
          break
        }
        const unitAmountField = doc.getElementById(`tier${tier}_unit_amount`)
        unitAmountField.setAttribute('value', dashboard.Format.replaceQuotes(unitAmount || ''))
        const flatAmountField = doc.getElementById(`tier${tier}_flat_amount`)
        flatAmountField.setAttribute('value', dashboard.Format.replaceQuotes(flatAmount || ''))
        const uptoField = doc.getElementById(`tier${tier}_up_to`)
        uptoField.setAttribute('value', dashboard.Format.replaceQuotes(upto || ''))
      }
    }
    if (req.body.type === 'recurring') {
      dashboard.HTML.setSelectedOptionByValue(doc, 'recurring_interval', dashboard.Format.replaceQuotes(req.body.recurring_interval || ''))
      dashboard.HTML.setSelectedOptionByValue(doc, 'recurring_usage_type', dashboard.Format.replaceQuotes(req.body.recurring_usage_type || ''))
      dashboard.HTML.setSelectedOptionByValue(doc, 'recurring_aggregate_usage', dashboard.Format.replaceQuotes(req.body.recurring_aggregate_usage || ''))
      const intervalCountField = doc.getElementById('recurring_interval_count')
      intervalCountField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.recurring_interval_count || ''))
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.productid || !req.body.productid.length) {
    return renderPage(req, res, 'invalid-productid')
  }
  if (!req.data.products || !req.data.products.length) {
    return renderPage(req, res, 'invalid-productid')
  }
  let foundProduct = false
  for (const product of req.data.products) {
    if (product.productid === req.body.productid) {
      foundProduct = true
      break
    }
  }
  if (!foundProduct) {
    return renderPage(req, res, 'invalid-productid')
  }
  if (!req.body.nickname || !req.body.nickname.length) {
    return renderPage(req, res, 'invalid-nickname')
  }
  if (!req.body.type || (req.body.type !== 'one_time' && req.body.type !== 'recurring')) {
    return renderPage(req, res, 'invalid-type')
  }
  if (!req.body.tax_behavior || (req.body.tax_behavior !== 'inclusive' && req.body.tax_behavior !== 'exclusive')) {
    return renderPage(req, res, 'invalid-tax_behavior')
  }
  if (!req.body.currency || req.body.currency.length !== 3) {
    return renderPage(req, res, 'invalid-currency')
  }
  if (!req.body.billing_scheme || (req.body.billing_scheme !== 'per_unit' && req.body.billing_scheme !== 'tiered')) {
    return renderPage(req, res, 'invalid-billing_scheme')
  }
  // recurring billing
  if (req.body.type === 'recurring') {
    if (!req.body.recurring_interval || (req.body.recurring_interval !== 'day' && req.body.recurring_interval !== 'week' && req.body.recurring_interval !== 'month' && req.body.recurring_interval !== 'year')) {
      return renderPage(req, res, 'invalid-recurring_interval')
    }
    try {
      const intervalCount = parseInt(req.body.recurring_interval_count, 10)
      if (!intervalCount || intervalCount < 1) {
        return renderPage(req, res, 'invalid-recurring_interval_count')
      }
      if (req.body.recurring_interval === 'day' && intervalCount > 365) {
        return renderPage(req, res, 'invalid-recurring_interval_count')
      }
      if (req.body.recurring_interval === 'week' && intervalCount > 52) {
        return renderPage(req, res, 'invalid-recurring_interval_count')
      }
      if (req.body.recurring_interval === 'month' && intervalCount > 12) {
        return renderPage(req, res, 'invalid-recurring_interval_count')
      }
      if (req.body.recurring_interval === 'year' && intervalCount > 1) {
        return renderPage(req, res, 'invalid-recurring_interval_count')
      }
    } catch (s) {
      return renderPage(req, res, 'invalid-recurring_interval_count')
    }
    if (!req.body.recurring_usage_type || (req.body.recurring_usage_type !== 'licensed' && req.body.recurring_usage_type !== 'metered')) {
      return renderPage(req, res, 'invalid-recurring_usage_type')
    }
    if (!req.body.recurring_aggregate_usage || (req.body.recurring_aggregate_usage !== 'sum' && req.body.recurring_aggregate_usage !== 'last_during_period' && req.body.recurring_aggregate_usage !== 'last_ever' && req.body.recurring_aggregate_usage !== 'max')) {
      return renderPage(req, res, 'invalid-recurring_aggregate_usage')
    }
  }
  // unit amount billing
  if (req.body.billing_scheme === 'per_unit') {
    if (!req.body.unit_amount || !req.body.unit_amount.length) {
      return renderPage(req, res, 'invalid-unit_amount')
    }
    if (req.body.unit_amount.indexOf('.') > -1) {
      try {
        const amount = parseFloat(req.body.unit_amount)
        if (amount < 0) {
          return renderPage(req, res, 'invalid-unit_amount')
        }
      } catch (s) {
        return renderPage(req, res, 'invalid-unit_amount')
      }
      req.body.unit_amount_decimal = req.body.unit_amount
      delete (req.body.unit_amount)
    } else {
      try {
        const amount = parseInt(req.body.unit_amount, 10)
        if (amount < 0) {
          return renderPage(req, res, 'invalid-unit_amount')
        }
      } catch (s) {
        return renderPage(req, res, 'invalid-unit_amount')
      }
    }
    if (req.body.transform_quantity_divide_by) {
      try {
        const divideBy = parseInt(req.body.transform_quantity_divide_by, 10)
        if (divideBy < 0) {
          return renderPage(req, res, 'invalid-transform_quantity_divide_by')
        }
      } catch (s) {
        return renderPage(req, res, 'invalid-transform_quantity_divide_by')
      }
      if (!req.body.transform_quantity_round || (req.body.transform_quantity_round !== 'up' && req.body.transform_quantity_round !== 'down')) {
        return renderPage(req, res, 'invalid-transform_quantity_round')
      }
    }
  }
  // tiered billing
  if (req.body.billing_scheme === 'tiered') {
    if (!req.body.tier_mode || (req.body.tier_mode !== 'graduated' && req.body.tier_mode !== 'volume')) {
      return renderPage(req, res, 'invalid-tier_mode')
    }
    let tier = 0
    let lastTierQuantity = 0
    while (true) {
      tier++
      const unitAmount = req.body[`tier${tier}_unit_amount`]
      const flatAmount = req.body[`tier${tier}_flat_amount`]
      const upto = req.body[`tier${tier}_up_to`]
      if (!unitAmount && !flatAmount && !upto) {
        break
      }
      // unit or flat amount
      if (unitAmount && flatAmount) {
        return renderPage(req, res, 'invalid-tier_ambiguous_amount')
      }
      if (unitAmount) {
        try {
          const amount = parseFloat(unitAmount)
          if (amount < 0) {
            return renderPage(req, res, 'invalid-tier_unit_amount')
          }
        } catch (s) {
          return renderPage(req, res, 'invalid-tier_unit_amount')
        }
      } else {
        try {
          const amount = parseFloat(flatAmount)
          if (amount < 0) {
            return renderPage(req, res, 'invalid-tier_flat_amount')
          }
        } catch (s) {
          return renderPage(req, res, 'invalid-tier_flat_amount')
        }
      }
      // quantity
      if (upto !== 'inf') {
        try {
          const quantity = parseInt(upto, 10)
          if (quantity < 0 || lastTierQuantity > quantity) {
            return renderPage(req, res, 'invalid-tier_up_to')
          }
        } catch (s) {
          return renderPage(req, res, 'invalid-tier_up_to')
        }
      }
      lastTierQuantity = upto
    }
    if (lastTierQuantity !== 'inf') {
      return renderPage(req, res, 'invalid-tier_up_to_inf')
    }
  }
  let price
  try {
    price = await global.api.administrator.subscriptions.CreatePrice.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/administrator/subscriptions/price?priceid=${price.priceid}`
    })
    return res.end()
  }
}
