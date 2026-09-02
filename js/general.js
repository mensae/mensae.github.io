// smart path building 
const REPO = "https://raw.githubusercontent.com/mensae/mensae.github.io/main/"; 
const BPATH = location.hostname.endsWith("github.io")?  REPO+"_cv_data/": "_cv_data/";

function getDataAndFill(where, containers) {

	return $.when(
		$.get(BPATH+'0_publications.bib'),
		$.getJSON(BPATH+'1_career.json'),
		$.getJSON(BPATH+'2_research.json'),
		$.getJSON(BPATH+'3_teaching.json'),
		$.getJSON(BPATH+'4_talks.json'),
		$.getJSON(BPATH+'5_scicomm.json')

	).done(function (publications, career, research, teaching, talks, scicomm) {
		data = {}; 

		data["publications"] =  bibtexParse.toJSON(publications[0])
		data["career"] = career[0];
		data["research"] = research[0];
		data["teaching"] = teaching[0];
		data["talks"] = talks[0];
		data["scicomm"] = scicomm[0];

		// preprocess bib entries
		preprocessBib(data["publications"])
		
		console.log(`All data loaded -> filling ${where}`);
		if (where === 'HTML') {
			fillHTML(containers, data);
		} else {
			fillLatex(containers, data);
		}


	}).fail(function (jqXHR, textStatus, errorThrown) {
		console.error('One or more requests failed:', {
			jqXHR: jqXHR,
			textStatus: textStatus,
			errorThrown: errorThrown
		});
	});
}


// other constants

const ONGOING_WORD = "since";
const FILE_ICON = '<i class="far fa-file"></i>'
const PDF_ICON = '<i class="far fa-save"></i>'

// Large-screen table of contents. Its entries are derived from the rendered
// JSON category headings so the navigation cannot drift out of sync with them.
var pageTocHeadings = [];
var pageTocScrollScheduled = false;
var pageTocPinnedHeadingId = null;
var PAGE_TOC_EXCLUDED_SECTIONS = ["about"];

function setupPageTableOfContents() {
	var activeHref = $("#main-nav a.active").attr("href") || "#about";
	renderPageTableOfContents(activeHref.substring(1));

	$(window).off("scroll.pageToc").on("scroll.pageToc", function() {
		if (pageTocScrollScheduled)
			return;

		pageTocScrollScheduled = true;
		window.requestAnimationFrame(function() {
			updatePageTableOfContents();
			pageTocScrollScheduled = false;
		});
	});

	$(window).off("wheel.pageToc touchstart.pageToc keydown.pageToc")
		.on("wheel.pageToc touchstart.pageToc keydown.pageToc", function() {
			pageTocPinnedHeadingId = null;
		});
}

function clearPageTableOfContents() {
	pageTocPinnedHeadingId = null;
	pageTocHeadings = [];
	$("#page-toc")
		.removeClass("is-visible")
		.attr("aria-hidden", "true")
		.find("ul").empty();
}

function resetPageScroll() {
	window.scrollTo(0, 0);
	$(".right-content").scrollTop(0);
}

function renderPageTableOfContents(sectionId) {
	var toc = $("#page-toc");
	var list = toc.find("ul");
	clearPageTableOfContents();

	if (PAGE_TOC_EXCLUDED_SECTIONS.indexOf(sectionId) !== -1)
		return;

	var targets = [];
	if (sectionId === "talks") {
		var activeFilter = document.body.dataset.activeFilter || "all";
		var usedYears = {};
		$("#talks .section[data-toc-year]").each(function() {
			var year = this.getAttribute("data-toc-year");
			var category = this.getAttribute("data-category");
			if ((activeFilter === "all" || category === activeFilter) && !usedYears[year]) {
				usedYears[year] = true;
				targets.push({ element: this, label: year });
			}
		});
	} else {
		$("#" + sectionId + " .sub-title h2").each(function() {
			targets.push({ element: this, label: $.trim($(this).text()) });
		});
	}

	var usedIds = {};
	$.each(targets, function(index, target) {
		var heading = target.element;
		var label = target.label;
		if (label === "")
			return;

		var baseId = "toc-" + sectionId + "-" + label.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "");
		var headingId = baseId || "toc-" + sectionId + "-section-" + (index + 1);
		var duplicateIndex = usedIds[headingId] || 0;
		usedIds[headingId] = duplicateIndex + 1;
		if (duplicateIndex > 0)
			headingId += "-" + (duplicateIndex + 1);

		heading.id = headingId;
		pageTocHeadings.push(heading);

		var link = $("<a></a>")
			.attr("href", "#" + headingId)
			.attr("data-heading-id", headingId)
			.text(label)
			.on("click", function(event) {
				event.preventDefault();
				pageTocPinnedHeadingId = headingId;
				setActivePageTableOfContentsLink(headingId);
				heading.scrollIntoView({ behavior: "smooth", block: "start" });
			});

		list.append($("<li></li>").append(link));
	});

	if (pageTocHeadings.length > 0) {
		toc.addClass("is-visible").attr("aria-hidden", "false");
		updatePageTableOfContents();
		window.setTimeout(updatePageTableOfContents, 150);
	}
}

