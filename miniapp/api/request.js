// API 基础配置
const BASE_URL = 'http://localhost:3001'
const TIMEOUT = 10000

// 请求封装
function request(options = {}) {
  const {
    url,
    method = 'GET',
    data = {},
    header = {},
    needToken = true
  } = options

  // 获取 token
  const token = uni.getStorageSync('token')
  
  // 合并请求头
  const requestHeader = {
    'Content-Type': 'application/json',
    ...header
  }

  if (needToken && token) {
    requestHeader['Authorization'] = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: requestHeader,
      timeout: TIMEOUT,
      success: (res) => {
        const { statusCode, data: responseData } = res
        
        // HTTP 状态码处理
        if (statusCode >= 200 && statusCode < 300) {
          // 业务码处理
          if (responseData.code === 0 || responseData.success) {
            resolve(responseData.data !== undefined ? responseData.data : responseData)
          } else {
            // 业务错误
            const errorMsg = responseData.message || responseData.msg || '请求失败'
            uni.showToast({
              title: errorMsg,
              icon: 'none',
              duration: 2000
            })
            reject(new Error(errorMsg))
          }
        } else if (statusCode === 401) {
          // 未授权，清除登录态
          uni.removeStorageSync('token')
          uni.removeStorageSync('userInfo')
          uni.reLaunch({
            url: '/pages/login/index'
          })
          reject(new Error('登录已过期，请重新登录'))
        } else if (statusCode === 403) {
          uni.showToast({
            title: '没有权限',
            icon: 'none'
          })
          reject(new Error('没有权限'))
        } else if (statusCode === 500) {
          uni.showToast({
            title: '服务器错误',
            icon: 'none'
          })
          reject(new Error('服务器错误'))
        } else {
          reject(new Error(`请求失败: ${statusCode}`))
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络异常，请检查网络',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// 便捷方法
export default {
  get(url, data = {}, options = {}) {
    return request({ url, method: 'GET', data, ...options })
  },
  
  post(url, data = {}, options = {}) {
    return request({ url, method: 'POST', data, ...options })
  },
  
  put(url, data = {}, options = {}) {
    return request({ url, method: 'PUT', data, ...options })
  },
  
  delete(url, data = {}, options = {}) {
    return request({ url, method: 'DELETE', data, ...options })
  },
  
  upload(url, filePath, formData = {}) {
    const token = uni.getStorageSync('token')
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: `${BASE_URL}${url}`,
        filePath,
        name: 'file',
        formData,
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          const data = JSON.parse(res.data)
          if (data.code === 0 || data.success) {
            resolve(data.data || data)
          } else {
            reject(new Error(data.message || '上传失败'))
          }
        },
        fail: reject
      })
    })
  }
}
