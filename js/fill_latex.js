//     _______  __ ____  ____  ____  ______   _____   __   __    ___  _____________  __
//    / ____/ |/ // __ \/ __ \/ __ \/_  __/  /  _/ | / /  / /   /   |/_  __/ ____/ |/ /
//   / __/  |   // /_/ / / / / /_/ / / /     / //  |/ /  / /   / /| | / / / __/  |   /
//  / /___ /   |/ ____/ /_/ / _, _/ / /    _/ // /|  /  / /___/ ___ |/ / / /___ /   |
// /_____//_/|_/_/    \____/_/ |_| /_/    /___/_/ |_/  /_____/_/  |_|_/ /_____//_/|_|
//
// Same job as fill_html.js, and same shape: getDataAndFill() in general.js loads
// the files and hands over the data, this fills one container per category.
// Only the output changes -- LaTeX macros instead of markup:
//
//   \edu{title}{subtitle}{date}{score}{specialisation}{thesis}{themes}
//   \pub{title line 1}{title line 2}{year}{authors}{reference}
//   \entry{title line 1}{title line 2}{subtitle}{date}{url}{description}
//   \minientry{title line 1}{title line 2}{date}
//
// all defined in latex/resume.cls. Long titles have to be split over two
// lines here, since those macros take the two lines as separate arguments.


/**
 * For each container, gets the corresponding category and fills it with LaTeX.
 * Containers only need a `selector` and an `html()` method, so both jQuery
 * objects and the plain stubs used by latex.html work.
 * @param {*} containers
 */
function fillLatex(containers, data) {
	containers.forEach(function(container) {

		var cat_name = container["selector"].replace("#","").replace("-container","");

		if (cat_name == "publications") {
			fillPublications(container, data["publications"]);
		} else {
			if (data.hasOwnProperty(cat_name)) {
				fillAnyCategory(container, data[cat_name]);
			} else {
				console.error("No data for container:", cat_name);
			}
		}
	});

}


/**
* Fills a category: one headSection per subcategory, then its entries.
*/
function fillAnyCategory(container, cat_data) {
	var content = "";

	Object.entries(cat_data).forEach(([subcat_name, subcat_data]) => {

		if (subcat_data.length > 0) { //check if there is something in the category

			var title = subcat_name.replace(/(^\w|\s\w)/g, m => m.toUpperCase());
			content += '\n\n\\begin{headSection}{'+escapeForLatex(title)+'}{10}\n\n';

			// each element in the subcategory
			subcat_data.forEach(elem => {

				//in common stuff
				var date = formatDate(elem.date);

				//subcategory specific stuff
				switch (subcat_name.toLowerCase()) {
					case "education":
						content += buildEducationElem(elem, date);
						break;
					case "contributions":
						content += buildScicomElem(elem);
						break;
					default: // default rendering for all remaining subcategories
						content += elem.hasOwnProperty('subtitle')?
							buildEntryElem(elem, date):
							buildMiniEntryElem(elem, date);
				}

			}); // each element

			content += '\\end{headSection}\n\n';

		} //if subcat has data
	}); //each subcategory

	container.html(content);
}


/**
* Builds a standard entry: title, subtitle, date, link and description.
* The blank line at the end is not cosmetic, in LaTeX it is a \par.
*/
function buildEntryElem(elem, date) {
	var content = "";

	content += '\\entry{'+newLineForLatexBold(innerURLsToLatex(elem.title), date)+'}';
	content += '{'+innerURLsToLatex(elem.subtitle)+'}';
	content += '{'+date+'}';
	content += '{'+escapeForLatex(elem.url)+'}';
	content += '{'+innerURLsToLatex(elem.description)+'}';
	content += "\n\n";

	return content;
}


/**
* Builds a one liner: just title and date.
*/
function buildMiniEntryElem(elem, date) {
	var content = "";

	content += '\\minientry{'+newLineForLatexNonBold(innerURLsToLatex(elem.title), date)+'}';
	content += '{'+date+'}';
	content += "\n";

	return content;
}


/**
* Builds an education block
*/
function buildEducationElem(elem, date) {
	var content = "";

	content += '\\edu{'+innerURLsToLatex(elem.title)+'}';
	content += '{'+innerURLsToLatex(elem.subtitle)+'}';
	content += '{'+date+'}';
	content += '{'+escapeForLatex(elem.score)+'}';
	content += '{'+escapeForLatex(elem.specialization)+'}';
	content += '{'+escapeForLatex(elem.thesis)+'}';
	content += '{'+escapeForLatex(elem.themes)+'}';
	content += "\n\n";

	return content;
}


/**
* Builds a scicom block: same as an entry, but the views take the place of the date.
*/
function buildScicomElem(elem) {
	var content = "";

	content += '\\entry{'+newLineForLatexBold(innerURLsToLatex(elem.title), elem.views)+'}';
	content += '{'+innerURLsToLatex(elem.subtitle)+'}';
	content += '{'+elem.views+'}';
	content += '{'+escapeForLatex(elem.url)+'}';
	content += '{'+innerURLsToLatex(elem.description)+'}';
	content += "\n\n";

	return content;
}


