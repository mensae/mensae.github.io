// smart path building 
const REPO = "https://raw.githubusercontent.com/mensae/mensae.github.io/main/"; 
const BPATH = location.hostname.endsWith("github.io")?  REPO+"_cv_data/": "_cv_data/";

function getDataAndFill(where, containers) {

	$.when(
		$.get(BPATH+'0_publications.bib'),
		$.getJSON(BPATH+'1_experiences.json'),
		$.getJSON(BPATH+'2_research.json'),
		$.getJSON(BPATH+'3_teaching.json'),
		$.getJSON(BPATH+'4_talks.json'),
		$.getJSON(BPATH+'5_scicom.json')

	).done(function (publications, experiences, research, teaching, talks, scicomm) {
		data = {}; 

		data["publications"] =  bibtexParse.toJSON(publications[0])
		data["experiences"] = experiences[0];
		data["research"] = research[0];
		data["teaching"] = teaching[0];
		data["talks"] = talks[0];
		data["scicom"] = scicomm[0];

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

const ONGOING_WORD = "ongoing";
const FILE_ICON = '<i class="far fa-file"></i>'
const PDF_ICON = '<i class="far fa-save"></i>'

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


