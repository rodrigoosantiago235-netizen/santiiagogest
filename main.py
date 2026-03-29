from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, produtos, vendas, financeiro, relatorios, estoque

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SantiagoGest API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, coloque o domínio do frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(produtos.router, prefix="/api/produtos", tags=["Produtos"])
app.include_router(estoque.router, prefix="/api/estoque", tags=["Estoque"])
app.include_router(vendas.router, prefix="/api/vendas", tags=["Vendas"])
app.include_router(financeiro.router, prefix="/api/financeiro", tags=["Financeiro"])
app.include_router(relatorios.router, prefix="/api/relatorios", tags=["Relatórios"])

@app.get("/")
def root():
    return {"status": "SantiagoGest API online", "version": "1.0.0"}
