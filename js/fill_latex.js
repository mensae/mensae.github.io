
//     _______  __ ____  ____  ____  ______   _____   __   __    ___  _____________  __
//    / ____/ |/ // __ \/ __ \/ __ \/_  __/  /  _/ | / /  / /   /   |/_  __/ ____/ |/ /
//   / __/  |   // /_/ / / / / /_/ / / /     / //  |/ /  / /   / /| | / / / __/  |   /
//  / /___ /   |/ ____/ /_/ / _, _/ / /    _/ // /|  /  / /___/ ___ |/ / / /___ /   |
// /_____//_/|_/_/    \____/_/ |_| /_/    /___/_/ |_/  /_____/_/  |_/_/ /_____//_/|_|


/**
* Fills the Latex container with the publications
*/
function fillLatexPublications(container) {
    $.get(PUBLICATIONS, function (data) {
        json = bibtexParse.toJSON(data);

        preprocessBib(json);

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

    });
}

/**
* Fills the Latex container with education
*/
function fillLatexEducation(container) {
    $.get(EDUCATION_JSON, function (json) {
        var content = "";
        for(i in json) {
            var entry = json[i];
            content += '\\edu{'+entry.title+'}';
            content += '{'+entry.subtitle+'}';   
            content += '{'+entry.date+'}';            
            content += '{'+entry.score+'}';
            content += '{'+escapeForLatex(entry.specialization)+'}';
            content += '{'+escapeForLatex(entry.thesis)+'}';
            content += '{'+escapeForLatex(entry.themes)+'}';
            content += "\n\n";
        }
        $(container).html(content);

    });
}

/**
* Fills the Latex container with edutaiment
*/
function fillLatexScientificCommunication(container) {

        $.getJSON(SCIENTIFIC_COMMUNICATION_JSON, function(json) {
            var content = "";
            for(cat_name in json) {

                if(json[cat_name].length > 0) { //check if there is something in the category

                    capitalized_cat_name = cat_name.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

                    content += '\n\n\\begin{headSection}{'+escapeForLatex(capitalized_cat_name)+'}{10}\n\n';

                    for(i in json[cat_name]) {

                        var entry = json[cat_name][i];

                        content += '\\entry{'+newLineForLatexBold(entry.title, entry.views)+'}';
                        content += '{'+entry.subtitle+'}';            
                        content += '{'+entry.views+'}';
                        content += '{'+escapeForLatex(entry.url)+'}';
                        content += entry.hasOwnProperty('description')?'{'+innerURLsToLatex(entry.description)+'}':'{}';
                        content += "\n\n";  
                        
                    }

                    content += '\\end{headSection}\n\n';            
                }
            }

            $(container).html(content);
    });
}




/**
* Fills the Latex container with the two liners
*/
function fillLatex(container, json) {
    var json_file = "";
    switch(container.attr("id")) {
        case "scholarships-container": json_file = SCHOLARSHIPS_JSON; break;
        case "research-container": json_file = RESEARCH_JSON; break;
        case "talks-container": json_file = TALKS_JSON; break;
        case "teaching-container": json_file = TEACHING_JSON; break;
    }

    $.getJSON(json_file, function(json) {


        var content = "";
        for(cat_name in json) {

            if(cat_name === "education") continue; //little exception: we skip edu in latex

            if(json[cat_name].length > 0) { //check if there is something in the category

                capitalized_cat_name = cat_name.replace(/(^\w|\s\w)/g, m => m.toUpperCase());

                content += '\n\n\\begin{headSection}{'+escapeForLatex(capitalized_cat_name)+'}{10}\n\n';

                for(i in json[cat_name]) {

                    var entry = json[cat_name][i];

                    //ongoing stuff
                    if (entry.hasOwnProperty('date') && entry.date.includes(ONGOING_WORD))  {
                        entry.date = entry.date.replace(ONGOING_WORD, "\\textit{"+ONGOING_WORD+"}");
                    }

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

                content += '\\end{headSection}\n\n';            
            }
        }

        $(container).html(content);
    });
}

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
