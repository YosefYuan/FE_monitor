const base = {
  log () {},
  logPackage () {},
  getLoadTime () {},
  getTimeoutRes () {},
  bindEvent () {},
  init () {}
};

const pm = (function () {
  // 向前兼容
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

  // reprot data mannually
  pMonitor.log = (url, data = {}, type = 'POST') => {};

  // report data automatically
  pMonitor.logPackage = () => {
    const { url, timeoutUrl, method } = config;
    const domComplete = pMonitor.getLoadTime();
    const timeoutRes = pMonitor.getTimeoutRes(config.timeout);
    pMonitor.log(url, { domComplete }, method);
    pMonitor.log(timeoutUrl, { timeoutRes }, method);
  };

  /**
   * @param {object} option
   * @param {string} option.url 页面加载数据的上报地址
   * @param {string} option.timeoutUrl 页面资源超时的上报地址
   * @param {string=} [option.method='POST'] 请求方式
   * @param {number=} [option.timeout=10000]
   */
  pMonitor.init = (option) => {
    const { url, timeoutUrl, method = 'POST', timeout = 10000 } = option;
    config = {
      url,
      timeoutUrl,
      method,
      timeout
    };
  };
  return pMonitor;
})();

export default pm;
