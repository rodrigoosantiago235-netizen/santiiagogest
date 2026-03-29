from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date
from database import get_db
import models, schemas
from auth import get_usuario_atual

router = APIRouter()

@router.post("/", response_model=schemas.VendaResponse)
def criar_venda(dados: schemas.VendaCreate, db: Session = Depends(get_db), usuario=Depends(get_usuario_atual)):
    if not dados.itens:
        raise HTTPException(status_code=400, detail="A venda deve ter ao menos um item")
    subtotal = 0.0
    itens_processados = []
    for item_data in dados.itens:
        produto = db.query(models.Produto).filter(models.Produto.id == item_data.produto_id, models.Produto.ativo == True).first()
        if not produto:
            raise HTTPException(status_code=404, detail=f"Produto {item_data.produto_id} não encontrado")
        estoque = db.query(models.Estoque).filter(models.Estoque.produto_id == produto.id).first()
        if estoque and estoque.quantidade < item_data.quantidade:
            raise HTTPException(status_code=400, detail=f"Estoque insuficiente para {produto.nome}")
        preco = item_data.preco_unitario or produto.preco_venda
        total_item = (preco * item_data.quantidade) - item_data.desconto
        subtotal += total_item
        itens_processados.append((item_data, produto, estoque, preco, total_item))
    total = subtotal - dados.desconto
    troco = max(0, dados.valor_recebido - total) if dados.tipo_pagamento == models.TipoPagamento.dinheiro else 0
    venda = models.Venda(
        cliente_id=dados.cliente_id,
        usuario_id=usuario.id,
        status=models.StatusVenda.finalizada,
        tipo_pagamento=dados.tipo_pagamento,
        subtotal=subtotal,
        desconto=dados.desconto,
        total=total,
        valor_recebido=dados.valor_recebido,
        troco=troco,
        observacao=dados.observacao,
    )
    db.add(venda)
    db.flush()
    for item_data, produto, estoque, preco, total_item in itens_processados:
        item = models.ItemVenda(
            venda_id=venda.id,
            produto_id=produto.id,
            quantidade=item_data.quantidade,
            preco_unitario=preco,
            desconto=item_data.desconto,
            total=total_item
        )
        db.add(item)
        if estoque:
            estoque.quantidade -= item_data.quantidade
            db.add(models.MovimentacaoEstoque(
                estoque_id=estoque.id,
                tipo=models.TipoMovimentacao.saida,
                quantidade=item_data.quantidade,
                observacao=f"Venda #{venda.id}",
                usuario_id=usuario.id
            ))
    db.add(models.Lancamento(
        descricao=f"Venda #{venda.id}",
        tipo=models.TipoLancamento.receita,
        valor=total,
        categoria="Vendas",
        pago=True,
        venda_id=venda.id,
        usuario_id=usuario.id
    ))
    db.commit()
    db.refresh(venda)
    return venda

@router.get("/resumo/hoje")
def resumo_hoje(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    hoje = date.today()
    inicio = datetime.combine(hoje, datetime.min.time())
    fim = datetime.combine(hoje, datetime.max.time())
    vendas = db.query(models.Venda).filter(
        models.Venda.criado_em >= inicio,
        models.Venda.criado_em <= fim,
        models.Venda.status == models.StatusVenda.finalizada
    ).all()
    total = sum(v.total for v in vendas)
    return {"total_vendas": len(vendas), "faturamento": total, "ticket_medio": total / len(vendas) if vendas else 0}

@router.get("/", response_model=List[schemas.VendaResponse])
def listar_vendas(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    return db.query(models.Venda).options(joinedload(models.Venda.itens)).order_by(models.Venda.criado_em.desc()).offset(skip).limit(limit).all()

@router.put("/{venda_id}/cancelar")
def cancelar_venda(venda_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    venda = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    if not venda:
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    for item in venda.itens:
        estoque = db.query(models.Estoque).filter(models.Estoque.produto_id == item.produto_id).first()
        if estoque:
            estoque.quantidade += item.quantidade
    venda.status = models.StatusVenda.cancelada
    db.commit()
    return {"mensagem": "Venda cancelada"}
