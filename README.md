# MediQ

The scheduling core of a medical practice, built as a Postgres project. Provider time is a single claim table with a
database-enforced no-overlap rule, so double-booking is structurally impossible; an ASAP list fills canceled slots with
holds that expire cleanly even if nothing is running, and a freed slot is accepted by exactly one patient.