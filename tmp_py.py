from pathlib import Path
text = Path('index.html').read_text()
print(repr(text[:100]))
