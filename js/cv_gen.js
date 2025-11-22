//$.ajaxSetup({ cache: false });
var EDUCATION_JSON = "_cv_data/1_education.json";
var SCHOLARSHIPS_JSON = "_cv_data/1_scholarships.json";

var PUBLICATIONS = "_cv_data/2_publications.bib";
var RESEARCH_JSON = "_cv_data/2_research.json";
var SCIENTIFIC_COMMUNICATION_JSON = "_cv_data/2_scientific_communication.json";

var TALKS_JSON = "_cv_data/5_talks.json";
var TEACHING_JSON = "_cv_data/3_teaching.json";
var EXTRA_JSON = "_cv_data/4_extra.json";


var ONGOING_WORD = "ongoing";
var FILE_ICON = '<i class="far fa-file"></i>'
var PDF_ICON = '<i class="far fa-save"></i>'

//    _____________   ____________  ___    __       ________  ___   ______________________  _   _______
//   / ____/ ____/ | / / ____/ __ \/   |  / /      / ____/ / / / | / / ____/_  __/  _/ __ \/ | / / ___/
//  / / __/ __/ /  |/ / __/ / /_/ / /| | / /      / /_  / / / /  |/ / /     / /  / // / / /  |/ /\__ \
// / /_/ / /___/ /|  / /___/ _, _/ ___ |/ /___   / __/ / /_/ / /|  / /___  / / _/ // /_/ / /|  /___/ /
// \____/_____/_/ |_/_____/_/ |_/_/  |_/_____/  /_/    \____/_/ |_/\____/ /_/ /___/\____/_/ |_//____/


/**
* Preprocesses the bib json by fixing authors, title, booktitle and journal. Extra {} chars, double spaces and new lines are removed everywhere,
* while authors are parsed and replaced with a common form.
*
* Two types of authors are treated: 
* -  Colla, Davide and Mensa, Enrico and Radicioni, Daniele P
* -  Enrico Mensa and Davide Colla and Marco Dalmasso and Marco Giustini and Carlo Mamo and Alessio Pitidis and Daniele Paolo Radicioni
* New lines and tabs are treated. 
*/ 
function preprocessBib(json)  {
    for(i in json) {
        json[i].entryTags = keysToLowerCase(json[i].entryTags);
        var entry = json[i].entryTags;
        
        //--- authors ---
        entry.author = entry.author.replace(/\s\s+/g, ' ')

        var authors = entry.author.split(" and ");


        for (var j = 0; j < authors.length; j++) {
            var a = authors[j].trim();
            var name = "";
            var surname = "";

            if (a.includes(",")) { //ie Radicioni, Daniele Paolo
                var split_a = a.split(", ");
                surname = split_a[0];
                var split_names = split_a[1].split(" ");
                for(var k = 0; k < split_names.length; k++) {
                    split_names[k] = split_names[k].charAt(0)+".";
                }
                name = split_names.join(" ");

            } else { // Daniele Paolo Radicioni
                var split_a = a.split(" ");
                surname = split_a.pop(); //pop surname
                split_names = split_a //only names
                for(var k = 0; k < split_names.length; k++) { //all the names
                    split_names[k] = split_names[k].charAt(0)+".";
                }
                name = split_names.join(" ");
            }
            authors[j] = name + " " + surname;
        } 

        entry.author = authors.join(", ");

        //---- title ----
        entry.title = entry.title.replace(/{|}/g, "");
        entry.title = entry.title.replace(/\s\s+/g, ' ');


        // other entries 
        if(entry.booktitle !== undefined)  {
            entry.booktitle = entry.booktitle.replace(/{|}/g, "");        
            entry.booktitle = entry.booktitle.replace(/\s\s+/g, ' ')
        }
        if(entry.journal !== undefined)  {
            entry.journal = entry.journal.replace(/{|}/g, "");        
            entry.journal = entry.journal.replace(/\s\s+/g, ' ')
        }        
    }

}

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
            console.log(entry.journal, entry.volume)
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


/**
* Turns the keys of an onbject all in lower case 
**/
function keysToLowerCase(obj) {
    if (!typeof(obj) === "object" || typeof(obj) === "string" || typeof(obj) === "number" || typeof(obj) === "boolean") {
        return obj;
    }
    if(obj instanceof Array) {
        for (var i in obj) {
            obj[i] = keysToLowerCase(obj[i]);
        }
        return obj;
    }
    var keys = Object.keys(obj);
    var n = keys.length;
    var lowKey;
    while (n--) {
        var key = keys[n];
        if (key === (lowKey = key.toLowerCase()))
            continue;
        obj[lowKey] = keysToLowerCase(obj[key]);
        delete obj[key];
    }
    return (obj);
}



