/* eslint-disable */

import Request from './src/request'
import { getUuid, getParams, formatParams} from './src/utils'

const base = {
  log () {},
  logPackage () {},
  bindEvent () {},
  init () {}
};

const DEFAULT_TAG = {
  v: 1
}



const store = {
  set: (data) => {
    window.localStorage.setItem('__performace__', JSON.stringify(data))
  },
  get: () => {
    let data = null
    try {
      data = JSON.parse(window.localStorage.getItem('__performace__'))
      console.log('_getData data', data);
    } catch (e) {}
    return data
  },
  clear: () => {
    localStorage.removeItem('__performace__');
  }
}

class Tag {
  DEFAULT_TAG = {
    v: 1
  }
  set = ( data ) => {
    let { tag } = data
    if(!tag) {
      tag = this.get()
      data = {...data, tag}
    }
    return data
  }
  get = () => {
    return { ...DEFAULT_TAG }
  }
}


class Indictor {
  getFID = () => {
    let FID = 0
    const originVals = ['firstInput', 'first-input'].map(item => window.performance.getEntriesByType(item)).filter(item => item.length > 0)
    if(originVals.length > 0 ) {
      const [{ startTime, processingEnd }] = originVals[0]
      FID = processingEnd - startTime
    }
    return FID
  }

  getFCP = () => {
    const [, { startTime }] = window.performance.getEntriesByType('paint')
    return startTime
  }

  get = () => {
    const FID = this.getFID()
    const FCP = this.getFCP()
    return { FID, FCP }
  }

  set = (data) => {
    const basicIndicator =  this.get()
    const { indicator = {} } = data
    let { basic, custom } =  indicator
    basic = {...basic, ...basicIndicator}
    return { ...data, indicator: { basic, custom } }
  }
}


const dataFlows = [
  (data) => {
    let { url } = data
    if(!url) {
      url = window.location.href
      data = {...data, url}
    }
    return data
  },
  new Tag().set,
  new Indictor().set
]

const getBasic = () => {
  const navigation =  window.performance.getEntriesByType('navigation');
  const resources = window.performance.getEntriesByType('resource');
  return {
    navigation,
    resources
  }
}

const pm = (function () {
  // compatibility
  if (!window.performance) return base;

  const pMonitor = { ...base };
  let config = {};
  let sendData = {
    uuid: '',
    tag: null,
    basic: null,
    indicator: {
      basic: null,
      custom: null
    }
  }

  pMonitor._getToken = async (Authorization) => {
    let { token, repoName } = config
    if (!token) {
      const tokenApi = `/api/users/log/tokens?platform=qiniu&method=POST&repo=${repoName}`
      const res = await Request({
        url: tokenApi,
        method: 'GET',
        headers: {
          Authorization
        }
      })
      token = res && res.data && res.data.data && res.data.data.token
    }
    return token
  }


  pMonitor._getCustomIndictor = (key) => {
    const time = window.performance.now()
    const { indicator = {} } = sendData
    let { basic, custom } =  indicator
    custom = {...custom, [key]: time }
    return { basic, custom }
  }

  pMonitor._setCustomIndicator = (key) => {
    const indicator = pMonitor._getIndictor(key, type)
    sendData = { ...sendData, indicator }
  }


  // reprot data mannually
  pMonitor.log = async (data) => {
    if(data) {
      let { token, repoName, Authorization } = config
      if (!token) {
        if (Authorization) {
          token = await pMonitor._getToken(Authorization)
          config.token = token
        } else {
          return false
        }
      }
      const url = `https://nb-pipeline.qiniuapi.com/v2/streams/${repoName}/data`
      Request({
        baseURL: url,
        method: 'POST',
        headers: {
          'Authorization': 'Pandora ' + token, // token是接口获取到的七牛token
          'Content-Type': 'text/plain'
        },
        data
      })
    }
  };

  pMonitor._formatData = (data) => {
    return dataFlows.reduce(( origin, handler ) => ({ ...handler(origin) }), data)
  }

  pMonitor._cacheData = (data = {}) => {
    sendData = { ...sendData, ...data }
    sendData = pMonitor._formatData(sendData)
    // eslint-disable-next-line no-console
    console.log('sendData', sendData);
    store.set(sendData)
  }

  pMonitor.logPackage = () => {
    const basic = getBasic()
    const oldData = store.get()
    store.clear()
    pMonitor.log(formatParams(oldData))
    pMonitor._cacheData({ basic });
  };

  // report data automatically
  pMonitor.bindEvent = () => {
    if (document.readyState === 'complete') {
      pMonitor.logPackage()
    } else {
      const oldOnload = window.onload
      window.onload = e => {
        if (oldOnload && typeof oldOnload === 'function') {
          oldOnload(e)
        }
        if (window.requestIdleCallback) {
          window.requestIdleCallback(pMonitor.logPackage)
        } else {
          setTimeout(pMonitor.logPackage)
        }
      }
    }
  }

  pMonitor.init = (option) => {
    const uuid = getUuid();
    const { repoName = 'niuwa_web_dev', Authorization } = option;
    sendData = {...sendData, uuid}
    config = {
      repoName,
      Authorization
    };
  };
  return pMonitor;
})();

export default pm;
