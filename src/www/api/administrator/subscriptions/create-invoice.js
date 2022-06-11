// const subscriptions = require('../../../../../index.js')

// module.exports = {
//   post: async (req) => {
//     if (!req.query || !req.query.customerid) {
//       throw new Error('invalid-customerid')
//     }
//     const customer = await global.api.administrator.subscriptions.Customer.get(req)
//     // TODO: this is currently only partially-implemented
//     const invoiceInfo = {
//       customer: req.query.customerid,
//       auto_advance: req.body.auto_advance,
//       collection_method: req.body.collection_method,
//       subscription: req.body.subscriptionid
//     }
//     if (req.body.auto_advance) {
//       invoiceInfo.auto_advance = req.body.auto_advance
//     }
//     if (req.body.collection_method) {
//       invoiceInfo.collection_method = req.body.collection_method
//     }
//     if (req.body.accounttaxids) {
//       invoiceInfo.account_tax_ids = req.body.accounttaxids.split(',')
//     }
//     if (req.body.automatic_tax) {
//       invoiceInfo.automatic_tax = req.body.automatic_tax
//     }
//     if (req.body.due_date) {
//       invoiceInfo.due_date = req.body.due_date
//     }
//     const invoiceNow = await stripe.invoices.create(invoiceInfo, req.stripeKey)
//     await subscriptions.Storage.Invoice.create({
//       invoiceid: invoiceNow.id,
//       appid: req.appid || global.appid,
//       customerid: invoiceNow.customer,
//       accountid: customer.accountid,
//       stripeObject
//     })
//     req.query.invoiceid = invoiceNow.id
//     return global.api.administrator.subscriptions.Invoice.get(req)
//   }
// }
