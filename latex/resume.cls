%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% Medium Length Professional CV - RESUME CLASS FILE
%
% This template has been downloaded from:
% http://www.LaTeXTemplates.com
%
% This class file defines the structure and design of the template. 
%
% Original header:
% Copyright (C) 2010 by Trey Hunner
%
% Copying and distribution of this file, with or without modification,
% are permitted in any medium without royalty provided the copyright
% notice and this notice are preserved. This file is offered as-is,
% without any warranty.
%
% Created by Trey Hunner and modified by www.LaTeXTemplates.com
%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\ProvidesClass{resume}[2010/07/10 v0.9 Resume class]

\LoadClass[11pt,letterpaper]{article} % Font size and paper type

\usepackage[parfill]{parskip} % Remove paragraph indentation
\usepackage{array} % Required for boldface (\bf and \bfseries) tabular columns
\usepackage{ifthen} % Required for ifthenelse statements
\usepackage[colorlinks, linkcolor=black, urlcolor=blue]{hyperref}
\usepackage{fontawesome}

\pagestyle{empty} % Suppress page numbers

%----------------------------------------------------------------------------------------
%	HEADINGS COMMANDS: Commands for printing name and address
%----------------------------------------------------------------------------------------

\def \name#1{\def\@name{#1}} % Defines the \name command to set name
\def \@name {} % Sets \@name to empty by default

\def \addressSep {$\diamond$} % Set default address separator to a diamond

% One, two or three address lines can be specified 
\let \@addressone \relax
\let \@addresstwo \relax
\let \@addressthree \relax

