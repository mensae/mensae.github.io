//    __  ____  ______
//   / / / / / / / __ )
//  / /_/ / / / / __  |
// / __  / /_/ / /_/ /
///_/ /_/\____/_____/
//
// Interfaccia di latex.html: un pulsante per versione, ognuno rigenera il
// LaTeX dai dati e lo compila in PDF dentro il browser.
//
// Il documento non sta qui: sta nei campi di testo della pagina, uno per
// versione, con i segnaposto {{nome}} al posto delle sezioni. Qui si carica
// (via getDataAndFill di general.js, che è l'unico a sapere i nomi dei file),
// si sostituisce e si compila.

(function () {
	"use strict";

	// Ogni versione è un campo della pagina più il nome del PDF scaricato.
	var VARIANTS = [
		{
			label: "CV completo",
			filename: "Mensa_CV",
			source: "source-full"
		},
		{
			label: "Solo pubblicazioni",
			filename: "Mensa_pubblicazioni",
			source: "source-publications"
		}
	];

	// File che affiancano il sorgente nel filesystem di pdfTeX. La prima pagina
	// segue i dati (BPATH la fa puntare a raw.githubusercontent su github.io),
	// la classe e la foto stanno dove stanno.
	var ASSETS = {
		"first_page.tex": (typeof BPATH === "string" ? BPATH : "_cv_data/") + "first_page.tex",
		"resume.cls": "latex/resume.cls",
		"profile_2.png": "img/profile_2.png"
	};

	var els = {
		status: document.getElementById("engine-status"),
		variants: document.getElementById("variants"),
		result: document.getElementById("result"),
		resultTitle: document.getElementById("result-title"),
		resultMeta: document.getElementById("result-meta"),
		preview: document.getElementById("preview"),
		downloadPdf: document.getElementById("download-pdf"),
		logView: document.getElementById("log-view")
	};

	var texlog = "";
	var busy = false;
	var blobUrls = [];

	var engine = new PDFTeX({
		workerUrl: "latex/pdftex-worker.js",
		listUrl: "latex/texmf.lst",
		texmfUrl: "latex/texmf",
		onLog: function (line) {
			texlog += line + "\n";
			els.logView.textContent = texlog;
		}
	});

	//    ------------------------------------------------------------------
	//    Sorgente → LaTeX completo
	//    ------------------------------------------------------------------

	var PLACEHOLDER = /\{\{(\w+)\}\}/g;

	/**
	 * Chiede a general.js i dati e a fill_latex.js di renderli, un blocco per
	 * ogni segnaposto trovato nel sorgente. I container sono gli stessi che si
	 * passavano quando erano elementi della pagina: basta che abbiano un
	 * `selector` e un `html()`.
	 */
	function renderBlocks(source) {
		var names = [];
		var blocks = {};
		var match;

		PLACEHOLDER.lastIndex = 0;
		while ((match = PLACEHOLDER.exec(source)) !== null)
			if (names.indexOf(match[1]) === -1)
				names.push(match[1]);

		var containers = names.map(function (name) {
			return {
				selector: "#" + name + "-container",
				html: function (contents) { blocks[name] = contents; }
			};
		});

		return new Promise(function (resolve, reject) {
			getDataAndFill("LATEX", containers)
				.done(function () { resolve(); })
				.fail(function () {
					reject(new Error("Impossibile leggere i dati da _cv_data/."));
				});
		}).then(function () {
			names.forEach(function (name) {
				if (typeof blocks[name] !== "string")
					throw new Error("Nel sorgente c'è {{" + name + "}}, ma _cv_data/ non ha " +
						"una sezione '" + name + "'.");
			});
			return blocks;
		});
	}

	function fillPlaceholders(source, blocks) {
		return source.replace(PLACEHOLDER, function (placeholder, name) {
			return blocks[name];
		});
	}

	//    ------------------------------------------------------------------
	//    File di contorno
	//    ------------------------------------------------------------------

	var assetsPromise = null;

	function loadAssets() {
		if (assetsPromise)
			return assetsPromise;

		assetsPromise = Promise.all(Object.keys(ASSETS).map(function (name) {
			return fetch(ASSETS[name]).then(function (response) {
				if (!response.ok)
					throw new Error("Impossibile leggere " + ASSETS[name] +
						" (HTTP " + response.status + ")");
				// il .png va scritto come byte, il resto come testo
				return name.slice(-4) === ".png"
					? response.arrayBuffer().then(function (b) { return new Uint8Array(b); })
					: response.text();
			});
		})).then(function (contents) {
			var files = {};
			Object.keys(ASSETS).forEach(function (name, index) { files[name] = contents[index]; });
			return files;
		});

		return assetsPromise;
	}

	//    ------------------------------------------------------------------
	//    Generazione
	//    ------------------------------------------------------------------

	function generate(variant) {
		if (busy)
			return;

		setBusy(true);
		texlog = "";
		els.logView.textContent = "";
		setStatus("Lettura di _cv_data/…", "busy");

		var started = Date.now();
		var source = document.getElementById(variant.source).value;
		var mainTex;

		Promise.all([renderBlocks(source), loadAssets()])
			.then(function (loaded) {
				mainTex = fillPlaceholders(source, loaded[0]);

				setStatus("Avvio di pdfTeX…", "busy");
				return engine.boot().then(function () { return engine.mountTexmf(); })
					.then(function () { return loaded[1]; });
			})
			.then(function (assets) {
				setStatus("Compilazione in corso (la prima è la più lenta)…", "busy");

				var writes = [engine.writeText("main.tex", mainTex)];
				Object.keys(assets).forEach(function (name) {
					writes.push(typeof assets[name] === "string"
						? engine.writeText(name, assets[name])
						: engine.writeBinary(name, assets[name]));
				});
				return Promise.all(writes);
			})
			.then(function () {
				return engine.run("main.tex");
			})
			.then(function () {
				if (texlog.indexOf("Output written on main.pdf") === -1)
					throw new Error("pdfTeX non ha prodotto il PDF.\n\n" + logExcerpt());
				return engine.readBinary("/main.pdf");
			})
			.then(function (pdf) {
				if (!pdf || !pdf.length)
					throw new Error("Il PDF risulta vuoto.\n\n" + logExcerpt());

				showResult(variant, pdf, Date.now() - started);
				setStatus("Fatto", "ok");
			})
			.catch(function (error) {
				setStatus(String(error.message || error), "error");
				els.logView.textContent = texlog;
				if (texlog)
					document.getElementById("log-panel").open = true;
			})
			.then(function () {
				setBusy(false);
				// pdfTeX gira una volta sola per worker: ne avviamo subito un
				// altro, così è già caldo al click successivo
				engine.reset().catch(function () {});
			});
	}

	function showResult(variant, pdf, elapsedMs) {
		var url = freshUrl(new Blob([pdf], { type: "application/pdf" }));
		var pages = /Output written on main\.pdf \((\d+) pages?/.exec(texlog);

		els.result.hidden = false;
		els.resultTitle.textContent = variant.label;
		els.resultMeta.textContent = [
			pages ? pages[1] + " pagine" : null,
			Math.round(pdf.length / 1024) + " KB",
			"generato in " + (elapsedMs / 1000).toFixed(1) + " s"
		].filter(Boolean).join(" · ");

		els.preview.src = url;
		fitPreview();
		els.downloadPdf.href = url;
		els.downloadPdf.download = variant.filename + "_" +
			new Date().toISOString().slice(0, 10) + ".pdf";
	}

	//    ------------------------------------------------------------------
	//    Utilità di pagina
	//    ------------------------------------------------------------------

	function setStatus(message, kind) {
		els.status.textContent = message;
		els.status.className = "status status--" + (kind || "idle");
	}

	function setBusy(state) {
		busy = state;
		Array.prototype.forEach.call(
			els.variants.querySelectorAll("button"),
			function (button) { button.disabled = state; }
		);
	}

	/**
	 * Dà all'anteprima tutta l'altezza che resta fino al fondo della finestra,
	 * così il PDF si vede intero senza scrollare la pagina attorno.
	 */
	function fitPreview() {
		if (els.result.hidden)
			return;

		var top = els.preview.getBoundingClientRect().top + window.pageYOffset;
		els.preview.style.height = Math.max(360, window.innerHeight - top - 24) + "px";
	}

	function freshUrl(blob) {
		var url = URL.createObjectURL(blob);
		blobUrls.push(url);
		return url;
	}

	/** Il pezzo di log attorno al primo errore, o la coda se non ce ne sono. */
	function logExcerpt() {
		var lines = texlog.split("\n");
		var first = lines.findIndex(function (line) { return line.indexOf("! ") === 0; });
		var from = first === -1 ? Math.max(0, lines.length - 12) : Math.max(0, first - 2);
		return lines.slice(from, from + 12).join("\n");
	}

	function renderVariants() {
		VARIANTS.forEach(function (variant) {
			var card = document.createElement("article");
			card.className = "variant";

			var title = document.createElement("h2");
			title.textContent = variant.label;

			var button = document.createElement("button");
			button.type = "button";
			button.className = "button button--primary";
			button.textContent = "Genera PDF";
			button.addEventListener("click", function () { generate(variant); });

			card.appendChild(title);
			card.appendChild(button);
			els.variants.appendChild(card);
		});
	}

	window.addEventListener("resize", fitPreview);

	window.addEventListener("unload", function () {
		blobUrls.forEach(URL.revokeObjectURL);
	});

	renderVariants();

	// il worker si scalda mentre si legge la pagina
	engine.boot().then(function () {
		setStatus("Motore LaTeX pronto", "ok");
	}, function (error) {
		setStatus("Motore non disponibile: " + error.message, "error");
	});
})();