/**
* Fills the LaTeX container with the publications
*/
function fillPublications(container, json) {
	var content = "";
	for(i in json) {
		var entry = json[i].entryTags;
		content += '\\pub{'+newLineForLatexBold(escapeForLatex(entry.title), entry.year)+'}';
		content += '{'+entry.year+'}';
		content += '{'+escapeForLatex(entry.author)+'}';
		content += '{'+escapeForLatex(buildBibDescription(json[i].entryType.toLowerCase(), entry))+'}';
		content += "\n\n";
	}
	container.html(content);

}


/************  HELPER FUNCTIONS **************/


/**
* Puts the "ongoing" marker of a date in italics, without touching the data.
*/
function formatDate(date) {
	date = date || "";
	return date.includes(ONGOING_WORD)?
		date.replace(ONGOING_WORD, "\\textit{"+ONGOING_WORD+"}"):
		date;
}


var HREF_REGEX = /\\href\{((?:[^{}]|\{[^{}]*\})*)\}\{((?:[^{}]|\{[^{}]*\})*)\}/g;

/**
* Splits a string into the text one actually sees printed, plus a map telling
* where each visible character sits in the original LaTeX. Used to measure a
* title ignoring the link markup around it.
*/
function visibleText(latex) {
	var visible = "";
	var positions = [];
	var links = [];
	var cursor = 0;
	var match;

	HREF_REGEX.lastIndex = 0;
	while ((match = HREF_REGEX.exec(latex)) !== null) {
		var text_start = match.index + "\\href{".length + match[1].length + "}{".length;

		for (var i = cursor; i < match.index; i++) {
			visible += latex.charAt(i);
			positions.push(i);
		}
		for (var j = 0; j < match[2].length; j++) {
			visible += match[2].charAt(j);
			positions.push(text_start + j);
		}

		links.push({url: match[1], from: text_start, to: text_start + match[2].length});
		cursor = match.index + match[0].length;
	}

	for (var k = cursor; k < latex.length; k++) {
		visible += latex.charAt(k);
		positions.push(k);
	}

	return {visible: visible, positions: positions, links: links};
}


/**
* Returns "line one}{line two": the two title arguments, already separated.
* The cut goes on the last space that fits in `threshold` *visible* characters.
*
* When the cut falls inside an \href the link gets closed and reopened, so both
* lines stay clickable: splitting it as is would produce
* \href{url}{line one}{line two}, that is a macro with one argument too many
* ("There's no line here to end") and a garbled entry in the PDF.
*/
function newLineForLatex(str, threshold) {
	var parsed = visibleText(str);

	if(parsed.visible.length < threshold) return str+"}{";

	var stop = parsed.visible.lastIndexOf(" ", threshold);
	if(stop <= 0) stop = parsed.visible.indexOf(" ", threshold);
	if(stop <= 0) return str+"}{"; // a single long word: nothing to split

	var cut = parsed.positions[stop];
	var link = parsed.links.filter(l => cut >= l.from && cut < l.to)[0];

	if(!link) return str.slice(0, cut) + "}{" + str.slice(cut+1);

	return str.slice(0, cut) + "}}{\\href{" + link.url + "}{" + str.slice(cut+1);
}


function newLineForLatexNonBold(str, side_str) {
	var max_total = 89;
	var threshold = max_total - String(side_str).length - 1; //compute dynamically depending on the side string
	return newLineForLatex(str, threshold)
}

function newLineForLatexBold(str, side_str) {
	var max_total = 78;
	var threshold = max_total - String(side_str).length - 1; //compute dynamically depending on the side string
	return newLineForLatex(str, threshold)
}

/**
* Replaces the inner URLS of the description into LaTex urls.
**/
function innerURLsToLatex(str) {
	str = escapeForLatex(str);
	str = str.replace(/<us{/g, "\\href{");
	str = str.replace(/}um{/g, "}{");
	str = str.replace(/}ue>/g, "}");
	return str;
}

/**
* Neutralises the characters LaTeX would read as commands. Braces and
* backslashes are left alone on purpose: the link syntax of the JSON files
* (<us{...}um{...}ue>) needs them. The tilde is only escaped when followed by a
* space, so that URLs (.../~mensa/) survive.
*/
function escapeForLatex(str) {
	if(str === undefined || str === null) return "";
	str = String(str);
	str = str.replace(/&/g,"\\&");
	str = str.replace(/%/g,"\\%");
	str = str.replace(/#/g,"\\#");
	str = str.replace(/\$/g,"\\$");
	str = str.replace(/_/g,"\\_");
	str = str.replace(/\^/g,"\\textasciicircum{}");
	str = str.replace(/~ /g,"\\textasciitilde{} ");
	return str;
}
