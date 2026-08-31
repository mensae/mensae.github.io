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
* Builds the description of the publications depeding on the entry type.
*/
function buildBibDescription(type, entry) {
	var descr = "";
	var address = entry.hasOwnProperty("address") && entry.address !== "";
	var month = entry.hasOwnProperty("month") && entry.month !== "";
	var year = entry.hasOwnProperty("year") && entry.year !== "";

	var number = entry.hasOwnProperty("number") && entry.number !== ""? ", number "+entry.number: "";
	var pages = entry.hasOwnProperty("pages") && entry.pages !== ""? " (pp. "+entry.pages+")": "";


	if(entry.hasOwnProperty("toappear")) {
		var where = (type === "article"? entry.journal:entry.booktitle);
		descr += "To appear in "+where;

	} else {
		
		var where = ""
		if (type === "article") {
			where = entry.journal
			//console.log(entry.journal, entry.volume)
			if (entry.volume) {
				where += ", volume "+entry.volume+ number + pages
			}
		} else {
			where = entry.booktitle
		}
		
		if (!where.startsWith("In")) {
			where = "In "+where
		}

		var descr = where+".";
		if(address) 
			descr += " "+entry.address;
		if(month) 
			descr += (address? ", ":" ")+entry.month;
		if(year) 
			descr += ((address||month)? ", ":" ")+entry.year;
	}
	return descr;
}
