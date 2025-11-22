//     _______  __ ____  ____  ____  ______   _____   __   __  __________  _____
//    / ____/ |/ // __ \/ __ \/ __ \/_  __/  /  _/ | / /  / / / /_  __/  |/  / /
//   / __/  |   // /_/ / / / / /_/ / / /     / //  |/ /  / /_/ / / / / /|_/ / /
//  / /___ /   |/ ____/ /_/ / _, _/ / /    _/ // /|  /  / __  / / / / /  / / /___
// /_____//_/|_/_/    \____/_/ |_| /_/    /___/_/ |_/  /_/ /_/ /_/ /_/  /_/_____/


/**
 * For each container, gets the corresponding file and fills the HTML according to the data
 * @param {*} containers 
 */
function fillHTML(containers, data) {
	containers.forEach(function(container) {

		var cat_name = container["selector"].replace("#","").replace("-container","");

		//console.log(`CATEGORY: ${cat_name}`)

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
Fills a category
*/
function fillAnyCategory(container, cat_data) {
	var content = "";

	Object.entries(cat_data).forEach(([subcat_name, subcat_data]) => {

		if (subcat_data.length > 0) { //check if there is something in the category

			// sub category title
			content += '<div class="block-content mb-80">'
			content += '<div class="row">'
			content += '<div class="col-md-12">'
			content += '<div class="sub-title mb-40">'
			content += '<h2 class="uppercase">' + subcat_name + '</h2>'
			content += '</div></div></div>'
			content += '<div class="row"><div class="col-md-12  col-sm-12 left-align">';


			// each element in the subcategory
			subcat_data.forEach(elem => {

				//in common stuff
				var labelongoing = "";
				if (elem.hasOwnProperty('date') && elem.date.includes(ONGOING_WORD)) {
					labelongoing = 'label-ongoing';
					elem.date = elem.date.replace(ONGOING_WORD, "<span class='italics'>" + ONGOING_WORD + "</span>");
				}

				var url = (!elem.hasOwnProperty('url') || elem.url === "") ? "" : '<span class="label-url"><a href="' + elem.url + '">' + FILE_ICON + '</a></span>';
				var date = (!elem.hasOwnProperty('date') || elem.date === "") ? "" : '<span class="label-date ' + labelongoing + '">' + elem.date + '</span>'

				//subcategory specific stuff
				switch (subcat_name.toLowerCase()) {
					case "invited speaker": 
						content += buildSpeakerElem(elem, url, date);
						break;
					case "education":
						content += buildEducationElem(elem);
						break;
					case "contributions":
						content += buildScicomElem(elem);
						break;
					default: // default rendering for all remaining subcategories
						content += '<div class="section">';
						content += '<div class="title-container">';
						content += '<div class="title">' + innerURLsToHTML(elem.title) + '</div>';
						content += '<span class="r-label-container">' + url + date + '</span>'
						content += "</div>"
						if (elem.hasOwnProperty('subtitle'))
							content += '<div class="subtitle">' + elem.subtitle + '</div>';
						if (elem.hasOwnProperty('description'))
							content += '<div class="description">' + innerURLsToHTML(elem.description) + '</div>';
						content += '</div>'
				}

			}); // each element
			
			content += '</div></div></div>';

		} //if subcat has data
	}); //each subcategory

	$(container).html(content);

}

/**
Builds an education block
*/
function buildEducationElem(elem) {
	var content = "";

	var date = (!elem.hasOwnProperty('date') || elem.date === "") ? "" : '<span class="label-date">' + elem.date + '</span>'
	content += '<div class="section">';
	content += '<div class="title-container">';
	content += '<div class="title">' + elem.title + '</div>';
	content += '<span class="r-label-container">' + date + '</span>'
	content += "</div>"
	content += '<div class="subtitle">' + elem.subtitle + '</div>';
	content += '<div class="description">'
	if (elem.hasOwnProperty('score') && elem.score !== "")
		content += "<em>" + elem.score + "</em><br>";
	if (elem.hasOwnProperty('specialization') && elem.specialization !== "")
		content += "<strong class='edu-strong'>Specialization</strong>: " + elem.specialization + "<br>";
	if (elem.hasOwnProperty('thesis') && elem.thesis !== "")
		content += "<strong  class='edu-strong'>Thesis</strong>: \"" + elem.thesis + "\"<br>";
	if (elem.hasOwnProperty('themes') && elem.themes !== "")
		content += "<strong class='edu-strong'>Themes</strong>: " + elem.themes;
	if (elem.hasOwnProperty('url') && elem.url !== "")
		content += '<br><a href="' + elem.url + '"><button class="btn btn-sm btn-dark" style="margin-top:10px">Download Thesis</button></a>'

	content += '</div></div>'
		
	return content;
}


/**
Fills the HTML for edutainment
*/
function buildScicomElem(elem) {
	var content = "";

	//parse platform
	var icon = ""
	switch (elem.platform.toLowerCase()) {
		case "youtube": icon = '<i class="fab fa-youtube" style="color:red" ></i>&nbsp;'; break;
		case "twitch": icon = '<i class="fab fa-twitch"></i>&nbsp;'; break;
		case "blog": icon = '<i class="far fa-file-alt style="color:#777"></i>&nbsp;'; break;
		default: icon = '<i class="fas fa-video"></i>&nbsp;'; break;
	}

	content += '<div class="section">'
	content += '<div class="title-container">';
	content += '<div class="title"><a style="text-decoration: none !important;" href="' + elem.url + '">' + icon + elem.title + '</a></div>';
	if (elem.hasOwnProperty('views') && elem.views != "")
		content += '<span class="r-label-container"><span class="label-date">' + elem.views + '</span></span>'
	content += "</div>"
	if (elem.hasOwnProperty('subtitle'))
		content += '<div class="subtitle">' + elem.subtitle + '</div>';
	if (elem.hasOwnProperty('description'))
		content += '<div class="description">' + innerURLsToHTML(elem.description) + '</div>';
	content += '</div>'
	

	return content;

}

/**
Fills the HTML for edutainment
*/
function buildSpeakerElem(elem, url, date) {
	content = "";

	content += '<div class="section">';
	content += '<div class="title-container">';
	content += '<div class="title">' + innerURLsToHTML(elem.title) + '</div>';
	content += '<span class="r-label-container">' + url + date + '</span>'
	content += "</div>"


	//the title is the type
	labeltype = "";
	switch (elem.subtitle.toLowerCase()) {
		case "public event":
			labeltype = "label-event-pe";
			break;
		case "seminar in public event":
			labeltype = "label-event-spe";
			break;
		case "course seminar":
			labeltype = "label-event-cs"
			break;
		case "academic seminar":
			labeltype = "label-event-as"
			break;
		case "recorded event":
			labeltype = "label-event-re"
			break;
	}

	var subt = '<span class="label-event-type ' + labeltype + '">' + elem.subtitle + '</span>'
	content += '<div class="subtitle">' + subt + '</div>';

	if (elem.hasOwnProperty('description'))
		content += '<div class="description">' + innerURLsToHTML(elem.description) + '</div>';
	
	content += '</div>'

	return content;

}



/**
* Fills the HTML container with the publications
*/
function fillPublications(container, json) {
		json_by_year = {}
		years = []

		//index bib by year
		for (i in json) {
			var year = json[i].entryTags.year.toString();
			years.push(year)

			if (json_by_year.hasOwnProperty(year))
				json_by_year[year].push(json[i])
			else
				json_by_year[year] = [json[i]]
		}


		years = [...new Set(years)] //remove duplicate


		var content = "";
		for (i in years) {
			year = years[i]

			content += '<div class="block-content mb-80">'
			content += '<div class="row">'
			content += '<div class="col-md-12">'
			content += '<div class="sub-title mb-40">'
			content += '<h2 class="uppercase">' + year + '</h2>'
			content += '</div></div></div>'
			content += '<div class="row"><div class="col-md-12  col-sm-12 left-align">';


			for (i in json_by_year[year]) {
				var entry = json_by_year[year][i].entryTags;
				var entry_type = json_by_year[year][i].entryType;

				var url = (!entry.hasOwnProperty('url') || entry.url === "") ? "" : '<span class="label-url label-info"><a href="' + entry.url + '">PDF</a></span>';
				var label = entry_type === "inproceedings" ? '<span class="label-conference">C</span>' : entry_type === "article" ? '<span class="label-journal">J</span>' : "";
				var label = (entry.hasOwnProperty('note') && entry.note.toLowerCase() == "correspondence") ? '<span class="label-correspondence">L</span>' : label; //could be correspondence

				content += '<div class="section">'
				content += '<div class="title-container">';
				content += '<div class="title">' + entry.title + '</div>';
				content += '<span class="r-label-container">' + label + url + '</span>'
				content += "</div>"
				content += '<div class="subtitle">' + entry.author + '</div>';
				content += '<div class="description">' + buildBibDescription(entry_type.toLowerCase(), entry) + '</div>';
				content += '</div>'
			}
			content += '</div></div></div>';
		}

		$(container).html(content);

}



/**
* Replaces the inner URLS of the description into HTML urls.
**/
function innerURLsToHTML(str) {
	str = str.replace(/<us{/g, "<a href=\"");
	str = str.replace(/}um{/g, "\">");
	str = str.replace(/}ue>/g, "</a>");
	return str;
}

