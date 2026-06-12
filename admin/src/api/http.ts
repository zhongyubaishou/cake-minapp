import axios from 'axios';
import { ElMessage } from 'element-plus';
import { clearAdminAuth } from '@/utils/permissions';

const http = axios.create({ baseURL: '/admin', timeout: 15000 });

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (axios.isCancel(err)) return Promise.reject(err);
    if (err.response?.status === 401) {
      clearAdminAuth();
      window.location.hash = '#/login';
      ElMessage.error('登录已过期，请重新登录');
    } else if (err.response?.status === 403) {
      ElMessage.error(err.response?.data?.message || '当前账号无此操作权限');
    } else if (err.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请检查网络后重试');
    } else if (!err.response) {
      ElMessage.error('网络连接失败，请检查网络后重试');
    } else {
      const msg = err.response?.data?.message || '请求失败，请稍后重试';
      ElMessage.error(msg);
    }
    return Promise.reject(err);
  },
);

export default http;
