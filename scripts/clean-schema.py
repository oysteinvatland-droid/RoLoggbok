#!/usr/bin/env python3
"""Renser et `pg_dump --schema-only`-dump fra Supabase til ren Postgres.

Fjerner det Supabase-spesifikke som ikke restorer i en vanlig postgres:16-container:
  - RLS:        CREATE POLICY ..., ALTER TABLE ... ENABLE/FORCE ROW LEVEL SECURITY
  - pg_cron:    CREATE EXTENSION pg_cron, SELECT cron.schedule(...)
  - rolle-ting: GRANT/REVOKE, og alt som refererer anon/authenticated/service_role

Leser stdin, skriver renset SQL til stdout og en oversikt over hva som ble droppet
til stderr (for gjennomgang). Statement-splittingen respekterer dollar-quoting
($$ ... $$ / $tag$ ... $tag$) slik at funksjons-/trigger-kropper ikke blir ødelagt.
"""
import re
import sys

text = sys.stdin.read()

# ── Del i topp-nivå-statements (respekter dollar-quoting) ────────────────────
statements = []
buf = []
i, n = 0, len(text)
dollar_tag = None
tag_re = re.compile(r'\$[A-Za-z0-9_]*\$')

while i < n:
    if dollar_tag is None:
        m = tag_re.match(text, i)
        if m:
            dollar_tag = m.group(0)
            buf.append(dollar_tag)
            i += len(dollar_tag)
            continue
        ch = text[i]
        buf.append(ch)
        i += 1
        if ch == ';':
            statements.append(''.join(buf))
            buf = []
    else:
        if text.startswith(dollar_tag, i):
            buf.append(dollar_tag)
            i += len(dollar_tag)
            dollar_tag = None
        else:
            buf.append(text[i])
            i += 1
if buf:
    statements.append(''.join(buf))

# ── Blokker statements som ikke hører hjemme i ren Postgres ───────────────────
BLOCK = re.compile(
    r'create\s+policy'
    r'|enable\s+row\s+level\s+security'
    r'|force\s+row\s+level\s+security'
    r'|pg_cron'
    r'|cron\.schedule'
    r'|\bcron\.'
    r'|^\s*grant\s'
    r'|^\s*revoke\s'
    r'|create\s+schema\s+public'      # public finnes alltid fra før i ren Postgres
    r'|comment\s+on\s+schema\s'
    r'|\bto\s+(anon|authenticated|service_role)\b',
    re.IGNORECASE | re.MULTILINE,
)

kept, dropped = [], []
for s in statements:
    code = s.strip()
    if code and BLOCK.search(code):
        dropped.append(code.splitlines()[0][:90])
    else:
        kept.append(s)

out = ''.join(kept)

# Supabase legger uuid-ossp i 'extensions'-skjemaet (finnes ikke i ren Postgres).
# Bytt til kjernefunksjonen gen_random_uuid() (pg13+) → ingen extension nødvendig.
out = out.replace('extensions.uuid_generate_v4()', 'gen_random_uuid()')

sys.stdout.write(out)

sys.stderr.write(f'-- clean-schema: droppet {len(dropped)} statement(s):\n')
for d in dropped:
    sys.stderr.write(f'--   {d}\n')
sys.stderr.write('-- Gjennomgå listen — alt skal være RLS/pg_cron/rolle-relatert.\n')
