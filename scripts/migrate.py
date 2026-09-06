import os
import sys
from pathlib import Path

import psycopg
from dotenv import load_dotenv

load_dotenv()
MIGRATIONS = Path(__file__).resolve().parent.parent / "migrations"


def is_stub(sql: str) -> bool:
    """Empty after stripping blank lines and --- comments"""
    return not any(
        line.strip() and not line.strip().startswith("--")
        for line in sql.splitlines()
    )

def main() -> int:
    """Main entry point"""
    url = os.environ.get('DATABASE_URL')
    if not url:
        print("DATABASE_URL is not set", file=sys.stderr)
        return 1

    with psycopg.connect(url, autocommit=True) as conn:
        conn.execute("""
            create table if not exists schema_migrations (
                name text primary key,
                applied_at timestamptz not null default now()
            )
        """)
        applied = {r[0] for r in conn.execute("select name from schema_migrations")}

        pending = 0
        for path in sorted(MIGRATIONS.glob("*.sql")):
            if path.name in applied:
                continue
            sql = path.read_text(encoding="utf-8")
            if is_stub(sql):
                print(f"skipped {path.name} (stub)")
                continue

            try:
                with conn.transaction():
                    conn.execute(sql)
                    conn.execute("insert into schema_migrations (name) values (%s)", (path.name,))
            except psycopg.Error as e:
                print(f"FAILED  {path.name}\n{e}", file=sys.stderr)
                return 1

            print(f"applied  {path.name}")
            pending += 1

        print("up to date" if pending == 0 else f"{pending} applied")
    return 0

if __name__ == "__main__":
    sys.exit(main())
