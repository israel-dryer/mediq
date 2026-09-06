import uuid
import psycopg
import pytest
from conftest import actor

LOC = "4e8543d3-28d0-5a8a-84c4-c9fa9f74a7f7"
TYPE = "f9a57993-5a8c-5579-a870-a1eb8e529b6b"  # NP, 40 minutes

AVAILABILITY = """
               select provider_id, start
               from availability(%s, current_date + 1, current_date + 14, interval '40 minutes')
               """


def open_start(conn):
    """One (provider_id, start) the availability function currently offers."""
    return conn.execute(AVAILABILITY + " limit 1", (LOC,)).fetchall()[0]


def is_offered(conn, provider, start) -> bool:
    """Does availability() still offer this exact start for this provider?"""
    rows = conn.execute(
        AVAILABILITY + " where provider_id = %s and start = %s", (LOC, provider, start)
    ).fetchall()
    return len(rows) == 1


def a_patient(conn):
    return conn.execute("select id from patient limit 1").fetchall()[0][0]


def book(conn, provider, start, origin="patient"):
    """Call the database function and return the new appointment id."""
    return conn.execute(
        "select book(%s, %s, %s, %s, %s)",
        (a_patient(conn), provider, TYPE, start, origin),
    ).fetchall()[0][0]


def test_seed_loaded(db):
    assert db.execute("select count(*) from time_claim").fetchall()[0][0] > 10000


def test_book_returns_an_appointment(db):
    provider, start = open_start(db)

    with actor(db, "patient"):
        appt = book(db, provider, start)

    assert isinstance(appt, uuid.UUID)
    kind, released = db.execute(
        """
        select c.kind, c.released_at
        from appointment a
                 join time_claim c on c.id = a.time_claim_id
        where a.id = %s
        """,
        (appt,),
    ).fetchall()[0]
    assert kind == "appointment"
    assert released is None


def test_double_booking_raises_slot_taken(db):
    provider, start = open_start(db)

    with actor(db, "patient"):
        book(db, provider, start)

    # the second call must fail; the savepoint keeps the transaction usable afterward
    with actor(db, "staff"):
        with pytest.raises(psycopg.errors.RaiseException, match="slot_taken"):
            with db.transaction():
                book(db, provider, start, origin="staff")

    # exactly one live claim for that window
    n = db.execute(
        """
        select count(*)
        from time_claim
        where provider_id = %s
          and lower(during) = %s
          and released_at is null
        """,
        (provider, start),
    ).fetchall()[0][0]
    assert n == 1


def test_expired_hold_does_not_block_booking(db):
    provider, start = open_start(db)

    # a hold that lapsed a minute ago and was never swept
    hold = db.execute(
        """
        insert into time_claim (provider_id, during, kind, description, created_by, expires_at)
        values (%s, tstzrange(%s, %s + interval '40 minutes', '[)'), 'hold', 'test',
                'system:asap', now() - interval '1 minute')
        returning id
        """,
        (provider, start, start),
    ).fetchall()[0][0]

    with actor(db, "patient"):
        appt = book(db, provider, start)

    assert isinstance(appt, uuid.UUID)
    released = db.execute(
        "select released_at from time_claim where id = %s", (hold,)
    ).fetchall()[0][0]
    assert released is not None  # book() released it on the way in


def test_cancel_frees_the_start(db):
    provider, start = open_start(db)

    with actor(db, "patient"):
        appt = book(db, provider, start)
    assert not is_offered(db, provider, start)

    with actor(db, "staff"):
        db.execute("select cancel(%s)", (appt,))
    assert is_offered(db, provider, start)