//     _______  __ ____  ____  ____  ______   _____   __   __  __________  _____
//    / ____/ |/ // __ \/ __ \/ __ \/_  __/  /  _/ | / /  / / / /_  __/  |/  / /
//   / __/  |   // /_/ / / / / /_/ / / /     / //  |/ /  / /_/ / / / / /|_/ / /
//  / /___ /   |/ ____/ /_/ / _, _/ / /    _/ // /|  /  / __  / / / / /  / / /___
// /_____//_/|_/_/    \____/_/ |_| /_/    /___/_/ |_/  /_/ /_/ /_/ /_/  /_/_____/


/**
* Replaces the inner URLS of the description into HTML urls.
**/
function innerURLsToHTML(str) {
	str = str.replace(/<us{/g, "<a href=\"");
	str = str.replace(/}um{/g, "\">");
	str = str.replace(/}ue>/g, "</a>");
	return str;
}

/**
Fills the HTML for everything besides edu and pubs
*/
function fillHTML(container) {
    var json_file = "";
    switch(container.attr("id")) {
        case "scholarships-container": json_file = SCHOLARSHIPS_JSON; break;
        case "research-container": json_file = RESEARCH_JSON; break;
        case "teaching-container": json_file = TEACHING_JSON; break;
        case "talks-container": json_file = TALKS_JSON; break;
        case "extra-container": json_file = EXTRA_JSON; break;
    }

    $.getJSON(json_file, function(json) {


        var content = "";
        for(cat_name in json) {

            if(json[cat_name].length > 0) { //check if there is something in the category

                content += '<div class="block-content mb-80">'
                content += '<div class="row">'
                content += '<div class="col-md-12">'
                content += '<div class="sub-title mb-40">'
                content += '<h2 class="uppercase">'+cat_name+'</h2>'
                content += '</div></div></div>'
                content += '<div class="row"><div class="col-md-12  col-sm-12 left-align">';

                for(i in json[cat_name]) {

                    var elem = json[cat_name][i];

                    var labelongoing = "";
                    if (elem.hasOwnProperty('date') && elem.date.includes(ONGOING_WORD))  {
                        labelongoing = 'label-ongoing';
                        elem.date = elem.date.replace(ONGOING_WORD, "<span class='italics'>"+ONGOING_WORD+"</span>");
                    }
                                            
                    var url = (!elem.hasOwnProperty('url') || elem.url === "")? "":'<span class="label-url"><a href="'+elem.url+'">'+FILE_ICON+'</a></span>';
                    var date = (!elem.hasOwnProperty('date') || elem.date === "")? "":'<span class="label-date '+labelongoing+'">'+elem.date+'</span>'
                    
                    
                    
                    content += '<div class="section">';
                    content += '<div class="title-container">';
                    content += '<div class="title">'+innerURLsToHTML(elem.title)+'</div>';
                    content += '<span class="r-label-container">'+url+date+'</span>'
                    content += "</div>"
                    
                    //some special stuff for talks
                    if (cat_name.includes("Speaker")) {
                        
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
                        var subt = '<span class="label-event-type '+labeltype+'">'+elem.subtitle+'</span>'
                                        

                        content += '<div class="subtitle">'+subt+'</div>';

 
                        
                    } else { //default stuff
                        
                        if(elem.hasOwnProperty('subtitle'))
                            content += '<div class="subtitle">'+elem.subtitle+'</div>';        
                    }
                    


          
                    if(elem.hasOwnProperty('description'))
                        content += '<div class="description">'+innerURLsToHTML(elem.description)+'</div>';  
                    content += '</div>'    
                          
                }

                content += '</div></div></div>';            
            }
        }

        $(container).html(content);
    });

}

/**
Fills the HTML for education
*/
function fillHTMLEducation(container) {
    var json_file = EDUCATION_JSON;

    $.getJSON(json_file, function(json) {
        var content = "";

        content += '<div class="block-content mb-80">'
        content += '<div class="row">'
        content += '<div class="col-md-12">'
        content += '<div class="sub-title mb-40">'
        content += '<h2 class="uppercase">Education</h2>'
        content += '</div></div></div>'
        content += '<div class="row"><div class="col-md-12  col-sm-12 left-align">';

        for(i in json) {

            var elem = json[i];
            

            var date = (!elem.hasOwnProperty('date') || elem.date === "")? "":'<span class="label-date">'+elem.date+'</span>'
            content += '<div class="section">';
            content += '<div class="title-container">';
            content += '<div class="title">'+elem.title+'</div>';
            content += '<span class="r-label-container">'+date+'</span>'
            content += "</div>"
            content += '<div class="subtitle">'+elem.subtitle+'</div>';
            content +='<div class="description">'
            if(elem.hasOwnProperty('score') && elem.score !== "")
                content += "<em>"+elem.score+"</em><br>";  
            if(elem.hasOwnProperty('specialization') && elem.specialization !== "")
                content += "<strong class='edu-strong'>Specialization</strong>: "+elem.specialization+"<br>";  
            if(elem.hasOwnProperty('thesis') && elem.thesis !== "")
                content += "<strong  class='edu-strong'>Thesis</strong>: \""+elem.thesis+"\"<br>";  
            if(elem.hasOwnProperty('themes') && elem.themes !== "")
                content += "<strong class='edu-strong'>Themes</strong>: "+elem.themes;  
            if(elem.hasOwnProperty('url') && elem.url !== "")
                content += '<br><a href="'+elem.url+'"><button class="btn btn-sm btn-dark" style="margin-top:10px">Download Thesis</button></a>'

            content += '</div></div>'           
        }

        content += '</div></div></div>';            

        $(container).html(content);
    });

}


