export interface Client {
  id: number;
  name: string;
  website: string | null;
  notes: string | null;
  platformCount?: number;
  created_at: string;
  updated_at: string;
}

export interface Platform {
  id: number;
  clientId: number;
  platformType: string;
  label: string;
  url: string | null;
  username: string | null;
  password: string;
  hasPassword: boolean;
  notes: string | null;
  sortOrder: number;
  updatedAt: string;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ ok: boolean; username: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<{ authenticated: boolean; username?: string }>("/auth/me"),

  listClients: () => request<Client[]>("/clients"),
  getClient: (id: number) => request<Client>(`/clients/${id}`),
  createClient: (data: { name: string; website?: string; notes?: string }) =>
    request<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
  updateClient: (id: number, data: { name: string; website?: string; notes?: string }) =>
    request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteClient: (id: number) => request<{ ok: boolean }>(`/clients/${id}`, { method: "DELETE" }),

  listPlatforms: (clientId: number) => request<Platform[]>(`/clients/${clientId}/platforms`),
  revealPlatform: (clientId: number, platformId: number) =>
    request<Platform>(`/clients/${clientId}/platforms/${platformId}/reveal`),
  createPlatform: (
    clientId: number,
    data: {
      platformType: string;
      label: string;
      url?: string;
      username?: string;
      password?: string;
      notes?: string;
    }
  ) =>
    request<Platform>(`/clients/${clientId}/platforms`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updatePlatform: (
    clientId: number,
    platformId: number,
    data: {
      platformType: string;
      label: string;
      url?: string;
      username?: string;
      password?: string;
      notes?: string;
    }
  ) =>
    request<Platform>(`/clients/${clientId}/platforms/${platformId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deletePlatform: (clientId: number, platformId: number) =>
    request<{ ok: boolean }>(`/clients/${clientId}/platforms/${platformId}`, {
      method: "DELETE",
    }),
  reorderPlatforms: (clientId: number, order: number[]) =>
    request<{ ok: boolean }>(`/clients/${clientId}/platforms/reorder`, {
      method: "PUT",
      body: JSON.stringify({ order }),
    }),

  pdfUrl: (clientId: number) => `/api/clients/${clientId}/pdf`,
};

export { ApiError };
