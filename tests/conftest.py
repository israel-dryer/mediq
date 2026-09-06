import os
from contextlib import contextmanager
import psycopg, pytest
from dotenv import load_dotenv

load_dotenv()


@pytest.fixture
def db():
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        yield conn
        conn.rollback()


@contextmanager
def actor(conn, kind: str):
    conn.execute("select set_config('mediq.actor', %s, true)", (kind,))
    yield conn
