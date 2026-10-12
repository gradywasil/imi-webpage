"""Rebuild minigames/library-titles.js (a small snapshot of Library titles used by Library Tidy).
Run from the repo root:  python minigames/tools/make-titles.py
Picks 70 short, readable titles per shelf from library/books.json, kids.json and archives.json."""
import json, random, re, io
random.seed(7)
L = lambda p: json.load(io.open('library/' + p, encoding='utf8'))
arch, books, kids = L('archives.json'), L('books.json'), L('kids.json')
clean = lambda t: re.sub(r'\s+', ' ', re.sub(r'[^A-Za-z0-9 ]', '', t.replace('&', 'and'))).strip().upper()


def pick(titles, n=70):
    seen, out = set(), []
    for t in titles:
        c = clean(t)
        if 3 <= len(c) <= 30 and c not in seen:
            seen.add(c)
            out.append(c)
    random.shuffle(out)
    return out[:n]


def by(a):
    return [x['title'] for x in arch if x['archive'] == a]


data = {
    'books': pick([b['parody'] for b in books]), 'kids': pick([k['title'] for k in kids]), 'films': pick(by('films')),
    'tv': pick(by('tv-shows')), 'radio': pick(by('radio-plays')), 'sketch': pick(by('sketches')), 'songs': pick(by('songs')),
}
io.open('minigames/library-titles.js', 'w', encoding='utf8', newline='\n').write(
    '/* A snapshot of Library titles for Library Tidy. Rebuild with: python minigames/tools/make-titles.py */\nwindow.LIB_TITLES = ' + json.dumps(data, indent=1) + ';\n')
print({k: len(v) for k, v in data.items()})
