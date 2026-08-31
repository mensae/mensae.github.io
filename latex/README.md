# latex.html + latex/ — generatore di CV in PDF nel browser

`latex.html` sostituisce il giro attraverso Overleaf: legge i dati da
`_cv_data/`, li converte in LaTeX e compila il PDF **dentro il browser**, con
pdfTeX compilato in asm.js. Il server deve solo servire file statici: niente
node, niente `npx`, niente `pdflatex` lato server.

La pagina sta nella radice del sito con il suo `css/latex_hub.css` e il suo
`js/latex_hub.js`, insieme agli altri file del sito. Questa cartella contiene
tutto ciò che non si tocca: parser, motore, classe, strumenti.

Un click su *Genera PDF* fa esattamente questo:

1. prende il sorgente dal campo di testo della versione scelta;
2. carica i dati con `getDataAndFill('LATEX', …)` di `js/general.js` — lo
   stesso identico caricamento della pagina HTML del CV;
3. `js/fill_latex.js` li rende in LaTeX, un blocco per ogni segnaposto;
4. sostituisce i segnaposto, scrive tutto nel filesystem in memoria di pdfTeX
   e lancia `pdflatex main.tex`, mostrando il PDF pronto da scaricare.

La prima compilazione della sessione scarica il motore (≈ 3,2 MB) e la parte di
TeX Live che serve (≈ 3,7 MB, presa un file alla volta e solo se richiesta);
dopo la cache del browser fa il resto e ogni PDF esce in **1–2 secondi**.

## Dove si mette mano

| voglio cambiare…                       | file                                    |
| -------------------------------------- | --------------------------------------- |
| contenuti del CV                       | `_cv_data/*.json`, `0_publications.bib` |
| pagina di presentazione iniziale       | `_cv_data/first_page.tex`               |
| struttura del documento, preambolo, intestazione, sezioni | i campi in `latex.html` |
| quali versioni esistono                | `VARIANTS` in `js/latex_hub.js` + un campo in `latex.html` |
| aspetto delle voci (`\entry`, `\pub`…) | `latex/resume.cls`                      |
| come i dati diventano LaTeX            | `js/fill_latex.js`                      |
| foto                                   | `img/profile_2.png`                     |

## Il documento sta nella pagina

Non ci sono più `main.tex` né `0_head.tex`: ogni versione è **un documento
intero dentro un campo di testo** di `latex.html`, nel pannello *Sorgenti
LaTeX* (chiuso di default). Dentro c'è tutto srotolato — `\documentclass`,
pacchetti, `\name` e `\address`, `\begin{document}` — e al posto delle sezioni
i segnaposto fra doppie graffe:

```latex
\begin{mainSection}{Education and Academy Positions}{15}

{{career}}

\end{mainSection}
```

Il nome di un segnaposto è quello del file in `_cv_data/`, senza numero né
estensione: `career`, `research`, `teaching`, `talks`, `scicom`,
`publications`. Nel JavaScript non c'è nessun elenco di file né di sezioni: i
segnaposto vengono cercati nel testo con una regex, e i nomi dei file li sa
solo `js/general.js`, come per la pagina HTML.

Il campo è modificabile e la modifica vale per la generazione successiva: è
comodo per provare al volo. Non viene salvata da nessuna parte, quindi per
renderla definitiva va riportata in `latex.html`.

**Per aggiungere una versione** servono due cose: un `<textarea
id="source-qualcosa">` in `latex.html` con il documento, e una voce in
`VARIANTS` in `js/latex_hub.js`:

```js
{
    label: "Solo ricerca",
    note: "Progetti, revisioni e comitati di programma.",
    filename: "Mensa_ricerca",
    source: "source-qualcosa"
}
```

## Il parser LaTeX

`js/fill_latex.js` è il vecchio parser del sito, ripulito e corretto, e sta
dove stava: accanto al suo gemello. Ha la stessa forma di `js/fill_html.js` — stessa firma
`fillLatex(containers, data)`, stessa struttura, stesso `switch` sulle
sottosezioni che si comportano diversamente (`education` usa `\edu`,
`contributions` mette le views al posto della data) — e viene chiamato da
`getDataAndFill()` esattamente come il suo gemello HTML. Cambia solo l'output:
le macro di `resume.cls` invece del markup.

L'unica differenza tecnica è che riempie i container con `container.html(…)`
invece di `$(container).html(…)`: così funziona sia con gli oggetti jQuery sia
con gli stub che gli passa `latex_hub.js`, che non hanno bisogno del DOM.

Rispetto all'originale sono cambiate tre cose:

1. **Titoli con link spezzati male.** `\entry` e `\pub` vogliono il titolo su
   due argomenti e il taglio si faceva contando i caratteri grezzi: con un
   `\href` dentro, il separatore `}{` finiva *nel link*, e usciva

   ```latex
   \entry{\href{url}{5th International AIxIA Workshop on AI for}{Healthcare}}…
   ```

   cioè una macro con un argomento di troppo ("There's no line here to end") e
   la voce sballata nel PDF. Succedeva a una voce di *Programme Committee
   Member*. Ora si misura il testo visibile e, se il taglio cade dentro un
   link, l'`\href` viene chiuso e riaperto: due righe, entrambe cliccabili.

2. **Niente più ciclo infinito** quando la prima parola di un titolo è più
   lunga della riga (il vecchio codice cercava uno spazio all'indietro senza
   mai fermarsi).

