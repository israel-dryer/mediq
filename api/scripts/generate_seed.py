"""
MediQ seed data generator.

Emits seed.sql: one location, four providers, five appointment types, weekly
templates, ~300 patients, a year of appointments (six months back, six forward),
some time-off/admin claims, ~30 active ASAP requests, and a message log.

Deterministic — same seed, same output. All timestamps are wall-clock in
America/New_York; the SQL sets the session timezone so DST is handled by Postgres.

Dates are RELATIVE: the generator works against an anchor week (Monday 2026-08-31,
"today" = Wednesday of that week) and the SQL shifts every timestamp by whole weeks
so that the anchor Monday lands on the Monday of the week the seed is applied.
Weekday alignment with provider templates is therefore preserved, and the
past/future split always falls in the current week.

Constraints honored:
  - no_overlap: appointments placed linearly within template blocks, never overlapping
  - ck_only_holds_expire / ck_non_appointments_described
  - ux_patient_identity (last_name, dob, phone) NULLS NOT DISTINCT
  - canceled/bumped appointments have their claim released (trigger fires on UPDATE only)
  - ux_message_once (appointment_id, kind, slot_offer_id)
"""

import random
import uuid
from datetime import date, datetime, timedelta, time

random.seed(20260902)

NS = uuid.UUID("6f1c2a7e-0000-4000-8000-000000000000")
def uid(key: str) -> str:
    return str(uuid.uuid5(NS, key))

def q(s: str) -> str:
    return "'" + s.replace("'", "''") + "'"

TODAY = date(2026, 9, 2)
START = TODAY - timedelta(days=182)
END   = TODAY + timedelta(days=182)

# ---------------------------------------------------------------- reference

LOCATION_ID = uid("location:main")

def npi_luhn(base9: str) -> str:
    """NPI check digit: Luhn over '80840' + 9 digits."""
    digits = [int(c) for c in ("80840" + base9)]
    total = 0
    for i, d in enumerate(reversed(digits)):
        if i % 2 == 0:
            d *= 2
            if d > 9: d -= 9
        total += d
    return base9 + str((10 - total % 10) % 10)

PROVIDERS = [
    ("smith",  "Allen Smith, MD",     npi_luhn("147759283")),
    ("okafor", "Chinwe Okafor, MD",   npi_luhn("192837465")),
    ("reyes",  "Daniela Reyes, NP",   npi_luhn("163728194")),
    ("lin",    "Marcus Lin, PA-C",    npi_luhn("158261937")),
]
PROVIDER_IDS = {k: uid(f"provider:{k}") for k, _, _ in PROVIDERS}

APPT_TYPES = [
    ("NP",    "New patient",           40),
    ("FU",    "Follow-up",             20),
    ("PHYS",  "Annual physical",       30),
    ("PROC",  "Procedure",             45),
    ("NURSE", "Nurse visit / vaccine", 10),
]
TYPE_IDS = {code: uid(f"apttype:{code}") for code, _, _ in APPT_TYPES}
TYPE_MIN = {code: m for code, _, m in APPT_TYPES}
# weighted mix of visit types
TYPE_WEIGHTS = [("FU", 45), ("NP", 15), ("PHYS", 15), ("NURSE", 20), ("PROC", 5)]

# templates: (provider, isodow, start, end) — one row per working block; lunch is the gap
TEMPLATES = []
def blocks(prov, days, morning=("08:00", "12:00"), afternoon=("13:00", "17:00")):
    for d in days:
        if morning:   TEMPLATES.append((prov, d, *morning))
        if afternoon: TEMPLATES.append((prov, d, *afternoon))

blocks("smith",  [1, 2, 3, 4, 5])
blocks("okafor", [1, 2, 3, 4], morning=("07:30", "11:30"), afternoon=("12:30", "16:30"))
blocks("reyes",  [1, 3, 5])
blocks("reyes",  [2, 4], morning=("08:00", "12:00"), afternoon=None)   # half days
blocks("lin",    [2, 3, 4, 5], morning=("09:00", "12:30"), afternoon=("13:30", "18:00"))

# ---------------------------------------------------------------- patients

