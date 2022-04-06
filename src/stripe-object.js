const dashboard = require('@layeredapps/dashboard')

module.exports = (sequelizeObject) => {
  const clone = {}
  for (const key in sequelizeObject) {
    if (key === 'stripeObject') {
      continue
    }
    clone[key] = sequelizeObject[key]
  }
  for (const key in sequelizeObject.stripeObject) {
    clone[key] = sequelizeObject.stripeObject[key]
  }
  clone.createdAtFormatted = dashboard.Format.date(clone.createdAt)
  clone.updatedAtFormatted = dashboard.Format.date(clone.updatedAt)
  if (clone.publishedAt) {
    clone.publishedAtFormatted = dashboard.Format.date(clone.publishedAt)
  }
  if (clone.unpublishedAt) {
    clone.unpublishedAtFormatted = dashboard.Format.date(clone.unpublishedAt)
  }
  if (clone.amount) {
    clone.amountFormatted = dashboard.Format.money(clone.amount || 0, clone.currency)
  }
  if (clone.amount_refunded) {
    clone.amountRefundedFormatted = dashboard.Format.money(clone.amount_refunded || 0, clone.currency)
  }
  if (clone.amount_off) {
    clone.amountOffFormatted = dashboard.Format.money(clone.amount_off, clone.currency)
  }
  if (clone.trial_period_days) {
    clone.trialPeriodDaysFormatted = clone.trial_period_days || 0
  }
  if (clone.current_period_start) {
    clone.currentPeriodStartFormatted = dashboard.Format.date(clone.current_period_start)
  }
  if (clone.current_period_end) {
    clone.currentPeriodEndFormatted = dashboard.Format.date(clone.current_period_end)
  }
  if (clone.trial_end) {
    clone.trialEndFormatted = dashboard.Format.date(clone.trial_end)
  }
  if (clone.account_balance) {
    clone.accountBalanceFormatted = clone.account_balance < 0 ? dashboard.Format.money(-clone.account_balance, clone.currency) : ''
  }
  if (clone.lines && clone.lines.data && clone.lines.data.lengt) {
    for (const line of clone.lines.data) {
      if (line.period && line.period.start) {
        line.period.startFormatted = dashboard.Format.date(new Date(line.period.start * 1000))
      }
      if (line.period && line.period.end) {
        line.period.endFormatted = dashboard.Format.date(new Date(line.period.end * 1000))
      }
      if (line.plan && line.plan.amount) {
        line.plan.amountFormatted = dashboard.Format.money(line.plan.amount || 0, line.plan.currency)
      }
      if (line.price && line.price.unit_amount) {
        line.price.unitAmountFormatted = dashboard.Format.money(line.price.unit_amount || 0, line.plan.currency)
      }
      if (line.price && line.price.created) {
        line.price.createdFormat = dashboard.Format.date(new Date(line.price.created * 1000))
      }
    }
  }

  return clone
}
