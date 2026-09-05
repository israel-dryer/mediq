# MediQ

A patient-facing scheduling application for a medical practice: patients book
appointments, check in without paper, and join an ASAP list that automatically
offers them canceled slots as they open up. Postgres is the arbiter of every
schedule rule, so double-booking is structurally impossible; a held slot 
expires cleanly even if nothing is running, and a freed slot is accepted by
exactly one patient. The stack is Fastify 5 with TypeBox schemas and plain
pg (no ORM), and Angular front-end with separate `/patient` and `/staff` areas,
and live push to staff console over SSE via `LISTEN/NOTIFY`. This is a 
portfolio build with synthetic data and no real patients; it is under active
development.