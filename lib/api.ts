const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth-token', token);
      } else {
        localStorage.removeItem('auth-token');
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth-token');
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  async get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  async patch(endpoint: string, data?: any) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

const apiClient = new ApiClient();

export const api = {
  auth: {
    login: async (email: string, password: string) => {
      const response = await apiClient.post('/api/auth/login', { email, password });
      if (response.token) {
        apiClient.setToken(response.token);
      }
      return response;
    },
    
    register: async (email: string, password: string, name: string) => {
      const response = await apiClient.post('/api/auth/register', { email, password, name });
      if (response.token) {
        apiClient.setToken(response.token);
      }
      return response;
    },
    
    logout: async () => {
      const response = await apiClient.post('/api/auth/logout');
      apiClient.setToken(null);
      return response;
    },
    
    getCurrentUser: async () => {
      return apiClient.get('/api/auth/me');
    },
  },

  projects: {
    list: async () => apiClient.get('/api/projects'),
    get: async (id: string) => apiClient.get(`/api/projects/${id}`),
    create: async (data: any) => apiClient.post('/api/projects', data),
    update: async (id: string, data: any) => apiClient.put(`/api/projects/${id}`, data),
    delete: async (id: string) => apiClient.delete(`/api/projects/${id}`),
    archive: async (id: string) => apiClient.post(`/api/projects/${id}/archive`),
    unarchive: async (id: string) => apiClient.post(`/api/projects/${id}/unarchive`),
  },

  tasks: {
    list: async (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiClient.get(`/api/tasks${query}`);
    },
    get: async (id: string) => apiClient.get(`/api/tasks/${id}`),
    create: async (data: any) => apiClient.post('/api/tasks', data),
    update: async (id: string, data: any) => apiClient.put(`/api/tasks/${id}`, data),
    updateStatus: async (id: string, status: string) => apiClient.put(`/api/tasks/${id}/status`, { status }),
    delete: async (id: string) => apiClient.delete(`/api/tasks/${id}`),
  },

  contacts: {
    list: async (params?: any) => {
      const query = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiClient.get(`/api/contacts${query}`);
    },
    get: async (id: string) => apiClient.get(`/api/contacts/${id}`),
    create: async (data: any) => apiClient.post('/api/contacts', data),
    update: async (id: string, data: any) => apiClient.put(`/api/contacts/${id}`, data),
    delete: async (id: string) => apiClient.delete(`/api/contacts/${id}`),
    addTags: async (id: string, tags: string[]) => apiClient.post(`/api/contacts/${id}/tags`, { tags }),
    removeTag: async (id: string, tag: string) => apiClient.delete(`/api/contacts/${id}/tags/${tag}`),
  },
};

export default apiClient;