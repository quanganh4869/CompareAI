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


class Database:
    _engine = None
    _sessionmaker: Optional[async_sessionmaker] = None

    @classmethod
    def get_url(cls):
        return URL.create(
            drivername="postgresql+asyncpg",
            username=Settings().POSTGRES_USER,
            password=Settings().POSTGRES_PASSWORD,
            host=Settings().POSTGRES_SERVER,
            port=Settings().POSTGRES_PORT,
            database=Settings().POSTGRES_DB,
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
        )

    @classmethod
    def get_async_engine(cls):
        if cls._engine is None:
            cls._engine = create_async_engine(
                cls.get_url(), echo=Settings().DB_ECHO, future=True, pool_pre_ping=True
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
        return URL.create(
            drivername="postgresql+asyncpg",
            username=Settings().READ_ONLY_POSTGRES_USER,
            password=Settings().READ_ONLY_POSTGRES_PASSWORD,
            host=Settings().READ_ONLY_POSTGRES_SERVER,
            port=Settings().READ_ONLY_POSTGRES_PORT,
            database=Settings().READ_ONLY_POSTGRES_DB,
        )

    @classmethod
    def get_async_engine(cls):
        if cls._engine is None:
            cls._engine = create_async_engine(
                cls.get_url(), echo=Settings().DB_ECHO, future=True, pool_pre_ping=True
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
