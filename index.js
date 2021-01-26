import Request from './src/request'

const base = {
  log () {},
  logPackage () {},
  getLoadTime () {},
  getTimeoutRes () {},
  bindEvent () {},
  init () {}
};

const pm = (function () {
  // compatibility
  if (!window.performance) return base;

  const pMonitor = { ...base };
  let config = {};
  const SEC = 1000;
  const TIMEOUT = 10 * SEC;
  const setTime = (limit = TIMEOUT) => (time) => time >= limit;
  const getLoadTime = ({ startTime, responseEnd }) => {
    return responseEnd - startTime
  };
  const getName = ({ name }) => name;

  pMonitor.getLoadTime = () => {
    const [{ domComplete }] = window.performance.getEntriesByType('navigation');
    return domComplete;
  };

  pMonitor.getTimeoutRes = (limit = TIMEOUT) => {
    const isTimeout = setTime(limit);
    const resourceTimes = window.performance.getEntriesByType('resource');
    return resourceTimes
      .filter((item) => isTimeout(getLoadTime(item)))
      .map(getName);
  };

  pMonitor.getToken = async (Authorization) => {
    let { token, repoName } = config
    if (!token) {
      const tokenApi = `/api/users/log/tokens?platform=qiniu&method=POST&repo=${repoName}`
      const res = await Request({
        url: tokenApi,
        methods: 'GET',
        headers: {
          Authorization
        }
      })
      token = res?.data?.data?.token
      console.log('token', token);
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
      token = await pMonitor.getToken(Authorization)
    }
    const url = `https://nb-pipeline.qiniuapi.com/v2/streams/${repoName}/data`
    Request({
      baseURL: url,
      methods: 'POST',
      headers: {
        'Authorization': 'Pandora ' + token, // token是接口获取到的七牛token
        'Content-Type': 'text/plain'
      },
      data: {
        c: data
      }
    })
  };
  // report data automatically
  pMonitor.logPackage = () => {
    const domComplete = pMonitor.getLoadTime();
    const timeoutRes = pMonitor.getTimeoutRes(config.timeout);
    pMonitor.log({ domComplete, timeoutRes });
  };

  /**
   * @param {object} option
   * @param {string} option.url
   * @param {number=} [option.timeout=10000]
   */
  pMonitor.init = (option) => {
    const { timeout = 10000, repoName = 'niuwa_web_dev', Authorization } = option;
    config = {
      timeout,
      repoName,
      Authorization
    };
  };
  return pMonitor;
})();

export default pm;
