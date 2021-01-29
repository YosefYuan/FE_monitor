/* eslint-disable */
const getRandomTime = () => Math.random() * 10 * 1000
const mock = {
  "url": Math.random() > 0.5 ? "home" : 'mine',
  "tag": {
    "os": Math.random() > 0.5 ? "mac" : 'windows'
  },
  "basic": {
    "navigation": [
      {
        "name": "https://local.jiliguala.com/partner/index.html?code=031xhH000pzm5L1IX14006r3Qb1xhH0n",
        "entryType": "navigation",
        "startTime": 0
      }
    ],
    "resources": [
      {
        "name": "https://local.jiliguala.com/partner/js/app.js",
        "startTime": getRandomTime(),
        "duration": getRandomTime()
      },
      {
        "name": "https://local.jiliguala.com/partner/js/app1.js",
        "startTime": getRandomTime(),
        "duration": getRandomTime()
      },
      {
        "name": "https://local.jiliguala.com/partner/js/app2.js",
        "startTime": getRandomTime(),
        "duration": getRandomTime()
      },
      {
        "name": "https://local.jiliguala.com/partner/js/app3.js",
        "startTime": getRandomTime(),
        "duration": getRandomTime()
      }
    ]
  },
  "indicator": {
    "basic": {
      "FCP":  getRandomTime(),
      "FID": getRandomTime(),
      "FMP": getRandomTime()
    },
    "custom": {
      "FMP2": getRandomTime()
    }
  }
}

export const getParams = () => {
  const {basic: { navigation, resources }, ...commonParams} =  mock
  let param0 = {
    c: commonParams
  }
  let param1 = navigation.map(item => ({c: { ...commonParams, name: 'navigation', item }}))
  let param2 = resources.map(item => {
    const {name, startTime, duration } = item
    return {c: { ...commonParams, name: 'resources', item: { name,startTime, duration }  }}
  })
  const paramArr = [param0, ...param1, ...param2]
  return paramArr.map(item => JSON.stringify(item)).join('\n')
}
