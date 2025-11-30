from pathlib import Path
text = Path('contratos.js').read_text(encoding='utf-8')
print(len(text))
