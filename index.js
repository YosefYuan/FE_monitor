/* eslint-disable */

import Request from './src/request'
import { getUuid, getParams, formatParams} from './src/utils'

const base = {
  log () {},
  logPackage () {},
  bindEvent () {},
  init () {}
};


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

  pMonitor._getNavigation = () => {
    return window.performance.getEntriesByType('navigation');
  };

  pMonitor._getResources = () => {
    return window.performance.getEntriesByType('resource');
  };

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
      pMonitor._updateConfig({ token })
    }
    return token
  }

  pMonitor._updateConfig = (updateFields = {}) => {
    config = { ...config, ...updateFields }
  }

  pMonitor._addUuid = (data) => { 
    let { uuid } = data
    if(!uuid) {
      uuid = getUuid()
      pMonitor._updateConfig({ uuid })
      data = {...data, uuid }
    }
    return data
  }
  
  pMonitor._getTag = () => {
    const defaultTag = {}
    const v = 1
    return {
      ...defaultTag,
      v
    }
  }
  
  pMonitor._setTag = (data) => {
    let { tag } = data
    if(!tag) {
      tag = pMonitor._getTag()
      data = {...data, tag}
    }
    return data
  }
  
  pMonitor._getUrl = () => {
    return window.location.href
  }

  pMonitor._setUrl = (data) => {
    let { url } = data
    if(!url) {
      url = pMonitor._getUrl()
      data = {...data, url}
    }
    return data
  }

  pMonitor._getCustomIndictor = (key) => {
    const time = window.performance.now()
    const { indicator = {} } = sendData
    let { basic, custom } =  indicator
    custom = {...custom, [key]: time }
    // switch (type) {
    //   case 'basic':
    //     basic = {...basic, [key]: time }
    //     break;

    //   case 'custom':
    //     break;

    //   default:
    //     console.warn('The indicator type should be "custom" or "basic"!')
    // }
    return { basic, custom }
  }

  pMonitor._setCustomIndicator = (key) => {
    const indicator = pMonitor._getIndictor(key, type)
    sendData = { ...sendData, indicator }
  }

  pMonitor._getFID = () => {
    let FID = 0
    const originVals = ['firstInput', 'first-input'].map(item => window.performance.getEntriesByType(item)).filter(item => item.length > 0)
    if(originVals.length > 0 ) {
      const [{ startTime, processingEnd }] = originVals[0]
      FID = processingEnd - startTime
    }
    return FID
  }

  pMonitor._getFCP = () => {
    const [, { startTime }] = window.performance.getEntriesByType('paint')
    return startTime
  }

  pMonitor._getBasicIndicator = () => {
    const FID = pMonitor._getFID()
    const FCP = pMonitor._getFCP()
    return { FID, FCP }
  }

  pMonitor._setBasicIndicator = (data) => {
    const basicIndicator =  pMonitor._getBasicIndicator()
    const { indicator = {} } = data
    let { basic, custom } =  indicator
    basic = {...basic, ...basicIndicator}
    return { ...data, indicator: { basic, custom } }
  }

  pMonitor._formatData = (data) => {
    const flows = [ pMonitor._addUuid, pMonitor._setTag, pMonitor._setUrl, pMonitor._setBasicIndicator ]
    return flows.reduce(( origin, handler ) => ({ ...handler(origin) }), data)
  }

  pMonitor._cacheData = (data = {}) => {
    sendData = { ...sendData, ...data }
    // eslint-disable-next-line no-console
    console.log('sendData1', sendData);
    sendData = pMonitor._formatData(sendData)
    console.log('sendData2', sendData);
    pMonitor._saveData(sendData)
  }

  pMonitor._saveData = (data) => {
    // eslint-disable-next-line no-console
    console.log('_saveData data', data);
    window.localStorage.setItem('__performace__', JSON.stringify(data))
  }

  pMonitor._getData = () => {
    let data = null
    try {
      data = JSON.parse(window.localStorage.getItem('__performace__'))
      console.log('_getData data', data);
    } catch (e) {}
    return data
  }

  // reprot data mannually
  pMonitor.log = async (data = {}) => {
    if(data) {
      let { token, repoName, Authorization } = config
      if (!token) {
        if (Authorization) {
          token = await pMonitor._getToken(Authorization)
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

  pMonitor.logPackage = () => {
    const navigation = pMonitor._getNavigation();
    let resources = pMonitor._getResources();
    pMonitor._cacheData({ basic: { navigation, resources }});
    const oldData = pMonitor._getData()
    // eslint-disable-next-line no-console
    console.log('oldData', oldData);
    oldData && pMonitor.log(formatParams(oldData))
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
    config = {
      repoName,
      Authorization,
      uuid
    };
  };
  return pMonitor;
})();

export default pm;
