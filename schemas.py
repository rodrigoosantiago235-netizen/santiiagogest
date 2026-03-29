from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import UserRole, StatusVenda, TipoPagamento, TipoLancamento, StatusNFe, TipoMovimentacao

# ─── AUTH ──────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict

class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    role: UserRole = UserRole.operador

class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    role: UserRole
    ativo: bool
    criado_em: datetime
    class Config: from_attributes = True

# ─── CATEGORIA ─────────────────────────────────────────────────
class CategoriaCreate(BaseModel):
    nome: str

class CategoriaResponse(BaseModel):
    id: int
    nome: str
    class Config: from_attributes = True

# ─── PRODUTO ───────────────────────────────────────────────────
class ProdutoCreate(BaseModel):
    nome: str
    codigo_barras: Optional[str] = None
    descricao: Optional[str] = None
    preco_venda: float
    preco_custo: float = 0.0
    unidade: str = "UN"
    categoria_id: Optional[int] = None
    quantidade_inicial: float = 0.0
    quantidade_minima: float = 0.0

class ProdutoUpdate(BaseModel):
    nome: Optional[str] = None
    preco_venda: Optional[float] = None
    preco_custo: Optional[float] = None
    unidade: Optional[str] = None
    categoria_id: Optional[int] = None
    ativo: Optional[bool] = None

class ProdutoResponse(BaseModel):
    id: int
    nome: str
    codigo_barras: Optional[str]
    preco_venda: float
    preco_custo: float
    unidade: str
    ativo: bool
    categoria: Optional[CategoriaResponse]
    estoque: Optional[dict] = None
    class Config: from_attributes = True

# ─── ESTOQUE ───────────────────────────────────────────────────
class EstoqueResponse(BaseModel):
    id: int
    produto_id: int
    quantidade: float
    quantidade_minima: float
    quantidade_maxima: float
    atualizado_em: datetime
    class Config: from_attributes = True

class MovimentacaoCreate(BaseModel):
    produto_id: int
    tipo: TipoMovimentacao
    quantidade: float
    observacao: Optional[str] = None

# ─── VENDA ─────────────────────────────────────────────────────
class ItemVendaCreate(BaseModel):
    produto_id: int
    quantidade: float
    preco_unitario: Optional[float] = None
    desconto: float = 0.0

class VendaCreate(BaseModel):
    cliente_id: Optional[int] = None
    tipo_pagamento: TipoPagamento
    desconto: float = 0.0
    valor_recebido: float = 0.0
    observacao: Optional[str] = None
    itens: List[ItemVendaCreate]

class ItemVendaResponse(BaseModel):
    id: int
    produto_id: int
    quantidade: float
    preco_unitario: float
    desconto: float
    total: float
    produto: Optional[dict] = None
    class Config: from_attributes = True

class VendaResponse(BaseModel):
    id: int
    cliente_id: Optional[int]
    usuario_id: int
    status: StatusVenda
    tipo_pagamento: TipoPagamento
    subtotal: float
    desconto: float
    total: float
    valor_recebido: float
    troco: float
    observacao: Optional[str]
    criado_em: datetime
    itens: List[ItemVendaResponse] = []
    class Config: from_attributes = True

# ─── FINANCEIRO ────────────────────────────────────────────────
class LancamentoCreate(BaseModel):
    descricao: str
    tipo: TipoLancamento
    valor: float
    categoria: Optional[str] = None
    pago: bool = False
    observacao: Optional[str] = None

class LancamentoResponse(BaseModel):
    id: int
    descricao: str
    tipo: TipoLancamento
    valor: float
    data: datetime
    categoria: Optional[str]
    pago: bool
    criado_em: datetime
    class Config: from_attributes = True

# ─── RELATÓRIOS ────────────────────────────────────────────────
class ResumoFinanceiro(BaseModel):
    total_receitas: float
    total_despesas: float
    saldo: float
    total_vendas: int
    ticket_medio: float

class ProdutoMaisVendido(BaseModel):
    produto_id: int
    nome: str
    quantidade_total: float
    valor_total: float

# ─── NOTA FISCAL ───────────────────────────────────────────────
class NotaFiscalResponse(BaseModel):
    id: int
    venda_id: int
    numero: Optional[str]
    serie: str
    chave_acesso: Optional[str]
    status: StatusNFe
    criado_em: datetime
    class Config: from_attributes = True
