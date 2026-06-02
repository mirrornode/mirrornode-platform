from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Pinecone configuration — reads from environment / .env at repo root."""

    pinecone_api_key: str = Field(..., alias="PINECONE_API_KEY")
    pinecone_cloud: str = Field("aws", alias="PINECONE_CLOUD")
    pinecone_region: str = Field("us-east-1", alias="PINECONE_REGION")
    pinecone_index_name: str = Field("mirrornode-vault", alias="PINECONE_INDEX_NAME")
    pinecone_index_dim: int = Field(1536, alias="PINECONE_INDEX_DIM")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "populate_by_name": True,
    }


settings = Settings()
