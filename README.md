# node-kintone
[![npm](https://img.shields.io/npm/v/node-kintone.svg)](https://www.npmjs.com/package/node-kintone)
[![Dependency Status](https://david-dm.org/safu9/node-kintone.svg)](https://david-dm.org/safu9/node-kintone)
[![CircleCI](https://circleci.com/gh/safu9/node-kintone.svg?style=shield)](https://circleci.com/gh/safu9/node-kintone)
[![codecov](https://codecov.io/gh/safu9/node-kintone/branch/master/graph/badge.svg)](https://codecov.io/gh/safu9/node-kintone)

simple kintone rest api

## Install
```bash
npm install node-kintone
```

## Usage
Basically the same as [kintone javascript api](https://developer.cybozu.io/hc/ja/articles/202166310).

### Authorization
```js
const kintone = require('node-kintone')

kintone.setSubdomain('example')

kintone.setApiToken('token')
kintone.setAccount('username', 'password')
kintone.setBasicAuthentication('username', 'password')
```

### Send request
```js
kintone.api('/k/v1/record', 'GET', { app: 1, id: 1 }).then((res) => {
	console.log(res)
}).catch((err) => {
	console.log(err)
})
```
Callback is not supported for now.

### Get API endpoint
```js
kintone.api.url('/k/v1/record')
kintone.api.urlForGet('/k/v1/record', { app: 1, id: 1 })
```
Guest space is not supportred.

### Proxy
Not supported.

### Upload file
```js
kintone.uploadFile('/path/to/file')
```

### Bulk get or put
```js
kintone.getBulkRecords({ app: 1, query: 'order by date' }).then((records) => {
	console.log(records)
})

kintone.putBulkRecords({ app: 1, records: [/*...*/] }).then((records) => {
	console.log(records)	// list of id and revision
})
```
You can't use limit or offset in the query option.
