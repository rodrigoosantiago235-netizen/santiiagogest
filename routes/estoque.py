from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models, schemas
from auth import get_usuario_atual

router = APIRouter()

@router.get("/alertas")
def alertas_estoque(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    criticos = db.query(models.Estoque).join(models.Produto).filter(
        models.Produto.ativo == True,
        models.Estoque.quantidade <= models.Estoque.quantidade_minima
    ).all()
    return [
        {
            "produto_id": e.produto.id,
            "nome": e.produto.nome,
            "quantidade": e.quantidade,
            "quantidade_minima": e.quantidade_minima,
            "status": "esgotado" if e.quantidade <= 0 else "critico"
        }
        for e in criticos
    ]

@router.post("/movimentar")
def movimentar_estoque(
    dados: schemas.MovimentacaoCreate,
    db: Session = Depends(get_db),
    usuario=Depends(get_usuario_atual)
):
    estoque = db.query(models.Estoque).filter(
        models.Estoque.produto_id == dados.produto_id
    ).first()
    if not estoque:
        raise HTTPException(status_code=404, detail="Estoque não encontrado")
    if dados.tipo == models.TipoMovimentacao.entrada:
        estoque.quantidade += dados.quantidade
    elif dados.tipo == models.TipoMovimentacao.saida:
        if estoque.quantidade < dados.quantidade:
            raise HTTPException(status_code=400, detail="Estoque insuficiente")
        estoque.quantidade -= dados.quantidade
    else:
        estoque.quantidade = dados.quantidade
    mov = models.MovimentacaoEstoque(
        estoque_id=estoque.id,
        tipo=dados.tipo,
        quantidade=dados.quantidade,
        observacao=dados.observacao,
        usuario_id=usuario.id
    )
    db.add(mov)
    db.commit()
    return {"mensagem": "Movimentação registrada", "quantidade_atual": estoque.quantidade}

@router.get("/historico/{produto_id}")
def historico(produto_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    estoque = db.query(models.Estoque).filter(models.Estoque.produto_id == produto_id).first()
    if not estoque:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    movs = db.query(models.MovimentacaoEstoque).filter(
        models.MovimentacaoEstoque.estoque_id == estoque.id
    ).order_by(models.MovimentacaoEstoque.criado_em.desc()).limit(50).all()
    return [{"id": m.id, "tipo": m.tipo, "quantidade": m.quantidade, "data": m.criado_em} for m in movs]