/**
Fills the HTML for edutainment
*/
function fillHTMLScientificCommunication(container) {
    var json_file = SCIENTIFIC_COMMUNICATION_JSON;

        $.getJSON(json_file, function(json) {


        var content = "";
        for(cat_name in json) {

            if(json[cat_name].length > 0) { //check if there is something in the category

                content += '<div class="block-content mb-80">'
                content += '<div class="row">'
                content += '<div class="col-md-12">'
                content += '<div class="sub-title mb-40">'
                content += '<h2 class="uppercase">'+cat_name+'</h2>'
                content += '</div></div></div>'
                content += '<div class="row"><div class="col-md-12  col-sm-12 left-align">';

                for(i in json[cat_name]) {

                    var elem = json[cat_name][i];

                    //parse platform
                    var icon = ""
                    switch(elem.platform.toLowerCase()) {
                        case "youtube": icon='<i class="fab fa-youtube" style="color:red" ></i>&nbsp;'; break;
                        case "twitch": icon='<i class="fab fa-twitch"></i>&nbsp;'; break;
                        case "blog": icon='<i class="far fa-file-alt style="color:#777"></i>&nbsp;'; break;
                        default: icon='<i class="fas fa-video"></i>&nbsp;'; break;
                    }
                    
                    
                    content += '<div class="section">'
                    content += '<div class="title-container">';
                    content += '<div class="title"><a style="text-decoration: none !important;" href="'+elem.url+'">'+icon+elem.title+'</a></div>';
                    if(elem.hasOwnProperty('views') && elem.views != "")
                        content += '<span class="r-label-container"><span class="label-date">'+elem.views+'</span></span>'
                    content += "</div>"
                    if(elem.hasOwnProperty('subtitle'))
                        content += '<div class="subtitle">'+elem.subtitle+'</div>';
                    if(elem.hasOwnProperty('description'))
                        content += '<div class="description">'+innerURLsToHTML(elem.description)+'</div>';  
                    content += '</div>'           
                }

                content += '</div></div></div>';            
            }
        }

        $(container).html(content);
    });

}



/**
* Fills the HTML container with the publications
*/
function fillHTMLPublications(container) {
    $.get(PUBLICATIONS, function (data) {
        json = bibtexParse.toJSON(data);

        preprocessBib(json);

        json_by_year = {}
        years = []

        //index bib by year
        for(i in json) {
            var year = json[i].entryTags.year.toString();
            years.push(year)

            if(json_by_year.hasOwnProperty(year))
                json_by_year[year].push(json[i])
            else
                json_by_year[year] = [json[i]]
        }


        years = [...new Set(years)] //remove duplicate


        var content = "";
        for(i in years) {
            year = years[i]

            content += '<div class="block-content mb-80">'
            content += '<div class="row">'
            content += '<div class="col-md-12">'
            content += '<div class="sub-title mb-40">'
            content += '<h2 class="uppercase">'+year+'</h2>'
            content += '</div></div></div>'
            content += '<div class="row"><div class="col-md-12  col-sm-12 left-align">';




            for(i in json_by_year[year]) {
                var entry = json_by_year[year][i].entryTags;
                var entry_type = json_by_year[year][i].entryType;                    

                var url = (!entry.hasOwnProperty('url') || entry.url === "")? "":'<span class="label-url label-info"><a href="'+entry.url+'">PDF</a></span>';
                var label = entry_type === "inproceedings"? '<span class="label-conference">C</span>': entry_type === "article"? '<span class="label-journal">J</span>':"";
                var label = (entry.hasOwnProperty('note') && entry.note.toLowerCase() == "correspondence")? '<span class="label-correspondence">L</span>':label; //could be correspondence

                content += '<div class="section">'
                content += '<div class="title-container">';
                content += '<div class="title">'+entry.title+'</div>';
                content += '<span class="r-label-container">'+label+url+'</span>'
                content += "</div>"
                content += '<div class="subtitle">'+entry.author+'</div>';
                content += '<div class="description">'+buildBibDescription(entry_type.toLowerCase(), entry)+'</div>';
                content += '</div>'           
            }
            content += '</div></div></div>';            
        }

        $(container).html(content);

    });
}

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


