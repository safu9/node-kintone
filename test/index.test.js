const assert = require('assert')
const nock = require('nock')
const mockFs = require('mock-fs')
const kintone = require('../src')

describe('kintone', function() {
  afterEach(function() {
    nock.cleanAll()
    kintone.reset()
  })

  describe('setAccount', function() {
    it('set x-cybozu-authorization header', async function() {
      const user = 'Alice'
      const password = 'Password1'
      const base64 = 'QWxpY2U6UGFzc3dvcmQx'

      const scope = nock('https://example.cybozu.com', {
        reqheaders: { 'X-Cybozu-Authorization': base64 }
      })
        .get('/')
        .reply(200, {})

      kintone.setAccount(user, password)

      const res = await kintone.api('https://example.cybozu.com/', 'GET', {})
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })
  })

  describe('setApiToken', function() {
    it('set x-cybozu-api-token header', async function() {
      const token = 'ThisIsToken'

      const scope = nock('https://example.cybozu.com', {
        reqheaders: { 'X-Cybozu-API-Token': token }
      })
        .get('/')
        .reply(200, {})

      kintone.setApiToken(token)

      const res = await kintone.api('https://example.cybozu.com/', 'GET', {})
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })
  })

  describe('setBasicAuthentication', function() {
    it('set authorization header', async function() {
      const user = 'Selka'
      const password = 'Password2'

      const scope = nock('https://example.cybozu.com')
        .get('/')
        .basicAuth({ user: user, pass: password })
        .reply(200, {})

      kintone.setBasicAuthentication(user, password)

      const res = await kintone.api('https://example.cybozu.com/', 'GET', {})
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })
  })

  describe('api', function() {
    it('throw error without subdomain', async function() {
      assert.rejects(kintone.api('/k/v1/records', 'GET', {}))
    })

    it('send get request', async function() {
      const scope = nock('https://example.cybozu.com')
        .get('/k/v1/records.json')
        .reply(200, {})

      kintone.setSubdomain('example')
      const res = await kintone.api('/k/v1/records', 'GET', {})
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })

    it('send get request by url', async function() {
      const scope = nock('https://example.cybozu.com')
        .get('/k/v1/records.json')
        .reply(200, {})

      kintone.setSubdomain('example')
      const res = await kintone.api('https://example.cybozu.com/k/v1/records.json', 'GET', {})
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })

    it('send get request with params', async function() {
      const params = { app: 100, param: 'key' }

      const scope = nock('https://example.cybozu.com')
        .get('/k/v1/records.json')
        .query(params)
        .reply(200, {})

      kintone.setSubdomain('example')
      const res = await kintone.api('/k/v1/records', 'GET', params)
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })

    it('send put request', async function() {
      const scope = nock('https://example.cybozu.com')
        .put('/k/v1/records.json')
        .reply(200, {})

      kintone.setSubdomain('example')
      const res = await kintone.api('/k/v1/records', 'PUT', {})
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })
  })

  describe('api.url', function() {
    it('return full url', function() {
      kintone.setSubdomain('example')
      const url = kintone.api.url('/k/v1/records')
      assert.equal(url, 'https://example.cybozu.com/k/v1/records.json')
    })
  })

  describe('api.urlForGet', function() {
    it('return full url with params', function() {
      kintone.setSubdomain('example')
      const url = kintone.api.urlForGet('/k/v1/records', { param: 1, param2: 'abc/d' })
      assert.equal(url, 'https://example.cybozu.com/k/v1/records.json?param=1&param2=abc%2Fd')
    })
  })

  describe('uploadFile', function() {
    afterEach(function() {
      mockFs.restore()
    })

    it('post file', async function() {
      mockFs({
        'path/to': {
          'file.txt': 'file content'
        }
      })

      const scope = nock('https://example.cybozu.com')
        .post('/k/v1/file.json')
        .reply(200, {})

      kintone.setSubdomain('example')
      const res = await kintone.uploadFile('path/to/file.txt')
      assert.equal(scope.isDone(), true)
      assert.deepEqual(res, {})
    })
  })

  describe('getBulkRecords', function() {
    it('get records', async function() {
      let recordNum = 2400

      const scope = nock('https://example.cybozu.com')
        .get('/k/v1/records.json')
        .query(true)
        .times(5)
        .reply(200, (uri /*, requestBody */) => {
          const getLimit = parseInt(/limit (\d+)/.exec(decodeURI(uri))[1])
          const resLength = recordNum < getLimit ? recordNum : getLimit
          recordNum -= getLimit

          return { records: Array(resLength).fill({ $id: { value: 'id' } }) }
        })

      kintone.setSubdomain('example')
      const res = await kintone.getBulkRecords({ app: 1, query: 'query' })
      assert.equal(scope.isDone(), true)
      assert.equal(res.length, 2400)
    })
  })

  describe('putBulkRecords', function() {
    it('put records', async function() {
      let recordNum = 450
      const records = Array(recordNum).fill({ $id: { value: 'id' } })

      const scope = nock('https://example.cybozu.com')
        .put('/k/v1/records.json')
        .query(true)
        .times(5)
        .reply(200, (uri, requestBody) => {
          const resLength = requestBody.records.length
          return { records: Array(resLength).fill({ id: 'id', revision: 'revision' }) }
        })

      kintone.setSubdomain('example')
      const res = await kintone.putBulkRecords({ app: 1, records: records })
      assert.equal(scope.isDone(), true)
      assert.equal(res.length, 450)
    })
  })

  describe('mapValues', function() {
    it('remove "value" key', function() {
      const res = kintone.mapValues({ id: { value: 1 }, field: { value: 'field' } })
      assert.deepEqual(res, { id: 1, field: 'field' })
    })
  })
})
