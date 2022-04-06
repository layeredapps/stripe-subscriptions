const stripeCache = require('./src/stripe-cache.js')

module.exports = {
  createFakePayout: {
    api: {
      get: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        const chargeInfo = {
          amount: '1000',
          currency: 'usd',
          source: 'tok_bypassPending',
          description: 'Payout charge'
        }
        await stripeCache.execute('charges', 'create', chargeInfo, req.stripeKey)
        const payoutInfo = {
          amount: 100,
          currency: process.env.PAYOUT_CURRENCY || 'usd'
        }
        return stripeCache.execute('payouts', 'create', payoutInfo, req.stripeKey)
      }
    }
  },
  fakeAmountOwed: {
    api: {
      get: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (!req.query || !req.query.customerid) {
          throw new Error('invalid-customerid')
        }
        await stripeCache.execute('invoiceItems', 'create', {
          customer: req.query.customerid,
          amount: 2500,
          currency: 'usd',
          description: 'One-time setup fee'
        }, req.stripeKey)
        let invoice
        if (req.query.due_date && req.query.due_date !== '0') {
          invoice = await stripeCache.execute('invoices', 'create', {
            customer: req.query.customerid,
            auto_advance: true,
            collection_method: 'send_invoice',
            due_date: Math.floor(new Date(req.query.due_date).getTime() / 1000)
          }, req.stripeKey)
        } else {
          invoice = await stripeCache.execute('invoices', 'create', {
            customer: req.query.customerid,
            auto_advance: true
          }, req.stripeKey)
        }
        return stripeCache.execute('invoices', 'finalizeInvoice', invoice.id, { auto_advance: false }, req.stripeKey)
      }
    }
  },
  toggleRefunds: {
    api: {
      get: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (req.query && req.query.enable) {
          global.subscriptionRefundPeriod = 7 * 24 * 60 * 60
        } else {
          global.subscriptionRefundPeriod = false
        }
      }
    }
  },
  toggleOverdueInvoiceThreshold: {
    api: {
      get: async (req) => {
        if (process.env.NODE_ENV !== 'testing') {
          throw new Error('invalid-route')
        }
        if (req.query && req.query.enable) {
          global.overdueInvoiceThreshold = 7 * 24 * 60 * 60
        } else {
          global.overdueInvoiceThreshold = false
        }
      }
    }
  }
}
