const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')
const validTypes = [
  'ae_trn',
  'au_abn',
  'au_arn',
  'bg_uic',
  'br_cnpj',
  'br_cpf',
  'ca_bn',
  'ca_gst_hst',
  'ca_pst_bc',
  'ca_pst_mb',
  'ca_pst_sk',
  'ca_qst',
  'ch_vat',
  'cl_tin',
  'es_cif',
  'eu_oss_vat',
  'eu_vat',
  'gb_vat',
  'ge_vat',
  'hk_br',
  'hu_tin',
  'id_npwp',
  'il_vat',
  'in_gst',
  'is_vat',
  'jp_cn',
  'jp_rn',
  'kr_brn',
  'li_uid',
  'mx_rfc',
  'my_frp',
  'my_itn',
  'my_sst',
  'no_vat',
  'nz_gst',
  'ru_inn',
  'ru_kpp',
  'sa_vat',
  'sg_gst',
  'sg_uen',
  'si_tin',
  'th_vat',
  'tw_vat',
  'ua_vat',
  'us_ein',
  'za_vat'
]

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    if (!req.body || !req.body.type || !req.body.type.length || validTypes.indexOf(req.body.type) === -1) {
      throw new Error('invalid-type')
    }
    if (!req.body.value || !req.body.value.length) {
      throw new Error('invalid-value')
    }
    const taxidInfo = {
      type: req.body.type,
      value: req.body.value
    }
    let taxId
    try {
      taxId = await stripeCache.execute('customers', 'createTaxId', req.query.customerid, taxidInfo, req.stripeKey)
    } catch (error) {
      if (error.message === 'invalid-taxid') {
        throw new Error('invalid-value')
      }
      throw error
    }
    await subscriptions.Storage.TaxId.create({
      appid: req.appid || global.appid,
      taxid: taxId.id,
      customerid: req.query.customerid,
      accountid: req.account.accountid,
      stripeObject: taxId
    })
    req.query.taxid = taxId.id
    return global.api.user.subscriptions.TaxId.get(req)
  }
}