FIRST = """James Mary Robert Patricia John Jennifer Michael Linda David Elizabeth William
Barbara Richard Susan Joseph Jessica Thomas Sarah Christopher Karen Charles Lisa Daniel
Nancy Matthew Betty Anthony Sandra Mark Ashley Donald Kimberly Steven Emily Paul Donna
Andrew Michelle Joshua Carol Kenneth Amanda Kevin Melissa Brian Deborah George Stephanie
Timothy Rebecca Ronald Sharon Edward Laura Jason Cynthia Jeffrey Kathleen Ryan Amy Jacob
Angela Gary Shirley Nicholas Anna Eric Brenda Jonathan Pamela Stephen Emma Larry Nicole
Justin Helen Scott Samantha Brandon Katherine Benjamin Christine Samuel Debra Gregory
Rachel Alexander Carolyn Patrick Janet Frank Catherine Raymond Maria Jack Heather Dennis
Diane Jerry Ruth Tyler Julie Aaron Olivia Jose Joyce Adam Virginia Nathan Victoria Henry
Kelly Douglas Lauren Zachary Christina Peter Joan Kyle Evelyn Noah Judith Ethan Megan
Jeremy Andrea Walter Cheryl Christian Hannah Keith Jacqueline Roger Martha Terry Gloria
Austin Teresa Sean Ann Gerald Sara Carl Madison Harold Frances Dylan Kathryn Arthur
Janice Lawrence Jean Jordan Abigail Jesse Alice Bryan Judy Billy Sophia Bruce Grace
Gabriel Denise Joe Amber Logan Doris Alan Marilyn Juan Danielle Albert Beverly Willie
Isabella Elijah Theresa Wayne Diana Randy Natalie Vincent Brittany Mason Charlotte Roy
Marie Ralph Kayla Bobby Alexis Russell Lori""".split()

LAST = """Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez Hernandez
Lopez Gonzalez Wilson Anderson Thomas Taylor Moore Jackson Martin Lee Perez Thompson White
Harris Sanchez Clark Ramirez Lewis Robinson Walker Young Allen King Wright Scott Torres
Nguyen Hill Flores Green Adams Nelson Baker Hall Rivera Campbell Mitchell Carter Roberts
Gomez Phillips Evans Turner Diaz Parker Cruz Edwards Collins Reyes Stewart Morris Morales
Murphy Cook Rogers Gutierrez Ortiz Morgan Cooper Peterson Bailey Reed Kelly Howard Ramos
Kim Cox Ward Richardson Watson Brooks Chavez Wood James Bennett Gray Mendoza Ruiz Hughes
Price Alvarez Castillo Sanders Patel Myers Long Ross Foster Jimenez Powell Jenkins Perry
Russell Sullivan Bell Coleman Butler Henderson Barnes Gonzales Fisher Vasquez Simmons
Romero Jordan Patterson Alexander Hamilton Graham Reynolds Griffin Wallace Moreno West
Cole Hayes Bryant Herrera Gibson Ellis Tran Medina Aguilar Stevens Murray Ford Castro
Marshall Owens Harrison Fernandez McDonald Woods Washington Kennedy Wells Vargas Henry
Chen Freeman Webb Tucker Guzman Burns Crawford Olson Simpson Porter Hunter Gordon Mendez
Silva Shaw Snyder Mason Dixon Munoz Hunt Hicks Holmes Palmer Wagner Black Robertson Boyd
Rose Stone Salazar Fox Warren Mills Meyer Rice Schmidt Garza Daniels Ferguson Nichols
Stephens Soto Weaver Ryan Gardner Payne Grant Dunn Kelley Spencer Hawkins Arnold Pierce
Vazquez Hansen Peters Santos Hart Bradley Knight Elliott Cunningham Duncan Armstrong
Hudson Carroll Lane Riley Andrews Alvarado Ray Delgado Berry Perkins Hoffman Johnston
Matthews Pena Richards Contreras Willis Carpenter Lawrence Sandoval Guerrero George
Chapman Rios Estrada Ortega Watkins Greene Nunez Wheeler Valdez Harper Burke Larson
Santiago Maldonado Morrison Franklin Carlson Austin Dominguez Carr Lawson Jacobs O'Brien
Fuller Lynch Mack Wolfe""".split()

