from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración leída desde backend/.env (ver .env.example)."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    embeddings_modelo: str = "intfloat/multilingual-e5-small"

    llm_proveedor: str = "ollama"  # ollama | gemini | claude

    ollama_url: str = "http://localhost:11434"
    ollama_modelo: str = "qwen2.5:7b"

    gemini_api_key: str = ""
    gemini_modelo: str = "gemini-2.5-flash"

    anthropic_api_key: str = ""
    claude_modelo: str = "claude-haiku-5-5"


settings = Settings()
