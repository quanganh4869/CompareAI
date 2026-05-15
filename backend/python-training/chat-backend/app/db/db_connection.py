from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from configuration.logger.config import log
from configuration.settings import Settings
from sqlalchemy.engine import URL

from sqlalchemy.ext.asyncio import (  # isort: skip
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)


def _asyncpg_ssl_enabled(ssl_mode: str) -> bool:
    normalized = str(ssl_mode or "prefer").strip().lower()
    return normalized != "disable"


class Database:
    _engine = None
    _sessionmaker: Optional[async_sessionmaker] = None

    @classmethod
    def get_url(cls):
        settings = Settings()
        return URL.create(
            drivername="postgresql+asyncpg",
            username=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD,
            host=settings.POSTGRES_SERVER,
            port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB,
        )

    @classmethod
    def get_sync_url(cls):
        settings = Settings()
        return (
            f"postgresql://{settings.POSTGRES_USER}:"
            f"{settings.POSTGRES_PASSWORD}@"
            f"{settings.POSTGRES_SERVER}:"
            f"{settings.POSTGRES_PORT}/"
            f"{settings.POSTGRES_DB}"
            f"?sslmode={settings.POSTGRES_SSL_MODE}"
        )

    @classmethod
    def get_async_engine(cls):
        if cls._engine is None:
            settings = Settings()
            cls._engine = create_async_engine(
                cls.get_url(),
                echo=settings.DB_ECHO,
                future=True,
                pool_pre_ping=True,
                connect_args={"ssl": _asyncpg_ssl_enabled(settings.POSTGRES_SSL_MODE)},
            )
        return cls._engine

    @classmethod
    def get_sessionmaker(cls) -> async_sessionmaker:
        if cls._sessionmaker is None:
            engine = cls.get_async_engine()
            cls._sessionmaker = async_sessionmaker(
                bind=engine, expire_on_commit=False, autoflush=False
            )
        return cls._sessionmaker

    @classmethod
    async def get_async_db_session(cls) -> AsyncGenerator[AsyncSession, None]:
        session_maker = cls.get_sessionmaker()
        async_session: AsyncSession = session_maker()
        try:
            yield async_session
        except Exception as e:
            log.error(f"Error in database session: {e}")
            raise e
        finally:
            await async_session.close()  # noqa: ASYNC102

    @classmethod
    @asynccontextmanager
    async def get_instance_db(cls) -> AsyncSession:
        session_maker = cls.get_sessionmaker()
        async with session_maker() as session:
            yield session


class DatabaseReadOnly:
    _engine = None
    _sessionmaker: Optional[async_sessionmaker] = None

    @classmethod
    def get_url(cls):
        settings = Settings()
        return URL.create(
            drivername="postgresql+asyncpg",
            username=settings.READ_ONLY_POSTGRES_USER,
            password=settings.READ_ONLY_POSTGRES_PASSWORD,
            host=settings.READ_ONLY_POSTGRES_SERVER,
            port=settings.READ_ONLY_POSTGRES_PORT,
            database=settings.READ_ONLY_POSTGRES_DB,
        )

    @classmethod
    def get_async_engine(cls):
        if cls._engine is None:
            settings = Settings()
            cls._engine = create_async_engine(
                cls.get_url(),
                echo=settings.DB_ECHO,
                future=True,
                pool_pre_ping=True,
                connect_args={
                    "ssl": _asyncpg_ssl_enabled(settings.READ_ONLY_POSTGRES_SSL_MODE)
                },
            )
        return cls._engine

    @classmethod
    def get_sessionmaker(cls) -> async_sessionmaker:
        if cls._sessionmaker is None:
            engine = cls.get_async_engine()
            cls._sessionmaker = async_sessionmaker(
                bind=engine, expire_on_commit=False, autoflush=False
            )

        return cls._sessionmaker

    @classmethod
    def get_instance_db(cls) -> AsyncSession:
        async_session = cls.get_sessionmaker()
        return async_session