patients = []
seen_identity = set()
n = 0
while len(patients) < 300:
    n += 1
    fn = random.choice(FIRST); ln = random.choice(LAST)
    dob = date(1940, 1, 1) + timedelta(days=random.randint(0, 365 * 70))
    phone = "704555" + f"{random.randint(0, 9999):04d}"
    if random.random() < 0.04:
        phone = None            # a few patients with no phone on file
    key = (ln.lower(), dob, phone)
    if key in seen_identity:
        continue
    seen_identity.add(key)
    pid = uid(f"patient:{n}")
    email = f"{fn.lower()}.{ln.lower().replace(chr(39), '')}{random.randint(1, 99)}@example.com"
    patients.append(dict(id=pid, mrn=f"MRN-{n:06d}", first=fn, last=ln, dob=dob, phone=phone, email=email))

# ---------------------------------------------------------------- time off / admin

# days (per provider) that are blocked entirely — no appointments generated there
blocked_days = {k: {} for k in PROVIDER_IDS}     # prov -> {date: (kind, description)}
def block_day(prov, d, kind, desc):
    blocked_days[prov][d] = (kind, desc)

# a vacation week for each provider, spread across the year
vac_starts = {"smith": date(2026, 7, 6), "okafor": date(2026, 11, 23),
              "reyes": date(2026, 4, 13), "lin": date(2027, 1, 18)}
for prov, s in vac_starts.items():
    for i in range(5):
        block_day(prov, s + timedelta(days=i), "time_off", "Vacation")

# admin mornings: first Monday of each month for smith, first Wednesday for lin
d = START
while d <= END:
    if d.day <= 7:
        if d.isoweekday() == 1: block_day("smith", d, "admin", "Charting / admin morning")
        if d.isoweekday() == 3: block_day("lin",   d, "admin", "Charting / admin morning")
    d += timedelta(days=1)

# ---------------------------------------------------------------- appointments

claims = []        # dicts: id, provider, start(dt), end(dt), kind, description, created_by, released_at
appointments = []  # dicts: id, claim_id, patient_id, type_code, status, origin, created_at

def wt_choice(pairs):
    tot = sum(w for _, w in pairs); r = random.uniform(0, tot)
    for v, w in pairs:
        r -= w
        if r <= 0: return v
    return pairs[-1][0]

def past_status():
    return wt_choice([("completed", 80), ("no_show", 8), ("canceled", 10), ("bumped", 2)])

def future_status():
    return wt_choice([("scheduled", 85), ("confirmed", 15)])

tmpl_by_prov_dow = {}
for prov, dow, s, e in TEMPLATES:
    tmpl_by_prov_dow.setdefault((prov, dow), []).append((s, e))

