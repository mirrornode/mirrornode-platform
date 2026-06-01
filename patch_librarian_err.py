import os

fp = 'app/librarian/page.tsx'
if os.path.exists(fp):
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Change "catch (err) {" to "catch (err: any) {" or just remove the variable usage warning by logging it
    content = content.replace('catch (err) {', 'catch (err) {\n      console.error(err);')
    
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {fp}")
else:
    print(f"File not found: {fp}")
