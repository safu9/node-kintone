const fs = require('fs')
const querystring = require('querystring')
const request = require('request-promise-native')


const kintone = {}
let headers = {}
let domain = ''

// Init & Authorization

kintone.setSubdomain = (subdomain) => {
  domain = subdomain + '.cybozu.com'
}

kintone.setAuthorization = (username, password) => {
  headers['X-Cybozu-Authorization'] = Buffer.from(username + ':' + password).toString('base64')
}

kintone.setApiToken = (token) => {
  headers['X-Cybozu-API-Token'] = token
}

kintone.setBasicAuthorization = (username, password) => {
  headers['Authorization'] = 'Basic ' + Buffer.from(username + ':' + password).toString('base64')
}

// API

kintone.api = (pathOrUrl, method, params, opt_callback, opt_errback) => {
  if (pathOrUrl.startsWith('/k/v1/')) {
    pathOrUrl = kintone.api.url(pathOrUrl)
  }

  let options
  if (method === 'GET') {
    options = {
      uri: pathOrUrl,
      qs: params,
      headers: headers,
      json: true      // JSON response
    }
  } else {
    options = {
      method: method,
      uri: pathOrUrl,
      body: params,
      headers: headers,
      json: true      // JSON request
    }
  }

  return request(options)
}

kintone.api.url = (path) => {
  return `https://${domain}${path}.json`
}

kintone.api.urlForGet = (path, params) => {
  return kintone.api.url(url) + '?' + querystring.stringify(params)
}

// File API

kintone.uploadFile = (filePath) => {
  var options = {
    method: 'POST',
    uri: kintone.api.url('/k/v1/file'),
    formData: {
      file: {
        value: fs.createReadStream(filePath),
        options: {
          filename: filePath
        }
      }
    },
    headers: headers,
    json: true
  }

  return request(options)
}

// Bulk API

const getLimit = 500
const editLimit = 100

kintone.getBulkRecords = async (params) => {
  let resRecords = []
  let offset = 0

  while (true) {
    let newParams = Object.assign({}, params)
    newParams.query = `${params.query || ''} limit ${getLimit} offset ${offset}`
    
    let res = await kintone.api('/k/v1/records', 'GET', newParams)
    resRecords = resRecords.concat(res.records)

    offset += getLimit
    if (res.records.length < getLimit) {
      break
    }
  }

  return resRecords
}

kintone.putBulkRecords = async (params) => {
  let resRecords = []
  let offset = 0

  while (true) {
    let newParams = {
      app: params.app,
      records: params.records.slice(offset, offset + editLimit)
    }
    let res = await kintone.api('/k/v1/records', 'PUT', newParams)
    resRecords = resRecords.concat(res.records)

    offset += editLimit
    if (offset >= params.records.length) {
      break
    }
  }

  return resRecords
}

// Utils

kintone.mapValues = (record) => {
  for (const key in record) {
    if ('value' in record[key]) {
      record[key] = record[key].value
    }
  }
  return record
}


module.exports = kintone