3. **Escape uniforme.** Prima alcuni campi venivano protetti e altri no (i
   titoli delle pubblicazioni, per esempio, non lo erano): una `&` in un titolo
   avrebbe rotto la compilazione. Ora passano tutti dalla stessa funzione, che
   in più gestisce `#` e `$`. Graffe e backslash restano intatti di proposito:
   servono alla sintassi dei link nei JSON (`<us{…}um{…}ue>`).

A parità di dati l'output è identico a quello del vecchio parser, tranne che in
questi tre punti: verificato riga per riga su tutte le sezioni.

## Struttura

```
latex.html                  la pagina: interfaccia + i sorgenti dei documenti
css/latex_hub.css           il suo foglio di stile
js/latex_hub.js             la sua logica: versioni, segnaposto, compilazione
js/fill_latex.js            dati → LaTeX (gemello di js/fill_html.js)
img/profile_2.png           la foto della prima pagina
_cv_data/first_page.tex     il profilo iniziale, incluso con \input

latex/                      la scatola nera: qui dentro non serve mettere mano
├── pdftex-client.js        wrapper attorno al worker di pdfTeX
├── resume.cls              la classe con \edu, \pub, \entry, \minientry
├── pdftex-worker.js        pdfTeX 1.40.11 in asm.js (texlive.js)
├── texmf/                  sottoinsieme di TeX Live (100 file)
├── texmf.lst               indice dei file di texmf/
├── build_texmf.py          ricostruisce texmf/ e texmf.lst
├── texmf-files.txt         elenco dei file di TeX Live da includere
└── README.md               questo file
```

Il caricamento dei dati (`js/general.js`) e la citazione delle pubblicazioni
(`buildBibDescription`) restano condivisi con la pagina HTML del CV, così
quello online e il PDF non possono divergere.

## Una differenza rispetto al preambolo di Overleaf

Nel campo c'è una riga in più, `\normalfont` subito dopo
`\usepackage{lmodern}`. Senza, `fontenc` seleziona il font mentre la famiglia
corrente è ancora Computer Modern e pdfTeX cerca `ecrm1095`, che non fa parte
del TeX Live ridotto. Il risultato tipografico è identico.

## Il motore

`latex/pdftex-worker.js` è pdfTeX 1.40.11 compilato con Emscripten
([texlive.js](https://github.com/manuels/texlive.js), pacchetto npm
`texlive@1.2.0`). Gira in un Web Worker e chiede i file di TeX Live via HTTP
solo quando kpathsea li cerca davvero.

`latex/texmf/` non è tutto TeX Live: sono i **100 file effettivamente aperti**
durante una compilazione (più i `.pfb` corrispondenti a ogni `.tfm`, come
margine di sicurezza), elencati in `texmf-files.txt`. Rispetto
all'albero completo di texlive.js mancavano cinque pacchetti, aggiunti da un
TeX Live moderno: `lm` (Latin Modern), `wrapfig`, `needspace`, `fontawesome`
e `parskip` (versione v1, compatibile con il kernel LaTeX 2015 del formato
precompilato). Anche `pdftex.map` è stato ridotto da 1,8 MB a 40 KB tenendo
solo le famiglie presenti.

### Se una compilazione si lamenta di un file mancante

Nel pannello *Log di pdfTeX* comparirà `File 'xxx.sty' not found` oppure
`Font ... not loadable: Metric (TFM) file not found`. Allora:

```bash
cd latex
echo "texmf-dist/tex/latex/xxx/xxx.sty" >> texmf-files.txt
python3 build_texmf.py --source "$(kpsewhich -var-value=TEXMFROOT)"
```

Lo script copia i file mancanti dalla sorgente indicata (il TeX Live installato
sul Mac va benissimo), riduce di nuovo `pdftex.map` e rigenera `ls-R` e
`texmf.lst`. I file già presenti in `texmf/` non vengono mai
sovrascritti: le versioni "storiche" devono restare compatibili con
`latex.fmt`, che è precompilato e non si può rigenerare qui.

## Note operative

- **Non si apre da `file://`.** Servono i Web Worker e `fetch`, quindi va
  aperta da un server. In locale: `python3 -m http.server` nella radice del
  sito, poi `http://localhost:8000/latex.html`.
- **Una compilazione per worker.** Emscripten esegue `main()` una volta sola:
  dopo ogni PDF `latex_hub.js` butta via il worker e ne avvia subito un altro, così
  è già caldo al click successivo.
- **Testi UTF-8.** I sorgenti vengono scritti nel filesystem di pdfTeX già
  codificati in UTF-8: passando una stringa JavaScript, emscripten salverebbe
  un byte per carattere e `inputenc` scarterebbe le lettere accentate.
- **`_cv_data/` su github.io.** Jekyll non pubblica le cartelle che iniziano
  per `_`: `general.js` lo aggira leggendo da raw.githubusercontent, e `latex_hub.js`
  riusa `BPATH` per `first_page.tex`. Se un giorno metti un file `.nojekyll`
  nella radice, entrambe le strade continuano a funzionare.
- **Nei campi di testo niente `<`.** Sono dentro l'HTML della pagina: un `<`
  andrebbe scritto come `&lt;`. In LaTeX non serve quasi mai, ma vale la pena
  saperlo.

## Cosa resta manuale

Il pulsante *Scarica main.tex* dà il documento completo con i dati già dentro:
se un giorno servisse una modifica al volo, si apre e si incolla in Overleaf
come prima.
