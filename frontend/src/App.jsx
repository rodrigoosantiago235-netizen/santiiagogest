import { useState, useEffect } from "react";
import { authAPI, produtosAPI, vendasAPI, financeiroAPI, relatoriosAPI, estoqueAPI } from "./api/client";

const t = {
  bg: "#0D0F14", sidebar: "#13161E", card: "#1A1E2A", cardHover: "#1F2535",
  border: "#252A38", accent: "#F97316", accentSoft: "rgba(249,115,22,0.12)",
  blue: "#3B82F6", blueSoft: "rgba(59,130,246,0.12)",
  green: "#22C55E", greenSoft: "rgba(34,197,94,0.12)",
  red: "#EF4444", redSoft: "rgba(239,68,68,0.12)",
  text: "#F1F5F9", textMuted: "#64748B", textSub: "#94A3B8",
};

const Badge = ({ label, color, bg }) => (
  <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, color, background: bg }}>{label}</span>
);

const Btn = ({ label, onClick, color = t.accent, icon, fullWidth, variant = "solid", disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: variant === "solid" ? color : "transparent", border: `1px solid ${color}`,
    color: variant === "solid" ? "#fff" : color, borderRadius: 8, padding: "10px 18px",
    fontWeight: 600, fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
    display: "flex", alignItems: "center", gap: 6,
    width: fullWidth ? "100%" : "auto", justifyContent: fullWidth ? "center" : "flex-start",
    fontFamily: "inherit", opacity: disabled ? 0.5 : 1
  }}>{label}</button>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
    <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ color: t.text, margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 20 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = "text", placeholder }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: "block", color: t.textSub, fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 12px", color: t.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
  </div>
);

// LOGIN
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("admin@santiagogest.com");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro("");
    try {
      const res = await authAPI.login(email, senha);
      localStorage.setItem("sg_token", res.data.access_token);
      localStorage.setItem("sg_usuario", JSON.stringify(res.data.usuario));
      onLogin(res.data.usuario);
    } catch {
      setErro("Email ou senha incorretos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Sora', sans-serif" }}>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: "40px 36px", width: 380, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 24, fontWeight: 800, color: "#fff" }}>S</div>
          <h1 style={{ color: t.text, fontSize: 22, fontWeight: 800, margin: 0 }}>SantiagoGest</h1>
          <p style={{ color: t.textMuted, fontSize: 13, marginTop: 6 }}>Sistema de Gestão Empresarial</p>
        </div>
        <form onSubmit={handleLogin}>
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <Field label="Senha" value={senha} onChange={setSenha} type="password" />
          {erro && <div style={{ background: t.redSoft, border: `1px solid ${t.red}`, borderRadius: 8, padding: "10px 14px", color: t.red, fontSize: 13, marginBottom: 16 }}>{erro}</div>}
          <button type="submit" disabled={loading} style={{ width: "100%", background: t.accent, border: "none", borderRadius: 8, padding: "12px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
};

// DASHBOARD
const Dashboard = () => {
  const [dados, setDados] = useState(null);
  const [top, setTop] = useState([]);

  useEffect(() => {
    relatoriosAPI.dashboard().then(r => setDados(r.data)).catch(() => {});
    relatoriosAPI.maisVendidos({ limit: 5 }).then(r => setTop(r.data)).catch(() => {});
  }, []);

  const kpis = [
    { label: "Faturamento Hoje", val: `R$ ${(dados?.faturamento_hoje || 0).toFixed(2)}`, color: t.accent },
    { label: "Vendas Hoje", val: `${dados?.vendas_hoje || 0} vendas`, color: t.blue },
    { label: "Saldo Caixa", val: `R$ ${(dados?.saldo_caixa || 0).toFixed(2)}`, color: t.green },
    { label: "Estoque Crítico", val: `${dados?.estoque_critico || 0} itens`, color: t.red },
  ];

  return (
    <div>
      <h2 style={{ color: t.text, fontSize: 22, fontWeight: 800, margin: "0 0 24px" }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, borderTop: `3px solid ${k.color}` }}>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: t.text }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22 }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 15, marginBottom: 16 }}>Top Produtos</div>
        {top.length === 0 ? <div style={{ color: t.textMuted, fontSize: 13 }}>Nenhuma venda ainda.</div>
          : top.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ color: t.textSub, fontSize: 13 }}>{p.nome}</span>
              <span style={{ color: t.accent, fontWeight: 700 }}>R$ {p.valor_total.toFixed(2)}</span>
            </div>
          ))}
      </div>
    </div>
  );
};

