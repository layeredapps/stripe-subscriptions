/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../test-helper.js')
const ScreenshotData = require('../../../../screenshot-data.js')

describe('/administrator/subscriptions/payout', function () {
  describe('before', () => {
    if (!process.env.DISABLE_PAYOUT_TESTS) {
      it('should bind data to req', async () => {
        const administrator = await TestHelper.createOwner()
        const payout = await TestHelper.createPayout(administrator)
        const req = TestHelper.createRequest(`/administrator/subscriptions/payout?payoutid=${payout.id}`)
        req.account = administrator.account
        req.session = administrator.session
        await req.route.api.before(req)
        assert.strictEqual(req.data.payout.id, payout.id)
      })
    }
  })
  describe('view', () => {
    if (!process.env.DISABLE_PAYOUT_TESTS) {
      it('should have row for payout (screenshots)', async () => {
        const administrator = await TestHelper.createOwner()
        const payout = await TestHelper.createPayout(administrator)
        const req = TestHelper.createRequest(`/administrator/subscriptions/payout?payoutid=${payout.id}`)
        req.account = administrator.account
        req.session = administrator.session
        req.filename = __filename
        req.screenshots = [
          { hover: '#administrator-menu-container' },
          { click: '/administrator/subscriptions' },
          { click: '/administrator/subscriptions/payouts' },
          { click: `/administrator/subscriptions/payout?payoutid=${administrator.payout.id}` }
        ]
        global.pageSize = 50
        global.packageJSON.dashboard.server.push(ScreenshotData.administratorIndex)
        const result = await req.get()
        const doc = TestHelper.extractDoc(result.html)
        const tbody = doc.getElementById(payout.id)
        assert.strictEqual(tbody.tag, 'tbody')
      })
    }
  })

  describe('errors', () => {
    it('invalid-payoutid', async () => {
      const administrator = await TestHelper.createOwner()
      const req = TestHelper.createRequest('/administrator/subscriptions/payout?payoutid=invalid')
      req.account = administrator.account
      req.session = administrator.session
      await req.route.api.before(req)
      assert.strictEqual(req.error, 'invalid-payoutid')
    })
  })
})
