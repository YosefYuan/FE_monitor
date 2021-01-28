import Request from './src/request'

const base = {
  log () {},
  logPackage () {},
  bindEvent () {},
  getToken () {},
  updateConfig () {},
  init () {}
};

const pm = (function () {
  // compatibility
  if (!window.performance) return base;

  const pMonitor = { ...base };
  let config = {};

  pMonitor.getNavigation = () => {
    return window.performance.getEntriesByType('navigation');
  };

  pMonitor.getResourceTimes = () => {
    return window.performance.getEntriesByType('resource');
  };

  pMonitor.getToken = async (Authorization) => {
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
      pMonitor.updateConfig({ token })
    }
    return token
  }

  pMonitor.updateConfig = (updateFields = {}) => {
    config = { ...config, ...updateFields }
  }

  // reprot data mannually
  pMonitor.log = async (data = {}) => {
    let { token, repoName, Authorization } = config
    if (!token) {
      if (Authorization) {
        token = await pMonitor.getToken(Authorization)
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
      data: {
        c: data
      }
    })
  };

  pMonitor.logPackage = () => {
    const navigation = pMonitor.getNavigation();
    let resourceTimes = pMonitor.getResourceTimes();
    // resourceTimes = [...Array(10)].map(() => ({...item, name: +new Date(), connectEnd: Math.random() * 100, connectStart: Math.random() * 100}))
    pMonitor.log({ navigation, resourceTimes });
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

  /**
   * @param {object} option
   * @param {string} option.url
   * @param {number=} [option.timeout=10000]
   */
  pMonitor.init = (option) => {
    const { repoName = 'niuwa_web_dev', Authorization } = option;
    config = {
      repoName,
      Authorization
    };
  };
  return pMonitor;
})();

export default pm;