// PDV
const PDV = () => {
  const [produtos, setProdutos] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [pagType, setPagType] = useState("dinheiro");
  const [recebido, setRecebido] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    produtosAPI.listar({ busca: search, limit: 50 }).then(r => setProdutos(r.data)).catch(() => {});
  }, [search]);

  const total = cart.reduce((s, i) => s + i.preco_venda * i.qty, 0);
  const troco = parseFloat(recebido || 0) - total;
  const addItem = (p) => setCart(c => { const ex = c.find(x => x.id === p.id); return ex ? c.map(x => x.id === p.id ? { ...x, qty: x.qty + 1 } : x) : [...c, { ...p, qty: 1 }]; });
  const updateQty = (id, qty) => qty <= 0 ? setCart(c => c.filter(x => x.id !== id)) : setCart(c => c.map(x => x.id === id ? { ...x, qty } : x));

  const finalizar = async () => {
    setLoading(true);
    try {
      await vendasAPI.criar({ tipo_pagamento: pagType, valor_recebido: parseFloat(recebido || total), itens: cart.map(i => ({ produto_id: i.id, quantidade: i.qty, preco_unitario: i.preco_venda })) });
      setCart([]); setModal(false); setRecebido("");
      setMsg("✅ Venda finalizada!"); setTimeout(() => setMsg(""), 3000);
    } catch (err) { alert(err.response?.data?.detail || "Erro"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <h2 style={{ color: t.text, fontSize: 22, fontWeight: 800, margin: "0 0 20px" }}>PDV / Caixa</h2>
      {msg && <div style={{ background: t.greenSoft, border: `1px solid ${t.green}`, borderRadius: 10, padding: "12px 16px", color: t.green, fontWeight: 600, marginBottom: 16 }}>{msg}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16 }}>
        <div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar produto..."
              style={{ width: "100%", background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "10px 14px", color: t.text, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, overflow: "auto", maxHeight: 400 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Produto", "Preço", "Estoque", ""].map(h => <th key={h} style={{ textAlign: "left", color: t.textMuted, fontSize: 11, fontWeight: 600, padding: "12px 16px", textTransform: "uppercase", borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                    <td style={{ padding: "10px 16px", color: t.text, fontSize: 13 }}>{p.nome}</td>
                    <td style={{ color: t.accent, fontWeight: 700 }}>R$ {p.preco_venda.toFixed(2)}</td>
                    <td><Badge label={`${p.estoque?.quantidade ?? 0}`} color={t.green} bg={t.greenSoft} /></td>
                    <td style={{ padding: "0 16px" }}><button onClick={() => addItem(p)} style={{ background: t.accentSoft, border: "none", borderRadius: 6, padding: "4px 12px", color: t.accent, fontWeight: 700, cursor: "pointer", fontSize: 18 }}>+</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 18px", borderBottom: `1px solid ${t.border}`, fontWeight: 700, color: t.text }}>🛒 Carrinho ({cart.length})</div>
          <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
            {cart.map(item => (
              <div key={item.id} style={{ background: t.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 8, border: `1px solid ${t.border}` }}>
                <div style={{ color: t.text, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{item.nome}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${t.border}`, background: "none", color: t.text, cursor: "pointer" }}>−</button>
                    <span style={{ color: t.text, fontWeight: 700, fontSize: 13 }}>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ width: 22, height: 22, borderRadius: 4, border: `1px solid ${t.border}`, background: "none", color: t.text, cursor: "pointer" }}>+</button>
                  </div>
                  <span style={{ color: t.accent, fontWeight: 700 }}>R$ {(item.preco_venda * item.qty).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderTop: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ color: t.text, fontWeight: 800, fontSize: 16 }}>TOTAL</span>
              <span style={{ color: t.accent, fontWeight: 800, fontSize: 20 }}>R$ {total.toFixed(2)}</span>
            </div>
            <Btn label="Finalizar Venda" onClick={() => setModal(true)} disabled={cart.length === 0} fullWidth />
          </div>
        </div>
      </div>
      {modal && (
        <Modal title="Finalizar Venda" onClose={() => setModal(false)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["dinheiro", "Dinheiro"], ["cartao_credito", "Crédito"], ["pix", "PIX"]].map(([v, l]) => (
              <button key={v} onClick={() => setPagType(v)} style={{ flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer", border: `1px solid ${pagType === v ? t.accent : t.border}`, background: pagType === v ? t.accentSoft : "none", color: pagType === v ? t.accent : t.textMuted, fontWeight: 600, fontSize: 12, fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
          <div style={{ background: t.bg, borderRadius: 10, padding: "14px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: t.textMuted }}>Total:</span>
            <span style={{ color: t.accent, fontWeight: 800, fontSize: 20 }}>R$ {total.toFixed(2)}</span>
          </div>
          {pagType === "dinheiro" && <Field label="Valor Recebido" value={recebido} onChange={setRecebido} type="number" placeholder="0,00" />}
          {recebido && pagType === "dinheiro" && <div style={{ background: troco >= 0 ? t.greenSoft : t.redSoft, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}><span style={{ color: troco >= 0 ? t.green : t.red, fontWeight: 700 }}>Troco: R$ {Math.abs(troco).toFixed(2)}</span></div>}
          <Btn label={loading ? "Processando..." : "Confirmar"} onClick={finalizar} disabled={loading} fullWidth />
        </Modal>
      )}
    </div>
  );
};

// ESTOQUE
const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ nome: "", preco_venda: "", preco_custo: "", quantidade_inicial: "", quantidade_minima: "" });

  const carregar = () => {
    produtosAPI.listar({ busca: search }).then(r => setProdutos(r.data)).catch(() => {});
    estoqueAPI.alertas().then(r => setAlertas(r.data)).catch(() => {});
  };
  useEffect(() => { carregar(); }, [search]);

  const salvar = async () => {
    try {
      await produtosAPI.criar({ ...form, preco_venda: +form.preco_venda, preco_custo: +form.preco_custo, quantidade_inicial: +form.quantidade_inicial, quantidade_minima: +form.quantidade_minima });
      setModal(false); setForm({ nome: "", preco_venda: "", preco_custo: "", quantidade_inicial: "", quantidade_minima: "" }); carregar();
    } catch (err) { alert(err.response?.data?.detail || "Erro"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: t.text, fontSize: 22, fontWeight: 800, margin: 0 }}>Estoque</h2>
        <Btn label="+ Novo Produto" onClick={() => setModal(true)} />
      </div>
      {alertas.length > 0 && <div style={{ background: t.redSoft, border: `1px solid ${t.red}`, borderRadius: 10, padding: "12px 16px", color: t.red, marginBottom: 16, fontWeight: 600 }}>⚠️ {alertas.length} produto(s) com estoque crítico!</div>}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..."
          style={{ background: t.bg, border: `1px solid ${t.border}`, borderRadius: 8, padding: "8px 12px", color: t.text, fontSize: 13, outline: "none", fontFamily: "inherit", marginBottom: 16, width: 250 }} />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Produto", "Qtd", "Mín.", "Venda", "Status"].map(h => <th key={h} style={{ textAlign: "left", color: t.textMuted, fontSize: 11, fontWeight: 600, padding: "0 0 12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {produtos.map(p => {
              const st = p.estoque?.status;
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${t.border}` }}>
                  <td style={{ padding: "11px 0", color: t.text, fontSize: 13 }}>{p.nome}</td>
                  <td style={{ color: st === "critico" ? t.red : t.text, fontWeight: 700 }}>{p.estoque?.quantidade ?? 0}</td>
                  <td style={{ color: t.textMuted }}>{p.estoque?.quantidade_minima ?? 0}</td>
                  <td style={{ color: t.accent, fontWeight: 700 }}>R$ {p.preco_venda.toFixed(2)}</td>
                  <td><Badge label={st === "normal" ? "Normal" : "Crítico"} color={st === "normal" ? t.green : t.red} bg={st === "normal" ? t.greenSoft : t.redSoft} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Novo Produto" onClose={() => setModal(false)}>
          <Field label="Nome" value={form.nome} onChange={v => setForm(f => ({ ...f, nome: v }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Preço Venda" value={form.preco_venda} onChange={v => setForm(f => ({ ...f, preco_venda: v }))} type="number" />
            <Field label="Preço Custo" value={form.preco_custo} onChange={v => setForm(f => ({ ...f, preco_custo: v }))} type="number" />
            <Field label="Qtd Inicial" value={form.quantidade_inicial} onChange={v => setForm(f => ({ ...f, quantidade_inicial: v }))} type="number" />
            <Field label="Qtd Mínima" value={form.quantidade_minima} onChange={v => setForm(f => ({ ...f, quantidade_minima: v }))} type="number" />
          </div>
          <Btn label="Salvar" onClick={salvar} fullWidth />
        </Modal>
      )}
    </div>
  );
};

// FINANCEIRO
const Financeiro = () => {
  const [lancamentos, setLancamentos] = useState([]);
  const [resumo, setResumo] = useState({});
  const [modal, setModal] = useState(false);
  const [tipo, setTipo] = useState("receita");
  const [form, setForm] = useState({ descricao: "", valor: "", categoria: "" });

  const carregar = () => {
    financeiroAPI.listar({}).then(r => setLancamentos(r.data)).catch(() => {});
    financeiroAPI.resumoMensal().then(r => setResumo(r.data)).catch(() => {});
  };
  useEffect(() => { carregar(); }, []);

  const salvar = async () => {
    try {
      await financeiroAPI.criar({ ...form, tipo, valor: +form.valor, pago: true });
      setModal(false); setForm({ descricao: "", valor: "", categoria: "" }); carregar();
    } catch (err) { alert(err.response?.data?.detail || "Erro"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ color: t.text, fontSize: 22, fontWeight: 800, margin: 0 }}>Financeiro</h2>
        <Btn label="+ Lançamento" onClick={() => setModal(true)} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        {[["Receitas", resumo?.receitas || 0, t.green], ["Despesas", resumo?.despesas || 0, t.red], ["Saldo", resumo?.saldo || 0, t.accent]].map(([l, v, c], i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c }}>R$ {v.toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Descrição", "Tipo", "Valor", ""].map(h => <th key={h} style={{ textAlign: "left", color: t.textMuted, fontSize: 11, fontWeight: 600, padding: "0 0 12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
          <tbody>
            {lancamentos.map((l, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${t.border}` }}>
                <td style={{ padding: "11px 0", color: t.text, fontSize: 13 }}>{l.descricao}</td>
                <td><Badge label={l.tipo} color={l.tipo === "receita" ? t.green : t.red} bg={l.tipo === "receita" ? t.greenSoft : t.redSoft} /></td>
                <td style={{ color: l.tipo === "receita" ? t.green : t.red, fontWeight: 700 }}>{l.tipo === "despesa" ? "- " : "+ "}R$ {l.valor.toFixed(2)}</td>
                <td><button onClick={async () => { await financeiroAPI.deletar(l.id); carregar(); }} style={{ background: "none", border: "none", cursor: "pointer", color: t.red, fontSize: 16 }}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title="Novo Lançamento" onClose={() => setModal(false)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["receita", "despesa"].map(tp => (
              <button key={tp} onClick={() => setTipo(tp)} style={{ flex: 1, padding: "10px", borderRadius: 8, cursor: "pointer", border: `1px solid ${tipo === tp ? (tp === "receita" ? t.green : t.red) : t.border}`, background: tipo === tp ? (tp === "receita" ? t.greenSoft : t.redSoft) : "none", color: tipo === tp ? (tp === "receita" ? t.green : t.red) : t.textMuted, fontWeight: 600, fontFamily: "inherit" }}>{tp === "receita" ? "✓ Receita" : "✕ Despesa"}</button>
            ))}
          </div>
          <Field label="Descrição" value={form.descricao} onChange={v => setForm(f => ({ ...f, descricao: v }))} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Valor" value={form.valor} onChange={v => setForm(f => ({ ...f, valor: v }))} type="number" />
            <Field label="Categoria" value={form.categoria} onChange={v => setForm(f => ({ ...f, categoria: v }))} />
          </div>
          <Btn label="Salvar" onClick={salvar} fullWidth />
        </Modal>
      )}
    </div>
  );
};

// RELATÓRIOS
const Relatorios = () => {
  const [notas, setNotas] = useState([]);
  const [top, setTop] = useState([]);
  useEffect(() => {
    relatoriosAPI.notasFiscais().then(r => setNotas(r.data)).catch(() => {});
    relatoriosAPI.maisVendidos({ limit: 10 }).then(r => setTop(r.data)).catch(() => {});
  }, []);
  return (
    <div>
      <h2 style={{ color: t.text, fontSize: 22, fontWeight: 800, margin: "0 0 20px" }}>Relatórios</h2>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22, marginBottom: 16 }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 15, marginBottom: 16 }}>Produtos Mais Vendidos</div>
        {top.length === 0 ? <div style={{ color: t.textMuted }}>Nenhum dado ainda.</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Produto", "Qtd", "Faturamento"].map(h => <th key={h} style={{ textAlign: "left", color: t.textMuted, fontSize: 11, fontWeight: 600, padding: "0 0 12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{top.map((p, i) => (<tr key={i} style={{ borderTop: `1px solid ${t.border}` }}><td style={{ padding: "11px 0", color: t.text, fontSize: 13 }}>{p.nome}</td><td style={{ color: t.textSub }}>{p.quantidade_total}</td><td style={{ color: t.accent, fontWeight: 700 }}>R$ {p.valor_total.toFixed(2)}</td></tr>))}</tbody>
          </table>
        )}
      </div>
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 22 }}>
        <div style={{ fontWeight: 700, color: t.text, fontSize: 15, marginBottom: 16 }}>Notas Fiscais</div>
        {notas.length === 0 ? <div style={{ color: t.textMuted }}>Nenhuma NF-e emitida.</div> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Número", "Venda", "Status", "Data"].map(h => <th key={h} style={{ textAlign: "left", color: t.textMuted, fontSize: 11, fontWeight: 600, padding: "0 0 12px", textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{notas.map((n, i) => (<tr key={i} style={{ borderTop: `1px solid ${t.border}` }}><td style={{ padding: "11px 0", color: t.textMuted, fontFamily: "monospace" }}>#{n.numero}</td><td style={{ color: t.textSub }}>#{n.venda_id}</td><td><Badge label={n.status} color={n.status === "autorizada" ? t.green : t.accent} bg={n.status === "autorizada" ? t.greenSoft : t.accentSoft} /></td><td style={{ color: t.textMuted, fontSize: 12 }}>{new Date(n.criado_em).toLocaleDateString("pt-BR")}</td></tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// APP PRINCIPAL
export default function App() {
  const [usuario, setUsuario] = useState(() => { try { return JSON.parse(localStorage.getItem("sg_usuario")); } catch { return null; } });
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const logout = () => { localStorage.removeItem("sg_token"); localStorage.removeItem("sg_usuario"); setUsuario(null); };
  if (!usuario) return <Login onLogin={setUsuario} />;

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "pdv", label: "PDV / Caixa", icon: "🛒" },
    { id: "estoque", label: "Estoque", icon: "📦" },
    { id: "financeiro", label: "Financeiro", icon: "💰" },
    { id: "relatorios", label: "Relatórios", icon: "📄" },
  ];
  const pages = { dashboard: <Dashboard />, pdv: <PDV />, estoque: <Estoque />, financeiro: <Financeiro />, relatorios: <Relatorios /> };

  return (
    <div style={{ display: "flex", height: "100vh", background: t.bg, fontFamily: "'Sora', 'Segoe UI', sans-serif", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap'); *{box-sizing:border-box} ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-thumb{background:#252A38;border-radius:2px}`}</style>
      <div style={{ width: collapsed ? 60 : 210, background: t.sidebar, borderRight: `1px solid ${t.border}`, display: "flex", flexDirection: "column", transition: "width 0.2s", flexShrink: 0, overflow: "hidden" }}>
        <div style={{ padding: "20px 14px", borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 800, color: "#fff", fontSize: 16 }}>S</div>
          {!collapsed && <div><div style={{ color: t.text, fontWeight: 800, fontSize: 13 }}>Santiago</div><div style={{ color: t.accent, fontWeight: 800, fontSize: 13 }}>Gest</div></div>}
        </div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {nav.map(item => {
            const active = page === item.id;
            return (
              <button key={item.id} onClick={() => setPage(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: collapsed ? "10px 12px" : "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, background: active ? t.accentSoft : "none", color: active ? t.accent : t.textMuted, fontFamily: "inherit", fontSize: 13, fontWeight: active ? 700 : 500 }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                {!collapsed && item.label}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "12px 8px", borderTop: `1px solid ${t.border}` }}>
          <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: "none", background: "none", color: t.red, cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
            <span>🚪</span>{!collapsed && "Sair"}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 54, borderBottom: `1px solid ${t.border}`, background: t.sidebar, display: "flex", alignItems: "center", paddingInline: 20, gap: 14, flexShrink: 0 }}>
          <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", color: t.textMuted, fontSize: 18 }}>☰</button>
          <span style={{ color: t.textMuted, fontSize: 13 }}>{nav.find(n => n.id === page)?.label}</span>
          <div style={{ flex: 1 }} />
          <span style={{ color: t.green, fontSize: 12, fontWeight: 600 }}>● {usuario.nome}</span>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>{pages[page]}</div>
      </div>
    </div>
  );
      }
