const BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const res = await fetch(`${BASE}${url}`, config);

  if (res.status === 401) {
    // Session expired — redirect to login
    window.location.href = '/login';
    throw new Error('로그인이 필요합니다.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '요청 실패');
  return data;
}

export const api = {
  // Auth
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  me: () =>
    request('/auth/me'),

  // Products
  getProducts: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  getProductByBarcode: (code) => request(`/products/barcode/${encodeURIComponent(code)}`),
  createProduct: (data) =>
    request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProduct: (id, data) =>
    request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request('/categories'),
  getCategoryTree: () => request('/categories/tree'),
  createCategory: (data) =>
    request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) =>
    request('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSupplier: (id, data) =>
    request(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSupplier: (id) =>
    request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: () => request('/dashboard/summary'),
  getExpiryAlerts: () => request('/dashboard/expiry-alerts'),

  // Expiring products (grouped)
  getExpiringProducts: (group, limit = 50, offset = 0) => {
    const qs = new URLSearchParams({ group, limit, offset }).toString();
    return request(`/products/expiring?${qs}`);
  },

  // Excel
  exportExcel: () => {
    window.open(`${BASE}/excel/export`, '_blank');
  },
  downloadTemplate: () => {
    window.open(`${BASE}/excel/template`, '_blank');
  },
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/excel/import', {
      method: 'POST',
      body: formData,
    });
  },
};
