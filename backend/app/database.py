from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from app.config import settings

# Create database engine
engine = create_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"options": "-c timezone=UTC"},
    pool_pre_ping=True,
)


def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)


@event.listens_for(Engine, "connect")
def set_postgresql_timezone(dbapi_connection, connection_record):
    """Set timezone to UTC for PostgreSQL connections"""
    if "postgresql" in settings.database_url:
        with dbapi_connection.cursor() as cursor:
            cursor.execute("SET timezone TO 'UTC'")


def get_session():
    """Get database session.

    The session is automatically closed when the request completes.
    Commits should be called explicitly in route handlers.
    Rollbacks happen automatically on exceptions.
    """
    with Session(engine) as session:
        yield session
