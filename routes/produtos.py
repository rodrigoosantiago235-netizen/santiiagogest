from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
import models, schemas
from auth import get_usuario_atual

router = APIRouter()

@router.get("/", response_model=List[schemas.ProdutoResponse])
def listar_produtos(
    busca: Optional[str] = Query(None),
    categoria_id: Optional[int] = None,
    ativo: bool = True,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual)
):
    q = db.query(models.Produto).options(
        joinedload(models.Produto.categoria),
        joinedload(models.Produto.estoque)
    ).filter(models.Produto.ativo == ativo)
    if busca:
        q = q.filter(
            models.Produto.nome.ilike(f"%{busca}%") |
            models.Produto.codigo_barras.ilike(f"%{busca}%")
        )
    if categoria_id:
        q = q.filter(models.Produto.categoria_id == categoria_id)
    produtos = q.offset(skip).limit(limit).all()
    result = []
    for p in produtos:
        pd = schemas.ProdutoResponse.from_orm(p)
        if p.estoque:
            pd.estoque = {
                "quantidade": p.estoque.quantidade,
                "quantidade_minima": p.estoque.quantidade_minima,
                "status": "critico" if p.estoque.quantidade <= p.estoque.quantidade_minima else "normal"
            }
        result.append(pd)
    return result

@router.get("/{produto_id}", response_model=schemas.ProdutoResponse)
def obter_produto(produto_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    produto = db.query(models.Produto).options(
        joinedload(models.Produto.categoria),
        joinedload(models.Produto.estoque)
    ).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return produto

@router.post("/", response_model=schemas.ProdutoResponse)
def criar_produto(dados: schemas.ProdutoCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    if dados.codigo_barras:
        existe = db.query(models.Produto).filter(models.Produto.codigo_barras == dados.codigo_barras).first()
        if existe:
            raise HTTPException(status_code=400, detail="Código de barras já cadastrado")
    produto = models.Produto(
        nome=dados.nome,
        codigo_barras=dados.codigo_barras,
        descricao=dados.descricao,
        preco_venda=dados.preco_venda,
        preco_custo=dados.preco_custo,
        unidade=dados.unidade,
        categoria_id=dados.categoria_id,
    )
    db.add(produto)
    db.flush()
    estoque = models.Estoque(
        produto_id=produto.id,
        quantidade=dados.quantidade_inicial,
        quantidade_minima=dados.quantidade_minima,
    )
    db.add(estoque)
    db.commit()
    db.refresh(produto)
    return produto

@router.put("/{produto_id}", response_model=schemas.ProdutoResponse)
def atualizar_produto(
    produto_id: int,
    dados: schemas.ProdutoUpdate,
    db: Session = Depends(get_db),
    _=Depends(get_usuario_atual)
):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    for k, v in dados.dict(exclude_none=True).items():
        setattr(produto, k, v)
    db.commit()
    db.refresh(produto)
    return produto

@router.delete("/{produto_id}")
def desativar_produto(produto_id: int, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    produto = db.query(models.Produto).filter(models.Produto.id == produto_id).first()
    if not produto:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    produto.ativo = False
    db.commit()
    return {"mensagem": "Produto desativado"}

@router.get("/categorias/lista", response_model=List[schemas.CategoriaResponse])
def listar_categorias(db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    return db.query(models.Categoria).all()

@router.post("/categorias/nova", response_model=schemas.CategoriaResponse)
def criar_categoria(dados: schemas.CategoriaCreate, db: Session = Depends(get_db), _=Depends(get_usuario_atual)):
    cat = models.Categoria(nome=dados.nome)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat
