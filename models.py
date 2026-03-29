from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    gerente = "gerente"
    operador = "operador"

class StatusVenda(str, enum.Enum):
    aberta = "aberta"
    finalizada = "finalizada"
    cancelada = "cancelada"

class TipoPagamento(str, enum.Enum):
    dinheiro = "dinheiro"
    cartao_credito = "cartao_credito"
    cartao_debito = "cartao_debito"
    pix = "pix"

class TipoLancamento(str, enum.Enum):
    receita = "receita"
    despesa = "despesa"

class StatusNFe(str, enum.Enum):
    pendente = "pendente"
    autorizada = "autorizada"
    cancelada = "cancelada"

# ─── USUÁRIO ───────────────────────────────────────────────────
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    senha_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.operador)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

# ─── CATEGORIA ─────────────────────────────────────────────────
class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(80), unique=True, nullable=False)
    produtos = relationship("Produto", back_populates="categoria")

# ─── PRODUTO ───────────────────────────────────────────────────
class Produto(Base):
    __tablename__ = "produtos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(200), nullable=False, index=True)
    codigo_barras = Column(String(50), unique=True, index=True)
    descricao = Column(Text)
    preco_venda = Column(Float, nullable=False)
    preco_custo = Column(Float, default=0.0)
    unidade = Column(String(10), default="UN")
    categoria_id = Column(Integer, ForeignKey("categorias.id"))
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    categoria = relationship("Categoria", back_populates="produtos")
    estoque = relationship("Estoque", back_populates="produto", uselist=False)
    itens_venda = relationship("ItemVenda", back_populates="produto")

# ─── ESTOQUE ───────────────────────────────────────────────────
class Estoque(Base):
    __tablename__ = "estoque"
    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), unique=True)
    quantidade = Column(Float, default=0.0)
    quantidade_minima = Column(Float, default=0.0)
    quantidade_maxima = Column(Float, default=0.0)
    atualizado_em = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    produto = relationship("Produto", back_populates="estoque")
    movimentacoes = relationship("MovimentacaoEstoque", back_populates="estoque")

class TipoMovimentacao(str, enum.Enum):
    entrada = "entrada"
    saida = "saida"
    ajuste = "ajuste"

class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"
    id = Column(Integer, primary_key=True, index=True)
    estoque_id = Column(Integer, ForeignKey("estoque.id"))
    tipo = Column(Enum(TipoMovimentacao))
    quantidade = Column(Float, nullable=False)
    observacao = Column(Text)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    estoque = relationship("Estoque", back_populates="movimentacoes")
    usuario = relationship("Usuario")

# ─── CLIENTE ───────────────────────────────────────────────────
class Cliente(Base):
    __tablename__ = "clientes"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(150), nullable=False)
    cpf_cnpj = Column(String(20), unique=True)
    email = Column(String(150))
    telefone = Column(String(20))
    endereco = Column(Text)
    ativo = Column(Boolean, default=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
    vendas = relationship("Venda", back_populates="cliente")

# ─── VENDA ─────────────────────────────────────────────────────
class Venda(Base):
    __tablename__ = "vendas"
    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    status = Column(Enum(StatusVenda), default=StatusVenda.aberta)
    tipo_pagamento = Column(Enum(TipoPagamento))
    subtotal = Column(Float, default=0.0)
    desconto = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    valor_recebido = Column(Float, default=0.0)
    troco = Column(Float, default=0.0)
    observacao = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    cliente = relationship("Cliente", back_populates="vendas")
    usuario = relationship("Usuario")
    itens = relationship("ItemVenda", back_populates="venda", cascade="all, delete-orphan")
    nota_fiscal = relationship("NotaFiscal", back_populates="venda", uselist=False)

class ItemVenda(Base):
    __tablename__ = "itens_venda"
    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"))
    produto_id = Column(Integer, ForeignKey("produtos.id"))
    quantidade = Column(Float, nullable=False)
    preco_unitario = Column(Float, nullable=False)
    desconto = Column(Float, default=0.0)
    total = Column(Float, nullable=False)

    venda = relationship("Venda", back_populates="itens")
    produto = relationship("Produto", back_populates="itens_venda")

# ─── FINANCEIRO ────────────────────────────────────────────────
class Lancamento(Base):
    __tablename__ = "lancamentos"
    id = Column(Integer, primary_key=True, index=True)
    descricao = Column(String(255), nullable=False)
    tipo = Column(Enum(TipoLancamento), nullable=False)
    valor = Column(Float, nullable=False)
    data = Column(DateTime(timezone=True), server_default=func.now())
    categoria = Column(String(80))
    pago = Column(Boolean, default=False)
    venda_id = Column(Integer, ForeignKey("vendas.id"), nullable=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    observacao = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    usuario = relationship("Usuario")

# ─── NOTA FISCAL ───────────────────────────────────────────────
class NotaFiscal(Base):
    __tablename__ = "notas_fiscais"
    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"), unique=True)
    numero = Column(String(20))
    serie = Column(String(5), default="001")
    chave_acesso = Column(String(50))
    status = Column(Enum(StatusNFe), default=StatusNFe.pendente)
    xml = Column(Text)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())

    venda = relationship("Venda", back_populates="nota_fiscal")
