import os

fp = 'app/api/librarian/ingest/route.ts'
with open(fp, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open(fp, 'w', encoding='utf-8') as f:
    for line in lines:
        if 'meta {' in line:
            f.write(line.replace('meta {', 'meta {'))
        else:
            f.write(line)

print(f"Patched {fp}")
