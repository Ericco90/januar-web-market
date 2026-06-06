// File: assets/js/api.js

// GANTI URL INI DENGAN URL WEB APP DEPLOYMENT GOOGLE APPS SCRIPT ANDA
const API_URL = "https://script.google.com/macros/s/AKfycbyCPfI7EAI4zCSxAQGVxVdmsoOUec2sI-kYjuQRp_kr2_1z5VMCJT8LzFIXhCj1z2PxbQ/exec";

// Generic fetch function for GET requests
async function fetchGet(action, params = {}) {
  try {
    const url = new URL(API_URL);
    url.searchParams.append('action', action);
    for (const key in params) {
      url.searchParams.append(key, params[key]);
    }
    
    // Using simple fetch (CORS might need JSONP or specific handling if not configured correctly in GAS)
    // GAS usually redirects to a googleusercontent.com domain, fetch follows it automatically
    const response = await fetch(url.toString(), {
      method: 'GET',
      mode: 'cors'
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching GET API:', error);
    return { status: 'error', message: error.message };
  }
}

// Generic fetch function for POST requests
async function fetchPost(action, payload, token = null) {
  try {
    const data = {
      action: action,
      payload: payload,
      token: token
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      mode: 'cors', // Using no-cors prevents reading response. GAS POST typically needs specific CORS or proxy. 
      // Assuming CORS is handled or using generic redirect text
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight for GAS
      },
      body: JSON.stringify(data)
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching POST API:', error);
    return { status: 'error', message: error.message };
  }
}

// Exported API Functions
const API = {
  getProducts: async () => {
    const res = await fetchGet('getProducts');
    if (res.status === 'success' && res.data) {
      res.data = res.data.map(p => {
        if (p.thumbnail && p.thumbnail.includes('drive.google.com/uc')) {
          const match = p.thumbnail.match(/id=([^&]+)/);
          if (match) p.thumbnail = 'https://lh3.googleusercontent.com/d/' + match[1];
        }
        return p;
      });
    }
    return res;
  },
  getTestimonials: () => fetchGet('getTestimonials'),
  getSettings: () => fetchGet('getSettings'),
  createOrder: (data) => fetchPost('createOrder', data),
  
  // Admin API
  adminLogin: (username, password) => fetchPost('adminLogin', {username, password}),
  adminGetOrders: (token) => fetchGet('adminGetOrders', {token}),
  adminAddProduct: (data, token) => fetchPost('adminAddProduct', data, token),
  adminUpdateProduct: (data, token) => fetchPost('adminUpdateProduct', data, token),
  adminDeleteProduct: (id, token) => fetchPost('adminDeleteProduct', {id}, token),
};
