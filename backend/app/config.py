from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

RAIZ = Path(__file__).resolve().parents[2]  # carpeta SalasDeEstudio/


class Settings(BaseSettings):
    """Configuración leída desde backend/.env (ver .env.example)."""

    model_config = SettingsConfigDict(env_file=RAIZ / "backend" / ".env", extra="ignore")

    database_url: str
    carpeta_uploads: Path = RAIZ / "data" / "uploads"
    embeddings_modelo: str = "intfloat/multilingual-e5-small"

    # Orden de preferencia: si el primero falla, se usa el siguiente.
    llm_proveedores: str = "claude,gemini"

    anthropic_api_key: str = ""
    claude_modelo: str = "claude-haiku-5-5"
    claude_esfuerzo: str = "low"  # low | medium | high

    gemini_api_key: str = ""
    gemini_modelo: str = "gemini-3.8-flash"
    gemini_razonamiento: str = "low"  # low | medium | high


settings = Settings()
