
//     _______  __ ____  ____  ____  ______   _____   __   __    ___  _____________  __
//    / ____/ |/ // __ \/ __ \/ __ \/_  __/  /  _/ | / /  / /   /   |/_  __/ ____/ |/ /
//   / __/  |   // /_/ / / / / /_/ / / /     / //  |/ /  / /   / /| | / / / __/  |   /
//  / /___ /   |/ ____/ /_/ / _, _/ / /    _/ // /|  /  / /___/ ___ |/ / / /___ /   |
// /_____//_/|_/_/    \____/_/ |_| /_/    /___/_/ |_/  /_____/_/  |_/_/ /_____//_/|_|


/**
 * For each container, gets the corresponding file and fills the LaTeX according to the data
 * @param {*} containers 
 */
function fillLatex(containers, data) {
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
* Fills the Latex container with the two liners
*/
function fillAnyCategory(container, cat_data) {
	var content = "";

	Object.entries(cat_data).forEach(([subcat_name, subcat_data]) => {

		capitalized_cat_name = subcat_name.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

		content += '\n\n\\begin{headSection}{'+escapeForLatex(capitalized_cat_name)+'}{10}\n\n';

		subcat_data.forEach(entry => {

			//in common stuff
			if (entry.hasOwnProperty('date') && entry.date.includes(ONGOING_WORD))  {
				entry.date = entry.date.replace(ONGOING_WORD, "\\textit{"+ONGOING_WORD+"}");
			}


			//subcategory specific stuff
			switch (subcat_name.toLowerCase()) {
				case "education":
					content += buildEducationElem(entry);
					break;
				case "contributions":
					content += buildScicomElem(entry);
					break;
				default: // default rendering for all remaining subcategories
					if(entry.hasOwnProperty('subtitle')) {
						content += '\\entry{'+newLineForLatexBold(innerURLsToLatex(entry.title), entry.date)+'}';
						content += '{'+innerURLsToLatex(entry.subtitle)+'}';            
						content += '{'+entry.date+'}';
						content += entry.hasOwnProperty('url')?'{'+escapeForLatex(entry.url)+'}':'{}';
						content += entry.hasOwnProperty('description')?'{'+innerURLsToLatex(entry.description)+'}':'{}';
						content += "\n\n";  
					} else {
						content += '\\minientry{'+newLineForLatexNonBold(innerURLsToLatex(entry.title), entry.date)+'}';
						content += '{'+entry.date+'}';
						content += "\n";   

					} 
			}



				

		}); // each element in subcategory

		content += '\\end{headSection}\n\n';            
		
		}); // each subcategory
	
		$(container).html(content);
}



/**
* Builds an education block
*/
function buildEducationElem(entry) {
	var content = "";

	content += '\\edu{'+entry.title+'}';
	content += '{'+entry.subtitle+'}';   
	content += '{'+entry.date+'}';            
	content += '{'+entry.score+'}';
	content += '{'+escapeForLatex(entry.specialization)+'}';
	content += '{'+escapeForLatex(entry.thesis)+'}';
	content += '{'+escapeForLatex(entry.themes)+'}';
	content += "\n\n";
						
	return content;
}

/**
* Builds a scicom block
*/
function buildScicomElem(entry) {
	var content = "";

	content += '\\entry{'+newLineForLatexBold(entry.title, entry.views)+'}';
	content += '{'+entry.subtitle+'}';            
	content += '{'+entry.views+'}';
	content += '{'+escapeForLatex(entry.url)+'}';
	content += entry.hasOwnProperty('description')?'{'+innerURLsToLatex(entry.description)+'}':'{}';
	content += "\n\n";  
						
	return content;
}



/**
* Fills the Latex container with the publications
*/
function fillPublications(container, json) {
	var content = "";
	for(i in json) {
		var entry = json[i].entryTags;
		content += '\\pub{'+newLineForLatexBold(entry.title, entry.year)+'}';
		content += '{'+entry.year+'}';            
		content += '{'+escapeForLatex(entry.author)+'}';
		content += '{'+escapeForLatex(buildBibDescription(json[i].entryType.toLowerCase(), entry))+'}';
		content += "\n\n";
	}
	$(container).html(content);

}


/************  HELPER FUNCTIONS **************/


function newLineForLatex(str, threshold) {
	// smart way to deal with hrefs: the threshold must be increased
	// to ignore the first part of the hrefs
	if(str.includes("\href")){
		var regex = /\\href{.*?}/g; //match it
		var found = str.match(regex);
		var lengths = 0;
		for (var i = 0; i < found.length; i++) {
			lengths += found[i].length
		}
		threshold += lengths
	}
	
	if(str.length < threshold) return str+"}{";
	else {
		var c = str.charAt(threshold);
		var new_str = "";
		while(c !== " ") {
			c = str.charAt(--threshold);
		}

		var result = [str.slice(0, threshold), "}{", str.slice(threshold+1)].join('');
		return result;

	}
}


function newLineForLatexNonBold(str, side_str) {
	var max_total = 89;
	var threshold = max_total - side_str.length - 1; //compute dynamically depending on the side string
	return newLineForLatex(str, threshold)
}

function newLineForLatexBold(str, side_str) {
	var max_total = 78;
	var threshold = max_total - side_str.length - 1; //compute dynamically depending on the side string
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

function escapeForLatex(str) {
	str = str.replace(/&/g,"\\&");
	str = str.replace(/%/g,"\\%");
	str = str.replace(/_/g,"\\_");    
	str = str.replace(/\^/g,"\\textasciicircum");
	str = str.replace(/~ /g,"\\textasciitilde ");
	return str;
}
