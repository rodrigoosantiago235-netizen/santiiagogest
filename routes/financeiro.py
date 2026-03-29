from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from database import get_db
import models, schemas
from auth import get_usuario_atual

router = APIRouter()

@router.get("/", response_model=List[schemas.LancamentoResponse])
def listar(tipo: Optional[str] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    q = db.query(models.Lancamento)
    if tipo:
        q = q.filter(models.Lancamento.tipo == tipo)
    return q.order_by(models.Lancamento.data.desc()).offset(skip).limit(limit).all()

@router.post("/", response_model=schemas.LancamentoResponse)
def criar(dados: schemas.LancamentoCreate, db: Session = Depends(get_db), usuario=Depends(get_usuario_atual)):
    l = models.Lancamento(
        descricao=dados.descricao,
        tipo=dados.tipo,
        valor=dados.valor,
        categoria=dados.categoria,
        pago=dados.pago,
        observacao=dados.observacao,
        usuario_id=usuario.id
    )
    db.add(l)
    db.commit()
    db.refresh(l)
    return l

@router.put("/{lancamento_id}/pagar")
def pagar(lancamento_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    l = db.query(models.Lancamento).filter(models.Lancamento.id == lancamento_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Não encontrado")
    l.pago = True
    db.commit()
    return {"mensagem": "Marcado como pago"}

@router.delete("/{lancamento_id}")
def deletar(lancamento_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    l = db.query(models.Lancamento).filter(models.Lancamento.id == lancamento_id).first()
    if not l:
        raise HTTPException(status_code=404, detail="Não encontrado")
    db.delete(l)
    db.commit()
    return {"mensagem": "Excluído"}

@router.get("/resumo/mensal")
def resumo_mensal(mes: int = Query(default=None), ano: int = Query(default=None), db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    hoje = date.today()
    mes = mes or hoje.month
    ano = ano or hoje.year
    inicio = datetime(ano, mes, 1)
    fim = datetime(ano, mes + 1, 1) if mes < 12 else datetime(ano + 1, 1, 1)
    receitas = db.query(func.sum(models.Lancamento.valor)).filter(
        models.Lancamento.tipo == models.TipoLancamento.receita,
        models.Lancamento.data >= inicio, models.Lancamento.data < fim
    ).scalar() or 0
    despesas = db.query(func.sum(models.Lancamento.valor)).filter(
        models.Lancamento.tipo == models.TipoLancamento.despesa,
        models.Lancamento.data >= inicio, models.Lancamento.data < fim
    ).scalar() or 0
    return {"mes": mes, "ano": ano, "receitas": receitas, "despesas": despesas, "saldo": receitas - despesas}
