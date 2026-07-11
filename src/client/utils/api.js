import axios from 'axios';

const api = axios.create({
  baseURL: '', // Using empty string to let it hit the Vite local proxy server `/api`
});

export default api;
