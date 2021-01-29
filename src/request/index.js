/* eslint-disable */
import axios from 'axios'

const Instance = axios.create({
  baseURL: '//jiliguala.com',
  timeout: 20000
})

export default Instance
