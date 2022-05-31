const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.body || !req.body.productid || !req.body.productid.length) {
      throw new Error('invalid-productid')
    }
    if (!req.body.currency || req.body.currency.length !== 3) {
      throw new Error('invalid-currency')
    }
    req.query = req.query || {}
    req.query.productid = req.body.productid
    const product = await global.api.administrator.subscriptions.Product.get(req)
    if (!product) {
      throw new Error('invalid-productid')
    }
    if (!product.publishedAt || product.unpublishedAt) {
      throw new Error('invalid-product')
    }
    if (!req.body.tax_behavior || (req.body.tax_behavior !== 'inclusive' && req.body.tax_behavior !== 'exclusive')) {
      throw new Error('invalid-tax_behavior')
    }
    if (req.body.recurring_usage_type && req.body.recurring_usage_type !== 'metered' && req.body.recurring_usage_type !== 'licensed') {
      throw new Error('invalid-recurring_usage_type')
    }
    if (!req.body.unit_amount && req.body.billing_scheme === 'per_unit') {
      throw new Error('invalid-unit_amount')
    }
    if (req.body.unit_amount) {
      if (req.body.unit_amount.indexOf('.') === -1) {
        try {
          const amount = parseInt(req.body.unit_amount, 10)
          if (req.body.unit_amount !== amount.toString()) {
            throw new Error('invalid-unit_amount')
          }
          if (amount < 0) {
            throw new Error('invalid-unit_amount')
          }
        } catch (s) {
          throw new Error('invalid-unit_amount')
        }
      } else {
        try {
          const amount = parseFloat(req.body.unit_amount)
          if (req.body.unit_amount !== amount.toString()) {
            throw new Error('invalid-unit_amount')
          }
          if (amount < 0) {
            throw new Error('invalid-unit_amount')
          }
        } catch (s) {
          throw new Error('invalid-unit_amount')
        }
        req.body.unit_amount_decimal = req.body.unit_amount
        delete (req.body.unit_amount)
      }
    }
    if (req.body.recurring_interval &&
        req.body.recurring_interval !== 'day' &&
        req.body.recurring_interval !== 'week' &&
        req.body.recurring_interval !== 'month' &&
        req.body.recurring_interval !== 'year') {
      throw new Error('invalid-recurring_interval')
    }
    if (req.body.recurring_interval && !req.body.recurring_interval_count) {
      throw new Error('invalid-recurring_interval_count')
    }
    if (req.body.recurring_interval) {
      try {
        req.body.recurring_interval_count = parseInt(req.body.recurring_interval_count, 10)
        if (!req.body.recurring_interval_count) {
          throw new Error('invalid-recurring_interval_count')
        }
      } catch (s) {
        throw new Error('invalid-recurring_interval_count')
      }
      if (req.body.recurring_interval_count < 1) {
        throw new Error('invalid-recurring_interval_count')
      }
      if (req.body.recurring_interval === 'day' && req.body.recurring_interval_count > 365) {
        throw new Error('invalid-recurring_interval_count')
      } else if (req.body.recurring_interval === 'week' && req.body.recurring_interval_count > 52) {
        throw new Error('invalid-recurring_interval_count')
      } else if (req.body.recurring_interval === 'month' && req.body.recurring_interval_count > 12) {
        throw new Error('invalid-recurring_interval_count')
      } else if (req.body.recurring_interval_count > 1) {
        throw new Error('invalid-recurring_interval_count')
      }
    }
    if (req.body.recurring_usage_type === 'metered') {
      if (req.body.recurring_aggregate_usage !== 'sum' &&
          req.body.recurring_aggregate_usage !== 'last_during_period' &&
          req.body.recurring_aggregate_usage !== 'last_ever' &&
          req.body.recurring_aggregate_usage !== 'max') {
        throw new Error('invalid-recurring_aggregate_usage')
      }
    }
    if (req.body.billing_scheme && req.body.billing_scheme !== 'per_unit' && req.body.billing_scheme !== 'tiered') {
      throw new Error('invalid-billing_scheme')
    }
    if (req.body.billing_scheme === 'per_unit') {
      if (req.body.transform_quantity_divide_by) {
        try {
          const amount = parseFloat(req.body.transform_quantity_divide_by)
          if (req.body.transform_quantity_divide_by !== amount.toString()) {
            throw new Error('invalid-transform_quantity_divide_by')
          }
          if (amount < 0) {
            throw new Error('invalid-transform_quantity_divide_by')
          }
        } catch (s) {
          throw new Error('invalid-transform_quantity_divide_by')
        }
        if (req.body.transform_quantity_round !== 'up' && req.body.transform_quantity_round !== 'down') {
          throw new Error('invalid-transform_quantity_round')
        }
      }
    } else if (req.body.billing_scheme === 'tiered') {
      if (req.body.tiers_mode !== 'graduated' && req.body.tiers_mode !== 'volume') {
        throw new Error('invalid-tiers_mode')
      }
    }
    const priceInfo = {
      billing_scheme: req.body.billing_scheme,
      nickname: req.body.nickname,
      product: req.body.productid,
      currency: req.body.currency,
      tax_behavior: req.body.tax_behavior,
      unit_amount: req.body.unit_amount || undefined,
      unit_amount_decimal: req.body.unit_amount_decimal || undefined,
      recurring: {
        interval: req.body.recurring_interval,
        interval_count: req.body.recurring_interval_count || 0,
        usage_type: req.body.recurring_usage_type || 'licensed'
      }
    }
    if (req.body.recurring_usage_type === 'metered') {
      priceInfo.recurring.aggregate_usage = req.body.recurring_aggregate_usage
    }
    if (req.body.billing_scheme === 'tiered') {
      priceInfo.tiers_mode = req.body.tiers_mode
      priceInfo.tiers = []
      let tierNumber = 1
      while (true) {
        if (!req.body[`tier${tierNumber}_up_to`]) {
          break
        }
        if (req.body[`tier${tierNumber}_up_to`] !== 'inf') {
          try {
            const upto = parseInt(req.body[`tier${tierNumber}_up_to`], 10)
            if (req.body[`tier${tierNumber}_up_to`] !== upto.toString()) {
              throw new Error('invalid-tier_up_to')
            }
            if (upto < 0) {
              throw new Error('invalid-tier_up_to')
            }
          } catch (s) {
            throw new Error('invalid-tier_up_to')
          }
        }
        const tier = {
          up_to: req.body[`tier${tierNumber}_up_to`]
        }
        if (req.body[`tier${tierNumber}_unit_amount`]) {
          if (req.body[`tier${tierNumber}_unit_amount`].indexOf('.') === -1) {
            try {
              const amount = parseInt(req.body[`tier${tierNumber}_unit_amount`], 10)
              if (req.body[`tier${tierNumber}_unit_amount`] !== amount.toString()) {
                throw new Error('invalid-tier_unit_amount')
              }
              if (amount < 0) {
                throw new Error('invalid-tier_unit_amount')
              }
            } catch (s) {
              throw new Error('invalid-tier_unit_amount')
            }
            tier.unit_amount = req.body[`tier${tierNumber}_unit_amount`]
          } else {
            try {
              const amount = parseFloat(req.body[`tier${tierNumber}_unit_amount`])
              if (req.body[`tier${tierNumber}_unit_amount`] !== amount.toString()) {
                throw new Error('invalid-tier_unit_amount')
              }
              if (amount < 0) {
                throw new Error('invalid-tier_unit_amount')
              }
            } catch (s) {
              throw new Error('invalid-tier_unit_amount')
            }
            tier.unit_amount_decimal = req.body[`tier${tierNumber}_unit_amount`]
          }
        } else if (req.body[`tier${tierNumber}_flat_amount`]) {
          if (req.body[`tier${tierNumber}_flat_amount`].indexOf('.') === -1) {
            try {
              const amount = parseInt(req.body[`tier${tierNumber}_flat_amount`], 10)
              if (req.body[`tier${tierNumber}_flat_amount`] !== amount.toString()) {
                throw new Error('invalid-tier_flat_amount')
              }
              if (amount < 0) {
                throw new Error('invalid-tier_flat_amount')
              }
            } catch (s) {
              throw new Error('invalid-tier_flat_amount')
            }
            tier.flat_amount = req.body[`tier${tierNumber}_flat_amount`]
          } else {
            try {
              const amount = parseFloat(req.body[`tier${tierNumber}_flat_amount`])
              if (req.body[`tier${tierNumber}_flat_amount`] !== amount.toString()) {
                throw new Error('invalid-tier_flat_amount')
              }
              if (amount < 0) {
                throw new Error('invalid-tier_flat_amount')
              }
            } catch (s) {
              throw new Error('invalid-tier_flat_amount')
            }
            tier.flat_amount_decimal = req.body[`tier${tierNumber}_flat_amount`]
            delete (req.body[`tier${tierNumber}_flat_amount`])
          }
        }
        priceInfo.tiers.push(tier)
        tierNumber++
      }
    } else {
      if (req.body.transform_quantity_divide_by) {
        priceInfo.transform_quantity = {
          divide_by: req.body.transform_quantity_divide_by,
          round: req.body.transform_quantity_round
        }
      }
    }
    const price = await stripeCache.execute('prices', 'create', priceInfo, req.stripeKey)
    const priceExpanded = await stripeCache.execute('prices', 'retrieve', price.id, {
      expand: ['tiers']
    }, req.stripeKey)
    await subscriptions.Storage.Price.create({
      appid: req.appid || global.appid,
      priceid: price.id,
      productid: req.body.productid,
      publishedAt: req.body.publishedAt ? new Date() : undefined,
      stripeObject: priceExpanded
    })
    req.query.priceid = price.id
    return global.api.administrator.subscriptions.Price.get(req)
  }
}
