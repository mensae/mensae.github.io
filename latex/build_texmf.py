#!/usr/bin/env python3
"""Ricostruisce latex/texmf/ (il TeX Live ridotto usato dal browser).

Il bundle contiene solo i file che pdfTeX apre davvero per compilare il CV:
l'elenco sta in texmf-files.txt. Questo script

  1. copia quei file in texmf/, prendendoli dalla prima sorgente
     disponibile (il bundle stesso ha sempre la precedenza: i file "storici"
     di texlive.js non vanno mai sostituiti con quelli di un TeX Live moderno,
     che il formato latex.fmt del 2015 non digerirebbe);
  2. riduce pdftex.map alle sole famiglie usate (da 1,8 MB a pochi KB);
  3. rigenera i database ls-R e texmf.lst, senza i quali kpathsea non
     trova nulla.

Uso tipico
----------

  # dopo aver aggiunto una riga a texmf-files.txt
  python3 build_texmf.py --source "$(kpsewhich -var-value=TEXMFROOT)"

  # solo rigenerazione dei database (dopo una modifica manuale del bundle)
  python3 build_texmf.py

Le sorgenti hanno la stessa struttura di una radice TeX Live: contengono cioè
texmf-dist/, e nel caso di texlive.js anche texmf-var/ e texmf.cnf.
"""

import argparse
import os
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
BUNDLE = os.path.join(HERE, "texmf")
LIST_FILE = os.path.join(HERE, "texmf-files.txt")
LST_FILE = os.path.join(HERE, "texmf.lst")

# pdftex.map elenca migliaia di font che non abbiamo: teniamo solo le righe
# delle famiglie effettivamente presenti nel bundle.
MAP_PATH = "texmf-dist/fonts/map/pdftex/updmap/pdftex.map"
MAP_KEEP_PREFIXES = ("lm", "ec-lm", "rm-lm", "FontAwesome", "cm")

# ls-R viene rigenerato per questi alberi (gli altri non esistono nel bundle).
TREES = ("texmf-dist", "texmf-var", "texmf-config")


def read_file_list():
    wanted = []
    with open(LIST_FILE, encoding="utf-8") as handle:
        for line in handle:
            line = line.split("#", 1)[0].strip()
            if line:
                wanted.append(line)
    return wanted


def collect(wanted, sources, staging):
    """Copia ogni file richiesto nella prima sorgente che lo contiene."""
    missing = []

    for relative in wanted:
        for source in sources:
            candidate = os.path.join(source, relative)
            if os.path.isfile(candidate):
                target = os.path.join(staging, relative)
                os.makedirs(os.path.dirname(target), exist_ok=True)
                shutil.copyfile(candidate, target)
                break
        else:
            missing.append(relative)

    return missing


def slim_map(staging):
    path = os.path.join(staging, MAP_PATH)
    if not os.path.isfile(path):
        return 0, 0

    before = os.path.getsize(path)
    kept = []
    with open(path, encoding="utf-8", errors="replace") as handle:
        for line in handle:
            name = line.split(" ", 1)[0]
            if name.startswith(MAP_KEEP_PREFIXES):
                kept.append(line.rstrip("\n"))

    with open(path, "w", encoding="utf-8") as handle:
        handle.write("% pdftex.map ridotto da build_texmf.py\n")
        handle.write("\n".join(kept) + "\n")

    return before, os.path.getsize(path)


def write_ls_R(staging):
    """kpathsea legge ls-R invece di elencare le directory: va ricostruito."""
    for tree in TREES:
        base = os.path.join(staging, tree)
        if not os.path.isdir(base):
            continue

        lines = ["% ls-R -- filename database for kpathsea; do not change this line."]
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames.sort()
            filenames.sort()
            relative = os.path.relpath(dirpath, base)
            lines.append("")
            lines.append(("./" if relative == "." else "./" + relative) + ":")
            lines.extend(dirnames)
            lines.extend(name for name in filenames if name != "ls-R")

        with open(os.path.join(base, "ls-R"), "w", encoding="utf-8") as handle:
            handle.write("\n".join(lines) + "\n")


def write_lst(staging):
    """texmf.lst: una riga per directory ("/percorso/.") e una per file.

    pdftex-client.js la passa al worker, che dichiara ogni voce come file
    "pigro": il contenuto viene scaricato solo quando pdfTeX lo chiede.
    """
    entries = []
    for dirpath, dirnames, filenames in os.walk(staging):
        dirnames.sort()
        filenames.sort()
        relative = os.path.relpath(dirpath, staging)
        prefix = "" if relative == "." else "/" + relative
        entries.append(prefix + "/.")
        entries.extend(prefix + "/" + name for name in filenames)

    with open(LST_FILE, "w", encoding="utf-8") as handle:
        handle.write("\n".join(entries) + "\n")

    return len(entries)


def tree_size(path):
    total = 0
    for dirpath, _, filenames in os.walk(path):
        for name in filenames:
            total += os.path.getsize(os.path.join(dirpath, name))
    return total


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", action="append", default=[],
                        help="radice TeX Live da cui pescare i file mancanti (ripetibile)")
    parser.add_argument("--keep-map", action="store_true",
                        help="non ridurre pdftex.map")
    args = parser.parse_args()

    # il bundle attuale ha sempre la precedenza sulle sorgenti esterne
    sources = [BUNDLE] + [os.path.abspath(path) for path in args.source]
    for source in sources[1:]:
        if not os.path.isdir(source):
            sys.exit("sorgente inesistente: " + source)

    wanted = read_file_list()
    staging = BUNDLE + ".new"
    shutil.rmtree(staging, ignore_errors=True)

    missing = collect(wanted, sources, staging)
    if missing:
        shutil.rmtree(staging, ignore_errors=True)
        print("file non trovati in nessuna sorgente:", file=sys.stderr)
        for name in missing:
            print("  " + name, file=sys.stderr)
        sys.exit("aggiungi una --source che li contenga (per esempio "
                 "$(kpsewhich -var-value=TEXMFROOT))")

    if not args.keep_map:
        before, after = slim_map(staging)
        if before:
            print("pdftex.map: %d KB -> %d KB" % (before // 1024, after // 1024))

    write_ls_R(staging)

    shutil.rmtree(BUNDLE, ignore_errors=True)
    os.rename(staging, BUNDLE)

    entries = write_lst(BUNDLE)
    print("texmf: %d file, %.1f MB" % (len(wanted), tree_size(BUNDLE) / 1e6))
    print("texmf.lst: %d voci" % entries)


if __name__ == "__main__":
    main()
