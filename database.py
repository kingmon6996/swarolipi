import os
from contextlib import contextmanager

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine, inspect
from sqlmodel import SQLModel, Session


load_dotenv()

_engine = None


def get_engine():
    global _engine
    if _engine is not None:
        return _engine

    required_settings = {
        "DB_HOST": os.getenv("DB_HOST"),
        "DB_PORT": os.getenv("DB_PORT"),
        "DB_NAME": os.getenv("DB_NAME"),
        "DB_USER": os.getenv("DB_USER"),
        "DB_PASSWORD": os.getenv("DB_PASSWORD"),
    }
    missing_settings = [
        name for name, value in required_settings.items() if not value
    ]
    if missing_settings:
        raise RuntimeError(
            "Missing PostgreSQL settings: "
            + ", ".join(missing_settings)
            + ". Configure them in the environment or .env file."
        )

    try:
        port = int(required_settings["DB_PORT"])
    except ValueError as error:
        raise RuntimeError("DB_PORT must be a valid port number.") from error

    database_url = URL.create(
        "postgresql+psycopg2",
        username=required_settings["DB_USER"],
        password=required_settings["DB_PASSWORD"],
        host=required_settings["DB_HOST"],
        port=port,
        database=required_settings["DB_NAME"],
    )

    engine = create_engine(database_url, echo=False, pool_pre_ping=True)
    try:
        with engine.connect():
            pass
    except Exception as error:
        engine.dispose()
        raise RuntimeError(
            "Could not connect to the configured PostgreSQL database. "
            "Check DATABASE_URL, Supabase network access, and database credentials."
        ) from error

    _engine = engine
    print("[Database] Connected to PostgreSQL.")
    return engine


def init_db():
    engine = get_engine()
    SQLModel.metadata.create_all(engine)
    profile_table = SQLModel.metadata.tables.get("profile")
    if profile_table is not None:
        identity_document_hash = profile_table.c.get("identity_document_hash")
        if identity_document_hash is not None:
            with engine.begin() as connection:
                existing_columns = {
                    column["name"]
                    for column in inspect(connection).get_columns("profile")
                }
                if identity_document_hash.name not in existing_columns:
                    column_type = identity_document_hash.type.compile(
                        dialect=engine.dialect
                    )
                    connection.exec_driver_sql(
                        'ALTER TABLE "profile" ADD COLUMN '
                        f'"{identity_document_hash.name}" {column_type}'
                    )
                    print(
                        "[Database] Added missing profile.identity_document_hash "
                        "column to PostgreSQL."
                    )
    print("[Database] SQLModel tables initialized successfully.")


@contextmanager
def get_session():
    engine = get_engine()
    session = Session(engine)
    try:
        yield session
    finally:
        session.close()