function updatePageTableOfContents() {
	if (pageTocHeadings.length === 0)
		return;

	if (pageTocPinnedHeadingId !== null) {
		setActivePageTableOfContentsLink(pageTocPinnedHeadingId);
		return;
	}

	var activationLine = 100;
	var activeHeading = pageTocHeadings[0];
	var documentHeight = document.documentElement.scrollHeight;
	var isAtPageBottom = window.pageYOffset + window.innerHeight >= documentHeight - 2;

	if (isAtPageBottom) {
		activeHeading = pageTocHeadings[pageTocHeadings.length - 1];
	} else {
		pageTocHeadings.forEach(function(heading) {
			if (heading.getBoundingClientRect().top <= activationLine)
				activeHeading = heading;
		});
	}

	setActivePageTableOfContentsLink(activeHeading.id);
}

function setActivePageTableOfContentsLink(headingId) {
	var toc = $("#page-toc");
	toc.find("a").removeClass("active");
	toc.find('a[data-heading-id="' + headingId + '"]').addClass("active");
}

//$.ajaxSetup({ cache: false });


//    _____________   ____________  ___    __       ________  ___   ______________________  _   _______
//   / ____/ ____/ | / / ____/ __ \/   |  / /      / ____/ / / / | / / ____/_  __/  _/ __ \/ | / / ___/
//  / / __/ __/ /  |/ / __/ / /_/ / /| | / /      / /_  / / / /  |/ / /     / /  / // / / /  |/ /\__ \
// / /_/ / /___/ /|  / /___/ _, _/ ___ |/ /___   / __/ / /_/ / /|  / /___  / / _/ // /_/ / /|  /___/ /
// \____/_____/_/ |_/_____/_/ |_/_/  |_/_____/  /_/    \____/_/ |_/\____/ /_/ /___/\____/_/ |_//____/



/**
* Returns a trimmed BibTeX field, or an empty string when it is unavailable.
*/
function getBibField(entry, field) {
	return entry.hasOwnProperty(field) && entry[field] !== null
		? String(entry[field]).trim()
		: "";
}

/**
* Normalises both BibTeX month abbreviations and numeric month values.
*/
function formatBibMonth(month) {
	var months = {
		"1": "January", "01": "January", "jan": "January",
		"2": "February", "02": "February", "feb": "February",
		"3": "March", "03": "March", "mar": "March",
		"4": "April", "04": "April", "apr": "April",
		"5": "May", "05": "May", "may": "May",
		"6": "June", "06": "June", "jun": "June",
		"7": "July", "07": "July", "jul": "July",
		"8": "August", "08": "August", "aug": "August",
		"9": "September", "09": "September", "sep": "September",
		"10": "October", "oct": "October",
		"11": "November", "nov": "November",
		"12": "December", "dec": "December"
	};
	var key = month.toLowerCase();
	return months[key] || month;
}

/**
* Builds a compact publication description from an explicit field whitelist.
* Long or technical fields such as abstract, keywords and eprint are ignored.
*/
function buildBibDescription(type, entry) {
	var isArticle = type === "article";
	var venue = getBibField(entry, isArticle ? "journal" : "booktitle");
	var volume = getBibField(entry, "volume");
	var number = getBibField(entry, "number");
	var pages = getBibField(entry, "pages").replace(/(\d)\s*--?\s*(\d)/g, "$1–$2");
	var address = getBibField(entry, "address");
	var month = formatBibMonth(getBibField(entry, "month"));
	var year = getBibField(entry, "year");
	var note = getBibField(entry, "note");
	var doi = getBibField(entry, "doi")
		.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
		.replace(/^doi:\s*/i, "")
		.replace(/\\_/g, "_");
	var isToAppear = entry.hasOwnProperty("toappear") || /^to appear$/i.test(note);
	var parts = [];

	if (isToAppear) {
		if (venue)
			parts.push("To appear in " + venue);
		if (year)
			parts.push(year);
	} else if (isArticle) {
		if (venue)
			parts.push(venue);
		if (volume && volume !== "0")
			parts.push("vol. " + volume);
		if (number && number !== "0")
			parts.push("no. " + number);
		if (pages)
			parts.push(/[-–]/.test(pages) ? "pp. " + pages : pages);
		if (month || year)
			parts.push([month, year].filter(Boolean).join(" "));
	} else {
		if (venue)
			parts.push(/^in\b/i.test(venue) ? venue : "In " + venue);
		if (address)
			parts.push(address);
		if (month || year)
			parts.push([month, year].filter(Boolean).join(" "));
		if (pages)
			parts.push(/[-–]/.test(pages) ? "pp. " + pages : pages);
	}

	var descr = parts.join(", ");
	if (descr)
		descr += ".";
	if (doi)
		descr += (descr ? " " : "") + "DOI: " + doi + ".";

	return descr;
}
