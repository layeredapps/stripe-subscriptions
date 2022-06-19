/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/update-tax-rate', function () {
  before(TestHelper.disableMetrics)
  after(TestHelper.enableMetrics)
  let cachedResponses
  async function bundledData (retryNumber) {
    if (retryNumber > 0) {
      cachedResponses = {}
    }
    if (cachedResponses && cachedResponses.finished) {
      return
    }
    cachedResponses = {}
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestHelper.createOwner()
    await TestHelper.createTaxRate(administrator)
    const req = TestHelper.createRequest(`/api/administrator/subscriptions/update-tax-rate?taxrateid=${administrator.taxRate.taxrateid}`)
    req.account = administrator.account
    req.session = administrator.session
    req.body = {
      display_name: 'US Sales Tax',
      active: 'true',
      description: 'GST tax in KY',
      jurisdiction: 'US'
    }
    // invalid display name
    req.body.display_name = ''
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidDisplayName = error.message
    }
    req.body.display_name = 'US Sales TAx'
    try {
      await req.patch()
    } catch (error) {
      cachedResponses.invalidInclusive = error.message
    }
    req.body.inclusive = true
    // invalid state
    // TODO: stripe docs say state is an optional parameter but
    // the stripe api is throwing an exception saying it cannot
    // be updated:
    // "You cannot change `state` via API once it has been set."
    // https://stripe.com/docs/api/tax_rates/update
    // req.body.state = 'invalid'
    // try {
    //   await req.patch()
    // } catch (error) {
    //   cachedResponses.invalidState = error.message
    // }
    // req.body.state = 'NY'
    // invalid tax type
    // TODO: stripe docs say tax_type is an optional parameter but
    // the stripe api is throwing an exception saying it cannot
    // be updated:
    // "You cannot change `tax_type` via API once it has been set."
    // https://stripe.com/docs/api/tax_rates/update
    // req.body.tax_type = 'invalid'
    // try {
    //   await req.patch()
    // } catch (error) {
    //   cachedResponses.invalidTaxType = error.message
    // }
    req.body.tax_type = 'sales_tax'
    // good
    req.filename = __filename
    req.saveResponse = true
    cachedResponses.returns = await req.patch()
    cachedResponses.finished = true
  }

  describe('exceptions', () => {
    describe('invalid-taxrateid', () => {
      it('missing querystring taxrateid', async function () {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/update-tax-rate')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })

      it('invalid querystring taxrateid', async function () {
        const administrator = await TestHelper.createOwner()
        const req = TestHelper.createRequest('/api/administrator/subscriptions/update-tax-rate?taxrateid=invalid')
        req.account = administrator.account
        req.session = administrator.session
        let errorMessage
        try {
          await req.patch()
        } catch (error) {
          errorMessage = error.message
        }
        assert.strictEqual(errorMessage, 'invalid-taxrateid')
      })
    })

    // describe('invalid-country', () => {
    //   it('invalid posted country', async function () {
    //     await bundledData(this.test.currentRetry())
    //     const errorMessage = cachedResponses.invalidCountry
    //     assert.strictEqual(errorMessage, 'invalid-country')
    //   })
    // })

    // TODO: stripe docs say state is an optional parameter but
    // the stripe api is throwing an exception saying it cannot
    // be updated:
    // "You cannot change `state` via API once it has been set."
    // https://stripe.com/docs/api/tax_rates/update
    // describe('invalid-state', () => {
    //   it('invalid posted state', async function () {
    //     await bundledData(this.test.currentRetry())
    //     const errorMessage = cachedResponses.invalidState
    //     assert.strictEqual(errorMessage, 'invalid-state')
    //   })
    // })

    // TODO: stripe docs say tax_type is an optional parameter but
    // the stripe api is throwing an exception saying it cannot
    // be updated:
    // "You cannot change `tax_type` via API once it has been set."
    // https://stripe.com/docs/api/tax_rates/update
    // describe('invalid-tax_type', () => {
    //   it('invalid posted tax_type', async function () {
    //     await bundledData(this.test.currentRetry())
    //     const errorMessage = cachedResponses.invalidTaxType
    //     assert.strictEqual(errorMessage, 'invalid-tax_type')
    //   })
    // })
  })

  describe('receives', () => {
    it('required posted display_name', async function () {
      await bundledData(this.test.currentRetry())
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.display_name, 'NY Sales Tax')
    })

    it('required posted inclusive', async function () {
      await bundledData(this.test.currentRetry())
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.inclusive, true)
    })

    // it('optional posted tax_type', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const taxRate = cachedResponses.returns
    //   assert.strictEqual(taxRate.stripeObject.tax_type, 'sales_tax')
    // })

    it('required posted description', async function () {
      await bundledData(this.test.currentRetry())
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.description, 'GST tax in KY')
    })

    it('required posted jurisdiction', async function () {
      await bundledData(this.test.currentRetry())
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.jurisdiction, 'US')
    })

    // it('optional posted state', async function () {
    //   await bundledData(this.test.currentRetry())
    //   const taxRate = cachedResponses.returns
    //   assert.strictEqual(taxRate.stripeObject.state, 'NY')
    // })

    it('optional posted country', async function () {
      await bundledData(this.test.currentRetry())
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.stripeObject.country, 'US')
    })
  })

  describe('returns', () => {
    it('object', async function () {
      await bundledData(this.test.currentRetry())
      const taxRate = cachedResponses.returns
      assert.strictEqual(taxRate.object, 'taxrate')
    })
  })
})
