import os

fp = 'app/osiris/page.tsx'
if os.path.exists(fp):
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()

    button_jsx = """
      <a 
        href={process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "#"} 
        className="fixed bottom-8 right-8 bg-[#00ff88] text-black px-6 py-3 font-mono font-bold hover:bg-white transition-colors z-50 shadow-[0_0_15px_rgba(0,255,136,0.3)]"
      >
        INITIATE AUDIT ($149)
      </a>
"""

    # Inject right before the last closing main or div tag
    if '</main>' in content:
        content = content.replace('</main>', button_jsx + '\n</main>')
    else:
        last_div = content.rfind('</div>')
        if last_div != -1:
            content = content[:last_div] + button_jsx + '\n' + content[last_div:]

    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Patched {fp} with MVP checkout button.")
else:
    print(f"Could not find {fp}")
