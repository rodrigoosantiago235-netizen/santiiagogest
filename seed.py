"""
Execute este script UMA VEZ após criar o banco:
    python seed.py
"""
from database import SessionLocal, engine, Base
import models
from auth import hash_senha

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Admin
        if not db.query(models.Usuario).filter(models.Usuario.email == "admin@santiagogest.com").first():
            admin = models.Usuario(
                nome="Administrador",
                email="admin@santiagogest.com",
                senha_hash=hash_senha("admin123"),
                role=models.UserRole.admin
            )
            db.add(admin)

        # Categorias padrão
        categorias = ["Grãos", "Bebidas", "Laticínios", "Biscoitos", "Farinhas", "Massas", "Carnes", "Higiene", "Limpeza"]
        for nome in categorias:
            if not db.query(models.Categoria).filter(models.Categoria.nome == nome).first():
                db.add(models.Categoria(nome=nome))

        db.commit()
        print("✅ Banco populado com sucesso!")
        print("📧 Email: admin@santiagogest.com")
        print("🔑 Senha: admin123")
        print("⚠️  TROQUE A SENHA após o primeiro login!")

    except Exception as e:
        print(f"❌ Erro: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
