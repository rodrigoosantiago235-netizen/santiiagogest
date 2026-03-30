import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "https://santiiagogest-production.up.railway.app/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sg_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("sg_token");
      localStorage.removeItem("sg_usuario");
      window.location.href = "/";
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (email, senha) => api.post("/auth/login", { email, senha }),
  me: () => api.get("/auth/me"),
};

export const produtosAPI = {
  listar: (params) => api.get("/produtos", { params }),
  criar: (dados) => api.post("/produtos", dados),
  atualizar: (id, dados) => api.put(`/produtos/${id}`, dados),
};

export const estoqueAPI = {
  alertas: () => api.get("/estoque/alertas"),
  movimentar: (dados) => api.post("/estoque/movimentar", dados),
};

export const vendasAPI = {
  criar: (dados) => api.post("/vendas", dados),
  listar: (params) => api.get("/vendas", { params }),
  resumoHoje: () => api.get("/vendas/resumo/hoje"),
};

export const financeiroAPI = {
  listar: (params) => api.get("/financeiro", { params }),
  criar: (dados) => api.post("/financeiro", dados),
  deletar: (id) => api.delete(`/financeiro/${id}`),
  resumoMensal: () => api.get("/financeiro/resumo/mensal"),
};

export const relatoriosAPI = {
  dashboard: () => api.get("/relatorios/dashboard"),
  maisVendidos: (params) => api.get("/relatorios/produtos-mais-vendidos", { params }),
  notasFiscais: () => api.get("/relatorios/notas-fiscais"),
};

export default api;