% \address command can be used to set the first, second, and third address (last 2 optional)
\def \address #1{
  \@ifundefined{@addresstwo}{
    \def \@addresstwo {#1}
  }{
  \@ifundefined{@addressthree}{
  \def \@addressthree {#1}
  }{
     \def \@addressone {#1}
  }}
}

% \printaddress is used to style an address line (given as input)
\def \printaddress #1{
  \begingroup
    \def \\ {\addressSep\ }
    \centerline{#1}
  \endgroup
  \par
  \addressskip
}

% \printname is used to print the name as a page header
\def \printname {
  \begingroup
    \hfil{\MakeUppercase{\namesize\bf \@name}}\hfil
    \nameskip\break
  \endgroup
}

%----------------------------------------------------------------------------------------
%	PRINT THE HEADING LINES
%----------------------------------------------------------------------------------------

\let\ori@document=\document
\renewcommand{\document}{
  \ori@document  % Begin document
  \printname % Print the name specified with \name
  \@ifundefined{@addressone}{}{ % Print the first address if specified
    \printaddress{\@addressone}}
  \@ifundefined{@addresstwo}{}{ % Print the second address if specified
    \printaddress{\@addresstwo}}
     \@ifundefined{@addressthree}{}{ % Print the third address if specified
    \printaddress{\@addressthree}}
}

%----------------------------------------------------------------------------------------
%	SECTION FORMATTING
%----------------------------------------------------------------------------------------

% Defines the headSection environment for the large sections within the CV
\newenvironment{headSection}[2]{ % 1 input argument - section name
  \Needspace{#2\baselineskip}
  \sectionskip
  \MakeUppercase{\bf #1} % Section title
  \sectionlineskip
  \hrule % Horizontal line
  \begin{list}{}{ % List for each individual item in the section
    \setlength{\leftmargin}{1.5em} % Margin within the section
  }
  \item[]
}{
  \end{list}
}

%----------------------------------------------------------------------------------------
%	WORK EXPERIENCE FORMATTING
%----------------------------------------------------------------------------------------

\newenvironment{listSubsection}[4]{ % 4 input arguments - company name, year(s) employed, job title and location
 {\bf #1} \hfill {#2} % Bold company name and date on the right
 \ifthenelse{\equal{#3}{}}{}{ % If the third argument is not specified, don't print the job title and location line
  \\
  {\em #3} \hfill {\em #4} % Italic job title and location
  }\smallskip
  \begin{list}{$\cdot$}{\leftmargin=0em} % \cdot used for bullets, no indentation
   \itemsep -0.5em \vspace{-0.5em} % Compress items in list together for aesthetics
  }{
  \end{list}
  \vspace{0.5em} % Some space after the list of bullet points
}

%----------------------------------------------------------------------------------------
%	MY COMMANDS
%----------------------------------------------------------------------------------------


\newcommand{\edu}[7]{ % 5 input arguments - name, date, location, result, specialisation, thesis, themes (the last 3 are optional)
  {\bf #1} \hfill {#3} \\ 
  #2 \smallskip\smallskip \\
  \ifthenelse{\equal{#4}{}}{}{ %if the fourth is not specified, don't print it
  {\em #4} \smallskip\\
  }
  \ifthenelse{\equal{#5}{}}{}{ % If the fifth line argument is not specified, don't print the rest of it
  {\small{\bf Specialisation}: #5}\\
  } 
  \ifthenelse{\equal{#6}{}}{}{ % If the sixth line argument is not specified, don't print the rest of it
    {\small{\bf Thesis}: `#6'}\\
  }
  \ifthenelse{\equal{#7}{}}{}{ % If the seventh line argument is not specified, don't print the rest of it
  {\small{\bf Themes}: #7}\\
  }   
  
  
  \vspace{0.5em} % Some space 
}



\newcommand{\pub}[5]{ % 5 input arguments - title line 1, title line 2, year, authors, details
\begin{minipage}{\linewidth} 
 {\bf #1} \hfill {#3} % title and date on the right 
 \ifthenelse{\equal{#2}{}}{}{ % If the second line argument is not specified, don't print it
  \\
  {\bf #2} % bold 
  }\smallskip 
  \\
  #4 % italic authors
   \\
  {\small {\em #5}} % detail 
  \smallskip
  \vspace{0.5em} % Some space 
  \end{minipage} 
}

  
\newcommand{\entry}[6]{ % title line 1, title line 2, subtitle, date, url, description
\begin{minipage}{\linewidth} 
 {\bf #1} \hfill {#4}
 \ifthenelse{\equal{#2}{}}{}{ % If the second line argument is not specified, don't print it
  \\
  {\bf #2} % bold 
  }\smallskip
  \\
 \ifthenelse{\equal{#6}{}}{ %if true (no description)
    \ifthenelse{\equal{#5}{}}{ %if true (no link)
        #3
     }{ % If false (yes link)
    #3 \hfill \href{#5}{\texorpdfstring{\footnotesize \faLink}{Link}} 
    }
  }{ % If false (yes description)
    \ifthenelse{\equal{#5}{}}{ %if true (no link)
        {\em #3}
     }{ % If false (yes link)
    {\em #3} \hfill \href{#5}{\texorpdfstring{\footnotesize \faLink}{Link}} 
    }\\[1.2ex]
      #6
  }
  \\
  \vspace{0.3em} % Some space
  \end{minipage}
}

% Defines the headSection environment for the large sections within the CV
\newenvironment{mainSection}[2]{ % 1 input argument - section name
  \Needspace{#2\baselineskip}
  \sectionskip
  \begin{center}
  \MakeUppercase{{\Large\bf #1}} % Section title
  \end{center}
  \sectionlineskip
  \begin{list}{}{ % List for each individual item in the section
    \setlength{\leftmargin}{1.5em} % Margin within the section
  }
  \item[]
}{
  \end{list}
}


\newcommand{\minientry}[3]{ % 5 input arguments - title line 1, title line 2, year,
\begin{minipage}{\linewidth} 
 {#1} \hfill {#3} % title and date on the right 
 \ifthenelse{\equal{#2}{}}{}{ % If the second line argument is not specified, don't print it
 \\ 
 #2
  } \smallskip
    \vspace{0.3em} % Some space
  \end{minipage} 
}



% \newcommand{\pubb}[5]{ % 5 input arguments - title line 1, title line 2, year, authors, details
%  {\bf #1} \hfill {#3} % title and date on the right 
%  \ifthenelse{\equal{#2}{}}{}{ % If the second line argument is not specified, don't print it
%   \\
%   {\bf #2} % bold 
%   }\smallskip 
%   \\
%   #4 % italic authors
%    \\
%   {\small {\em #5}} % detail 
%   \smallskip
%   \vspace{0.5em} % Some space 
% }

% \newcommand{\twoLiner}[4]{ % 4 input arguments - title, date, details, link (optional)
% \begin{minipage}{\linewidth} 
%  {\bf #1} \hfill {#3}\\
%  \ifthenelse{\equal{#4}{}}{ %if true
%     #2
%   }{ % If false
%   #2 \hfill \href{#4}{\texorpdfstring{\footnotesize \faLink}{Link}} 
%   }
%   \\
%   \vspace{0.3em} % Some space
%   \end{minipage}
% }

% \newenvironment{threeLiner}[4]{ % 4 input arguments -
% \begin{minipage}{\linewidth} 
%  {\bf #1} \hfill {#2}\\ % Bold company name and date on the right
%  \ifthenelse{\equal{#3}{}}{}{ % 
%   {\em #3} \hfill {\em #4} % Italic job title and location
%   }\smallskip \\
%   }{
%   \vspace{0.5em} % Some space after the list of bullet points
% \end{minipage}
%   }



% The below commands define the whitespace after certain things in the document - they can be \smallskip, \medskip or \bigskip
\def\namesize{\huge} % Size of the name at the top of the document
\def\addressskip{\smallskip} % The space between the two address (or phone/email) lines
\def\sectionlineskip{\medskip} % The space above the horizontal line for each section 
\def\nameskip{\bigskip} % The space after your name at the top
\def\sectionskip{\medskip} % The space after the heading section



