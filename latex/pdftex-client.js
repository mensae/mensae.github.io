//     ____  ____  ______ ______     __   ________    ____________   ________
//    / __ \/ __ \/ ____//_  __/__  / /  / ____/ /   /  _/ ____/ | / /_  __/
//   / /_/ / / / / /_     / / / _ \/ /  / /   / /    / // __/ /  |/ / / /
//  / ____/ /_/ / __/    / / /  __/ /  / /___/ /____/ // /___/ /|  / / /
// /_/   /_____/_/      /_/  \___/_/   \____/_____/___/_____/_/ |_/ /_/
//
// Thin promise wrapper around pdftex-worker.js (texlive.js, pdfTeX 1.40.11
// compiled to asm.js). The worker speaks JSON messages:
//   -> {command, arguments, msg_id}      <- {command:'result', result, msg_id}
// and pushes {command:'ready'} once, plus {command:'stdout'|'stderr'} lines.
//
// The TeX Live tree is NOT bundled inside the worker: files are declared as
// lazy files from `texmf.lst` and fetched over HTTP only when pdfTeX actually
// asks kpathsea for them. That is why the first compilation is the slow one
// and every later compilation in the same tab is nearly instantaneous.

(function (global) {
	"use strict";

	// The worker resolves its own XHRs against its own location, so the paths it
	// is given have to be absolute rather than relative to the page.
	function absolute(path) {
		return new URL(path, document.baseURI).href;
	}

	function PDFTeX(options) {
		options = options || {};
		this.workerUrl = options.workerUrl || "engine/pdftex-worker.js";
		this.listUrl = absolute(options.listUrl || "engine/texmf.lst");
		this.texmfUrl = absolute(options.texmfUrl || "engine/texmf");
		this.onLog = options.onLog || function () {};

		this._worker = null;
		this._nextId = 0;
		this._pending = {};
		this._ready = null;
		this._texmfMounted = null;
		this._ownFiles = [];
	}

	/** Boots the worker (idempotent). Resolves when pdfTeX is ready for commands. */
	PDFTeX.prototype.boot = function () {
		if (this._ready)
			return this._ready;

		var self = this;
		this._worker = new Worker(this.workerUrl);

		this._ready = new Promise(function (resolve, reject) {
			self._worker.onerror = function (err) {
				reject(new Error("pdftex worker failed to start: " + (err.message || err)));
			};
			self._worker.onmessage = function (ev) {
				var data = JSON.parse(ev.data);

				if (data.command === "ready") {
					resolve();
					return;
				}
				if (data.command === "stdout" || data.command === "stderr") {
					self.onLog(data.contents);
					return;
				}

				var resolver = self._pending[data.msg_id];
				if (resolver) {
					delete self._pending[data.msg_id];
					resolver(data);
				}
			};
		});

		return this._ready;
	};

	/**
	 * Sends one command. The worker answers every command except the ones that
	 * raise inside emscripten's filesystem (unlinking or reading a file that is
	 * not there just throws and nothing comes back), hence the optional timeout:
	 * it resolves with null instead of hanging the whole page forever.
	 */
	PDFTeX.prototype._send = function (command, args, timeoutMs) {
		var self = this;
		return this.boot().then(function () {
			return new Promise(function (resolve) {
				var msg_id = self._nextId++;
				var timer = null;

				self._pending[msg_id] = function (data) {
					if (timer)
						clearTimeout(timer);
					resolve(data);
				};

				if (timeoutMs)
					timer = setTimeout(function () {
						delete self._pending[msg_id];
						resolve(null);
					}, timeoutMs);

				self._worker.postMessage(JSON.stringify({
					command: command,
					arguments: args,
					msg_id: msg_id
				}));
			});
		});
	};

	/**
	 * Declares the whole TeX Live tree as lazy files (one HTTP request each,
	 * issued only on first use). Runs once per worker.
	 */
	PDFTeX.prototype.mountTexmf = function () {
		if (!this._texmfMounted)
			this._texmfMounted = this._send("FS_createLazyFilesFromList",
				["/", this.listUrl, this.texmfUrl, true, true]);
		return this._texmfMounted;
	};

	/**
	 * Writes a text file into the in-memory filesystem, at the root.
	 *
	 * The bytes are produced here on purpose: handing emscripten a JavaScript
	 * string makes it store one byte per character, so "à" would reach
	 * inputenc as a lone 0xE0 instead of the UTF-8 pair it expects.
	 */
	PDFTeX.prototype.writeText = function (name, contents) {
		return this.writeBinary(name, new TextEncoder().encode(contents));
	};

	/** Writes a binary file (Uint8Array / array of bytes) into the filesystem. */
	PDFTeX.prototype.writeBinary = function (name, bytes) {
		this._ownFiles.push(name);
		return this._send("FS_createDataFile",
			["/", name, Array.prototype.slice.call(bytes), true, true]);
	};

	/**
	 * Throws the worker away and boots a fresh one.
	 *
	 * Emscripten runs `main()` once per instance: after pdfTeX exits, the
	 * runtime is down and any further `run` is silently ignored. So a second
	 * compilation needs a second worker — which is cheap enough, since every
	 * file it lazily re-fetches comes straight from the browser cache.
	 */
	PDFTeX.prototype.reset = function () {
		if (this._worker)
			this._worker.terminate();

		this._worker = null;
		this._ready = null;
		this._texmfMounted = null;
		this._pending = {};
		this._nextId = 0;
		this._ownFiles = [];

		return this.boot();
	};

	/** Runs `pdflatex <jobname>.tex`. */
	PDFTeX.prototype.run = function (texFile) {
		return this._send("run",
			["-interaction=nonstopmode", "-output-format", "pdf", texFile]);
	};

	/**
	 * Reads a file back. The worker returns it as a binary string
	 * (one char per byte), which we widen back into bytes here.
	 */
	PDFTeX.prototype.readBinary = function (path) {
		return this._send("FS_readFile", [path], 60000).then(function (answer) {
			if (!answer || typeof answer.result !== "string")
				return null;

			var raw = answer.result;
			var bytes = new Uint8Array(raw.length);
			for (var i = 0; i < raw.length; i++)
				bytes[i] = raw.charCodeAt(i) & 0xff;
			return bytes;
		});
	};

	global.PDFTeX = PDFTeX;
})(window);
