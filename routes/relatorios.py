from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime, date
from database import get_db
import models
from auth import get_usuario_atual

router = APIRouter()

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    hoje = date.today()
    inicio_hoje = datetime.combine(hoje, datetime.min.time())
    fat_hoje = db.query(func.sum(models.Venda.total)).filter(
        models.Venda.criado_em >= inicio_hoje,
        models.Venda.status == models.StatusVenda.finalizada
    ).scalar() or 0
    vendas_hoje = db.query(func.count(models.Venda.id)).filter(
        models.Venda.criado_em >= inicio_hoje,
        models.Venda.status == models.StatusVenda.finalizada
    ).scalar() or 0
    total_produtos = db.query(func.count(models.Produto.id)).filter(models.Produto.ativo == True).scalar()
    estoque_critico = db.query(func.count(models.Estoque.id)).filter(
        models.Estoque.quantidade <= models.Estoque.quantidade_minima
    ).scalar()
    receitas = db.query(func.sum(models.Lancamento.valor)).filter(
        models.Lancamento.tipo == models.TipoLancamento.receita, models.Lancamento.pago == True
    ).scalar() or 0
    despesas = db.query(func.sum(models.Lancamento.valor)).filter(
        models.Lancamento.tipo == models.TipoLancamento.despesa, models.Lancamento.pago == True
    ).scalar() or 0
    return {
        "faturamento_hoje": fat_hoje,
        "vendas_hoje": vendas_hoje,
        "ticket_medio": fat_hoje / vendas_hoje if vendas_hoje else 0,
        "saldo_caixa": receitas - despesas,
        "total_produtos": total_produtos,
        "estoque_critico": estoque_critico,
    }

@router.get("/produtos-mais-vendidos")
def mais_vendidos(limit: int = 10, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    resultado = db.query(
        models.ItemVenda.produto_id,
        models.Produto.nome,
        func.sum(models.ItemVenda.quantidade).label("quantidade_total"),
        func.sum(models.ItemVenda.total).label("valor_total")
    ).join(models.Produto).join(models.Venda).filter(
        models.Venda.status == models.StatusVenda.finalizada
    ).group_by(models.ItemVenda.produto_id, models.Produto.nome).order_by(desc("valor_total")).limit(limit).all()
    return [{"produto_id": r[0], "nome": r[1], "quantidade_total": r[2], "valor_total": r[3]} for r in resultado]

@router.get("/posicao-estoque")
def posicao_estoque(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    estoques = db.query(models.Estoque).join(models.Produto).filter(models.Produto.ativo == True).all()
    return [
        {
            "produto_id": e.produto_id,
            "nome": e.produto.nome,
            "quantidade": e.quantidade,
            "quantidade_minima": e.quantidade_minima,
            "valor_estoque": e.quantidade * e.produto.preco_custo,
            "status": "esgotado" if e.quantidade <= 0 else ("critico" if e.quantidade <= e.quantidade_minima else "normal")
        }
        for e in estoques
    ]

@router.get("/notas-fiscais")
def listar_notas(skip: int = 0, limit: int = 50, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    notas = db.query(models.NotaFiscal).order_by(models.NotaFiscal.criado_em.desc()).offset(skip).limit(limit).all()
    return [{"id": n.id, "numero": n.numero, "status": n.status, "venda_id": n.venda_id, "criado_em": n.criado_em} for n in notas]

@router.post("/notas-fiscais/{venda_id}/emitir")
def emitir_nfe(venda_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    venda = db.query(models.Venda).filter(models.Venda.id == venda_id).first()
    if not venda:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Venda não encontrada")
    ultimo = db.query(func.max(models.NotaFiscal.numero)).scalar()
    proximo = str(int(ultimo or "0") + 1).zfill(6)
    nota = models.NotaFiscal(venda_id=venda_id, numero=proximo, status=models.StatusNFe.pendente)
    db.add(nota)
    db.commit()
    return {"mensagem": "NF-e em processamento", "numero": nota.numero}