appt_n = 0
d = START
while d <= END:
    dow = d.isoweekday()
    for prov in PROVIDER_IDS:
        if d in blocked_days[prov]:
            kind, desc = blocked_days[prov][d]
            # block the whole working day for time_off; the morning block only for admin
            blks = tmpl_by_prov_dow.get((prov, dow), [])
            if not blks: continue
            if kind == "time_off":
                s = min(b[0] for b in blks); e = max(b[1] for b in blks)
            else:
                s, e = sorted(blks)[0]
            claims.append(dict(id=uid(f"claim:block:{prov}:{d}"), provider=prov,
                               start=datetime.combine(d, time.fromisoformat(s)),
                               end=datetime.combine(d, time.fromisoformat(e)),
                               kind=kind, description=desc, created_by="staff:desk", released_at=None, expires_at=None))
            if kind == "time_off": continue
            # admin: still generate afternoon appointments
            blks = sorted(blks)[1:]
        else:
            blks = tmpl_by_prov_dow.get((prov, dow), [])
        for s, e in blks:
            cur = datetime.combine(d, time.fromisoformat(s))
            end = datetime.combine(d, time.fromisoformat(e))
            fill = 0.65 if d < TODAY else (0.75 if (d - TODAY).days < 30 else 0.45)
            while True:
                code = wt_choice(TYPE_WEIGHTS)
                dur = timedelta(minutes=TYPE_MIN[code])
                if cur + dur > end: break
                if random.random() < fill:
                    appt_n += 1
                    pt = random.choice(patients)
                    origin = "patient" if random.random() < 0.6 else "staff"
                    created_by = f"patient:{pt['id']}" if origin == "patient" else "staff:desk"
                    status = past_status() if d < TODAY else future_status()
                    booked_at = cur - timedelta(days=random.randint(3, 45), hours=random.randint(0, 10))
                    released = None
                    if status in ("canceled", "bumped"):
                        # released somewhere between booking and the appointment itself
                        span_h = int((cur - booked_at).total_seconds() // 3600)
                        released = booked_at + timedelta(hours=random.randint(1, max(2, span_h - 1)))
                    cid = uid(f"claim:appt:{appt_n}")
                    claims.append(dict(id=cid, provider=prov, start=cur, end=cur + dur,
                                       kind="appointment", description=None,
                                       created_by=created_by, released_at=released, expires_at=None))
                    appointments.append(dict(id=uid(f"appt:{appt_n}"), claim_id=cid, patient_id=pt["id"],
                                             type_code=code, status=status, origin=origin,
                                             start=cur, created_at=booked_at))
                    cur += dur
                else:
                    cur += timedelta(minutes=10)   # a gap
    d += timedelta(days=1)

# ---------------------------------------------------------------- ASAP requests

future_appts = [a for a in appointments if a["start"].date() > TODAY + timedelta(days=14)
                and a["status"] in ("scheduled", "confirmed")]
random.shuffle(future_appts)
asap = []
used_appt = set()
for a in future_appts:
    if len(asap) >= 30: break
    if a["id"] in used_appt: continue
    used_appt.add(a["id"])
    shape = random.choice(["any", "mornings", "afternoons", "weekdays_only", "tu_th", "any", "any"])
    et, lt, days = None, None, None
    if shape == "mornings":   et, lt = "08:00", "12:00"
    if shape == "afternoons": et, lt = "13:00", "17:00"
    if shape == "weekdays_only": days = [1, 2, 3, 4, 5]
    if shape == "tu_th":      days = [2, 4]
    asap.append(dict(id=uid(f"asap:{a['id']}"), patient_id=a["patient_id"], appointment_id=a["id"],
                     earliest_date=TODAY + timedelta(days=1), latest_date=a["start"].date() - timedelta(days=1),
                     earliest_time=et, latest_time=lt, days=days,
                     priority_key=TODAY - timedelta(days=random.randint(1, 40), hours=random.randint(0, 12)),
                     miss_count=wt_choice([(0, 80), (1, 15), (2, 5)])))

# ---------------------------------------------------------------- expired offers (history behind miss_count)

offers = []
for r in asap:
    a = next(x for x in appointments if x["id"] == r["appointment_id"])
    for i in range(r["miss_count"]):
        # an earlier offer: a hold on a slot a few days out, which expired unanswered and was released
        offered_at = datetime.combine(TODAY, time(9, 0)) - timedelta(days=random.randint(2, 20), hours=random.randint(0, 6))
        slot_day = offered_at.date() + timedelta(days=random.randint(1, 5))
        while slot_day.isoweekday() > 5: slot_day += timedelta(days=1)
        slot_start = datetime.combine(slot_day, time(random.choice([9, 10, 11, 14, 15]), random.choice([0, 20, 40])))
        expires = offered_at + timedelta(hours=2)
        prov = random.choice(list(PROVIDER_IDS))
        hid = uid(f"claim:hold:{r['id']}:{i}")
        claims.append(dict(id=hid, provider=prov, start=slot_start, end=slot_start + timedelta(minutes=20),
                           kind="hold", description=f"ASAP offer hold for {r['patient_id'][:8]}",
                           created_by="system:asap", released_at=expires, expires_at=expires))
        offers.append(dict(id=uid(f"offer:{r['id']}:{i}"), asap_id=r["id"], claim_id=hid,
                           state="expired", expires_at=expires, created_at=offered_at,
                           appointment_id=r["appointment_id"], patient_id=r["patient_id"], slot_start=slot_start))

# ---------------------------------------------------------------- messages

# message tuple: (appointment_id, patient_id, slot_offer_id, kind, channel, text_prefix, slot_start, sent_at)
# body is assembled in SQL as text_prefix || formatted(shifted slot_start) so it matches the shifted dates
messages = []
claim_by_id = {c["id"]: c for c in claims}
for a in appointments:
    pt_id = a["patient_id"]; s = a["start"]
    ch = "sms" if random.random() < 0.7 else "email"
    messages.append((a["id"], pt_id, None, "booking_confirmation", ch,
                     "Your appointment is booked for ", s, a["created_at"]))
    cl = claim_by_id[a["claim_id"]]
    if s.date() < TODAY and (TODAY - s.date()).days <= 60:
        for kind, text, at in (("reminder_7d", "Reminder: your appointment is in one week, ", s - timedelta(days=7)),
                               ("reminder_1d", "Reminder: your appointment is tomorrow, ", s - timedelta(days=1))):
            if at > a["created_at"] and (cl["released_at"] is None or cl["released_at"] > at):
                messages.append((a["id"], pt_id, None, kind, ch, text, s, at))
    if a["status"] in ("canceled", "bumped"):
        messages.append((a["id"], pt_id, None, "cancellation_confirmation", ch,
                         "Your appointment has been canceled: ", s, cl["released_at"]))

for o in offers:
    messages.append((o["appointment_id"], o["patient_id"], o["id"], "asap_offer", "sms",
                     "An earlier slot opened up: ", o["slot_start"], o["created_at"]))
    messages.append((o["appointment_id"], o["patient_id"], o["id"], "asap_offer_expired", "sms",
                     "The offer has expired for ", o["slot_start"], o["expires_at"]))

# ---------------------------------------------------------------- emit SQL

def ts(dt): return f"pg_temp.s('{dt:%Y-%m-%d %H:%M}')"
def dd(d):  return f"pg_temp.d('{d}')"
def dt_or_null(dt): return ts(dt) if dt else "NULL"
def str_or_null(s): return q(s) if s is not None else "NULL"

out = []
w = out.append
w("-- MediQ seed data. Generated; do not hand-edit. Regenerate with generate_seed.py.")
w(f"-- Anchor window: {START} .. {END} (anchor 'today' = {TODAY}, a Wednesday). Shifted to the current week on apply.")
w("-- All wall-clock times America/New_York. Re-runnable: truncates demo tables first.")
w("BEGIN;")
w("SET LOCAL timezone = 'America/New_York';")
w("")
w("-- Shift helpers: move the anchor week (Mon 2026-08-31) onto the current week, whole weeks only.")
w("-- Session-scoped (pg_temp); they vanish when the connection closes. pg_temp functions must be called qualified.")
w("CREATE OR REPLACE FUNCTION pg_temp.shift() RETURNS interval LANGUAGE sql STABLE AS")
w("  $$ SELECT (date_trunc('week', current_date)::date - date '2026-08-31') * interval '1 day' $$;")
w("CREATE OR REPLACE FUNCTION pg_temp.s(t timestamp) RETURNS timestamptz LANGUAGE sql STABLE AS")
w("  $$ SELECT (t + pg_temp.shift())::timestamptz $$;")
w("CREATE OR REPLACE FUNCTION pg_temp.d(x date) RETURNS date LANGUAGE sql STABLE AS")
w("  $$ SELECT (x + pg_temp.shift())::date $$;")
w("CREATE OR REPLACE FUNCTION pg_temp.f(t timestamp) RETURNS text LANGUAGE sql STABLE AS")
w("  $$ SELECT to_char(pg_temp.s(t), 'FMDay, FMMonth FMDD at FMHH12:MI AM') $$;")
w("")
w("-- Re-runnable: clear demo data. Rules in appointment_transition are schema and are kept.")
w("TRUNCATE message_log, slot_offer, asap_request, appointment, time_claim,")
w("         provider_template, patient, appointment_type, provider, location CASCADE;")
w("")
w(f"INSERT INTO location (id, name, timezone) VALUES ({q(LOCATION_ID)}, 'Main Office', 'America/New_York');")
w("")
w("INSERT INTO provider (id, display_name, npi) VALUES")
w(",\n".join(f"  ({q(PROVIDER_IDS[k])}, {q(name)}, {q(npi)})" for k, name, npi in PROVIDERS) + ";")
w("")
w("INSERT INTO appointment_type (id, code, description, duration) VALUES")
w(",\n".join(f"  ({q(TYPE_IDS[c])}, {q(c)}, {q(desc)}, '{m} minutes')" for c, desc, m in APPT_TYPES) + ";")
w("")
w("INSERT INTO provider_template (provider_id, location_id, isodow, starts_at, ends_at) VALUES")
w(",\n".join(f"  ({q(PROVIDER_IDS[p])}, {q(LOCATION_ID)}, {dow}, '{s}', '{e}')" for p, dow, s, e in TEMPLATES) + ";")
w("")

def chunked(rows, size=500):
    for i in range(0, len(rows), size):
        yield rows[i:i + size]

w("-- patients")
for chunk in chunked(patients):
    w("INSERT INTO patient (id, mrn, last_name, first_name, dob, phone, email) VALUES")
    w(",\n".join(f"  ({q(p['id'])}, {q(p['mrn'])}, {q(p['last'])}, {q(p['first'])}, '{p['dob']}', {str_or_null(p['phone'])}, {q(p['email'])})"
                 for p in chunk) + ";")
w("")

w("-- time claims: appointments, time off, admin")
for chunk in chunked(claims):
    w("INSERT INTO time_claim (id, provider_id, during, kind, description, created_by, released_at, expires_at) VALUES")
    w(",\n".join(f"  ({q(c['id'])}, {q(PROVIDER_IDS[c['provider']])}, tstzrange({ts(c['start'])}, {ts(c['end'])}, '[)'), "
                 f"{q(c['kind'])}, {str_or_null(c['description'])}, {q(c['created_by'])}, {dt_or_null(c['released_at'])}, {dt_or_null(c['expires_at'])})"
                 for c in chunk) + ";")
w("")

w("-- appointments")
for chunk in chunked(appointments):
    w("INSERT INTO appointment (id, time_claim_id, patient_id, location_id, type_id, status, origin, created_at) VALUES")
    w(",\n".join(f"  ({q(a['id'])}, {q(a['claim_id'])}, {q(a['patient_id'])}, {q(LOCATION_ID)}, {q(TYPE_IDS[a['type_code']])}, "
                 f"{q(a['status'])}, {q(a['origin'])}, {ts(a['created_at'])})"
                 for a in chunk) + ";")
w("")

w("-- ASAP requests (active, attached to future appointments)")
def arr(days): return "NULL" if days is None else "ARRAY[" + ",".join(map(str, days)) + "]::smallint[]"
w("INSERT INTO asap_request (id, patient_id, appointment_id, earliest_date, latest_date, earliest_time, latest_time, allowed_isodow, priority_key, miss_count) VALUES")
w(",\n".join(f"  ({q(r['id'])}, {q(r['patient_id'])}, {q(r['appointment_id'])}, {dd(r['earliest_date'])}, {dd(r['latest_date'])}, "
             f"{str_or_null(r['earliest_time'])}, {str_or_null(r['latest_time'])}, {arr(r['days'])}, {ts(r['priority_key'])}, {r['miss_count']})"
             for r in asap) + ";")
w("")

w("-- expired slot offers (the history behind asap_request.miss_count)")
if offers:
    w("INSERT INTO slot_offer (id, asap_request_id, time_claim_id, state, expires_at, responded_at, created_at) VALUES")
    w(",\n".join(f"  ({q(o['id'])}, {q(o['asap_id'])}, {q(o['claim_id'])}, 'expired', {ts(o['expires_at'])}, NULL, {ts(o['created_at'])})"
                 for o in offers) + ";")
    w("")

w("-- message log (bodies assembled against the shifted dates)")
for chunk in chunked(messages):
    w("INSERT INTO message_log (appointment_id, patient_id, slot_offer_id, kind, channel, body, created_at) VALUES")
    w(",\n".join(f"  ({q(ap)}, {q(pt)}, {str_or_null(so)}, {q(kind)}, {q(ch)}, {q(text)} || pg_temp.f('{slot:%Y-%m-%d %H:%M}') || '.', {ts(at)})"
                 for ap, pt, so, kind, ch, text, slot, at in chunk) + ";")
w("")
w("COMMIT;")

open("seed.sql", "w").write("\n".join(out) + "\n")

n_past = sum(1 for a in appointments if a["start"].date() < TODAY)
print(f"providers {len(PROVIDERS)}  types {len(APPT_TYPES)}  templates {len(TEMPLATES)}  patients {len(patients)}")
print(f"claims {len(claims)}  appointments {len(appointments)}  (past {n_past}, future {len(appointments) - n_past})")
print(f"asap {len(asap)}  offers {len(offers)}  messages {len(messages)}")
from collections import Counter
print("statuses", dict(Counter(a['status'] for a in appointments)))
