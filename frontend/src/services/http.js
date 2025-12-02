import api from "./api";

// Generic helpers to keep services small and consistent

const get = (url, config) => api.get(url, config).then((res) => res.data);

const post = (url, data, config) =>
  api.post(url, data, config).then((res) => res.data);

const put = (url, data, config) =>
  api.put(url, data, config).then((res) => res.data);

const del = (url, config) => api.delete(url, config).then((res) => res.data);

export const http = { get, post, put, delete: del };
