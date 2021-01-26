import axios from 'axios'

const Instance = axios.create({
  baseURL: '//jiliguala.com',
  timeout: 5000
})

export default Instance
