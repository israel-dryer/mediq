import os
from pathlib import Path
from typing import cast, LiteralString

import psycopg
from dotenv import load_dotenv

load_dotenv()
SEED = Path(__file__).resolve().parent.parent / "seed" / "seed.sql"

with psycopg.connect(os.environ["DATABASE_URL"], autocommit=True) as conn:
    text = cast(LiteralString, SEED.read_text(encoding="utf-8"))
    conn.execute(text)
    row = conn.execute("select count(*) from time_claim").fetchone()
    if row is None:
        raise SystemExit("count(*) returned no rows")
    print(f"seeded: {row[0]} claims")

