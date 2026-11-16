# Portfolio di Cristian Principi

Sito statico, senza framework e senza build.

- `index.html`: la pagina. I testi italiani sono qui.
- `js/i18n.js`: i testi inglesi (stesse chiavi dei `data-i18n` nell'HTML).
- `js/main.js`: sipario, animazioni, demo dell'apertura, form.
- `css/style.css`: stile; i colori sono in cima, sotto `:root`.
- `cv.html`: il curriculum (`?lang=en` per l'inglese). I PDF in `assets/cv/` si rigenerano con:

```fish
python3 -m http.server 8765 --bind 127.0.0.1 &
for l in it en
    chromium --headless --no-pdf-header-footer --virtual-time-budget=4000 \
        --print-to-pdf=assets/cv/Cristian-Principi-CV-(string upper $l).pdf "http://127.0.0.1:8765/cv.html?lang=$l"
end
```

## Form di contatto

Crea un form su https://web3forms.com e incolla la chiave pubblica in `WEB3FORMS_KEY`, in cima a
`js/main.js`. Finché è vuota, il form risponde che non è ancora collegato.

## Pubblicazione su GitHub Pages

Repo pubblico `cristianprincipi.github.io`, push di questa cartella sul ramo `main`: il sito è
servito su `https://cristianprincipi.github.io`.

Font: Newsreader e DM Mono, licenza OFL (testi in `assets/fonts/`).
