/* eslint-disable */
export const formatParams = (data = {}) => {
  const {basic = {}, ...commonParams} =  data
  const { navigation, resources } =  basic
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
