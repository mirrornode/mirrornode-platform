import os

# 1. Fix the API route
fp_api = 'app/api/librarian/ingest/route.ts'
if os.path.exists(fp_api):
    with open(fp_api, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('meta {', 'meta {')
    
    with open(fp_api, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {fp_api}")

# 2. Fix the unused variable lint warning in the UI
fp_ui = 'app/librarian/page.tsx'
if os.path.exists(fp_ui):
    with open(fp_ui, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('catch (err) {', 'catch (err) {\n      console.error(err);')
    
    with open(fp_ui, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {fp_ui}")

