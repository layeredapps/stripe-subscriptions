/* eslint-env mocha */
const assert = require('assert')
const TestHelper = require('../../../../../test-helper.js')
const TestStripeAccounts = require('../../../../../test-stripe-accounts.js')
const DashboardTestHelper = require('@layeredapps/dashboard/test-helper.js')

describe('/api/administrator/subscriptions/usage-records', function () {
  const cachedResponses = {}
  const cachedUsageRecords = []
  before(async () => {
    await TestHelper.setupBefore()
    await DashboardTestHelper.setupBeforeEach()
    await TestHelper.setupBeforeEach()
    const administrator = await TestStripeAccounts.createOwnerWithPlan({
      usage_type: 'metered',
      amount: 1000
    })
    let accountUser
    for (let i = 0, len = global.pageSize; i < len; i++) {
      const user = accountUser = await TestStripeAccounts.createUserWithPaidSubscription(administrator.plan)
      await TestHelper.createUsageRecord(administrator, user, 100)
      cachedUsageRecords.unshift(user.usageRecord.usagerecordid)
    }
    await TestHelper.createCustomer(accountUser, {
      email: accountUser.profile.contactEmail,
      description: accountUser.profile.firstName
    })
    await TestHelper.createPaymentMethod(accountUser, {
      cvc: '111',
      number: '4111111111111111',
      exp_month: '1',
      exp_year: (new Date().getFullYear() + 1).toString().substring(2),
      name: accountUser.profile.firstName + ' ' + accountUser.profile.lastName,
      address_line1: '285 Fulton St',
      address_line2: 'Apt 893',
      address_city: 'New York',
      address_state: 'NY',
      address_zip: '90120',
      address_country: 'US',
      default: 'true'
    })
    await TestHelper.createSubscription(accountUser, administrator.plan.planid)
    await TestHelper.createUsageRecord(administrator, accountUser, 100)
    cachedUsageRecords.unshift(accountUser.usageRecord.usagerecordid)
    await TestHelper.wait(1100)
    await TestHelper.createUsageRecord(administrator, accountUser, 100)
    cachedUsageRecords.unshift(accountUser.usageRecord.usagerecordid)
    const req1 = TestHelper.createRequest('/api/administrator/subscriptions/usage-records?offset=1')
    req1.account = administrator.account
    req1.session = administrator.session
    cachedResponses.offset = await req1.get()
    const req2 = TestHelper.createRequest('/api/administrator/subscriptions/usage-records?limit=1')
    req2.account = administrator.account
    req2.session = administrator.session
    cachedResponses.limit = await req2.get()
    const req3 = TestHelper.createRequest('/api/administrator/subscriptions/usage-records?all=true')
    req3.account = administrator.account
    req3.session = administrator.session
    cachedResponses.all = await req3.get()
    const req4 = TestHelper.createRequest(`/api/administrator/subscriptions/usage-records?accountid=${accountUser.account.accountid}&all=true`)
    req4.account = administrator.account
    req4.session = administrator.session
    cachedResponses.accountid = await req4.get()
    const req5 = TestHelper.createRequest(`/api/administrator/subscriptions/usage-records?customerid=${accountUser.customer.customerid}&all=true`)
    req5.account = administrator.account
    req5.session = administrator.session
    cachedResponses.customerid = await req5.get()
    const req6 = TestHelper.createRequest(`/api/administrator/subscriptions/usage-records?subscriptionid=${accountUser.subscription.subscriptionid}&all=true`)
    req6.account = administrator.account
    req6.session = administrator.session
    cachedResponses.subscriptionid = await req6.get()
    const req7 = TestHelper.createRequest('/api/administrator/subscriptions/usage-records')
    req7.account = administrator.account
    req7.session = administrator.session
    req7.filename = __filename
    req7.saveResponse = true
    cachedResponses.returns = await req7.get()
    global.pageSize = 3
    cachedResponses.pageSize = await req7.get()
  })

  describe('receives', () => {
    it('optional querystring offset (integer)', async () => {
      const offset = 1
      const usageRecordsNow = cachedResponses.offset
      for (let i = 0, len = global.pageSize; i < len; i++) {
        assert.strictEqual(usageRecordsNow[i].usagerecordid, cachedUsageRecords[offset + i])
      }
    })

    it('optional querystring limit (integer)', async () => {
      const limit = 1
      const usageRecordsNow = cachedResponses.limit
      assert.strictEqual(usageRecordsNow.length, limit)
    })

    it('optional querystring all (boolean)', async () => {
      const usageRecordsNow = cachedResponses.all
      assert.strictEqual(usageRecordsNow.length, cachedUsageRecords.length)
    })

    it('optional querystring accountid', async () => {
      const usageRecordsNow = cachedResponses.accountid
      assert.strictEqual(usageRecordsNow.length, 3)
    })

    it('optional querystring customerid', async () => {
      const usageRecordsNow = cachedResponses.customerid
      assert.strictEqual(usageRecordsNow.length, 2)
    })

    it('optional querystring subscriptionid', async () => {
      const usageRecordsNow = cachedResponses.subscriptionid
      assert.strictEqual(usageRecordsNow.length, 2)
    })
  })

  describe('returns', () => {
    it('array', async () => {
      const subscriptions = cachedResponses.returns
      assert.strictEqual(subscriptions.length, global.pageSize)
    })
  })

  describe('configuration', () => {
    it('environment PAGE_SIZE', async () => {
      global.pageSize = 3
      const subscriptions = cachedResponses.pageSize
      assert.strictEqual(subscriptions.length, global.pageSize)
    })
  })
})
