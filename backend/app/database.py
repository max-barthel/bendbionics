from app.config import settings
from sqlmodel import Session, SQLModel, create_engine
import psycopg2  # noqa: F401
import asyncpg  # noqa: F401

# Ensure PostgreSQL dialect is used for PostgreSQL URLs
database_url = settings.database_url
if (database_url.startswith("postgresql://") and
        not database_url.startswith("postgresql+asyncpg://")):
    database_url = database_url.replace(
        "postgresql://", "postgresql+asyncpg://", 1
    )

# Create database engine
engine = create_engine(
    database_url,
    echo=settings.debug,
    connect_args=(
        {"check_same_thread": False}
        if "sqlite" in database_url
        else {}
    ),
    # Force PostgreSQL dialect
    pool_pre_ping=True,
)


def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)


def get_session():
    """Get database session"""
    with Session(engine) as session:
        yield session
