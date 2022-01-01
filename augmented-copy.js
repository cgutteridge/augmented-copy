/* ultralinks.js by Christopher Gutteridge 
    https://github.com/cgutteridge/ultralink/
    GPLv3
*/
jQuery(document).ready(function(){

    // initialise selection capture
    var url = jQuery( "link[rel='canonical']" ).attr( 'href' );

    // override the url for debugging purposes, not appropriate in final version. 
    // maybe this should be per-context info instead
    var pageInfo = {};
    pageInfo.title = jQuery(document).prop('title');
    pageInfo.url = window.location.href.replace( /#.*$/, '' );

    var contexts = {};

    // this is the actual article in the page that the reference looks at, ignoring the outer template which may change over time
    // getting <article>s is probably better than using .post
    var articles = jQuery( "article" );
    if( articles.length ) {
        articles.each( function(i,e) { 
            var loc_spec = ';article='+(i+1);
            contexts[loc_spec] = jQuery(e);
            activateContextArea( jQuery(e), loc_spec );
        });
    } else {
        var post = jQuery( ".hentry" ).first();
        if( post.length ) {
            // use the .post, with an ID for preference.
            var loc_spec = "";
            if( post[0].hasAttribute('id') != '' ) {
                loc_spec += post.attr('id');
            }
            contexts[loc_spec] = post;
            activateContextArea( post, loc_spec );
        }
    }
    // detect fragment and highlight range if possible
    if( window.location.hash ) {
        var fragment = window.location.hash.replace(/^#/,'');
        highlightLocspec( fragment );
    }

    var html_popup;
    var html_message;
    var html_what_is_this;
    var just_shown_popup = false;

    jQuery('body').mouseup( (e)=> {
        if( !just_shown_popup ) {
            html_popup.hide();
            html_ui_outer.hide();
            return true;
        }
        just_shown_popup = false;
        return true;
    });

    var html_ui_outer = jQuery("<div style='position: absolute;z-index:1000'>");
    var html_dot = jQuery("<img />").attr('src',bluedot()).attr('width',22);
    var html_menu = jQuery("<div style='background-color: black; color: white; box-shadow: 5px 5px 10px rgba(0, 0, 0, 0.5);'>A menu with more options of things to do with the selection.</div>");
    html_ui_outer.append(html_dot);
    html_ui_outer.append(html_menu);
    html_ui_outer.mouseover(function() { html_menu.show(); html_dot.hide();} );
    html_ui_outer.mouseout(function() { html_menu.hide(); html_dot.show();} );
    jQuery('body').append(html_ui_outer);

    html_message = jQuery("<div style='position: absolute; z-index: 1100;background:black;color:white;padding:10px;'></div>");
    jQuery('body').append(html_message);
    html_message.hide();

    html_popup = jQuery("<div style='position: fixed; bottom:5%; left: 5%; font-size: 120%; padding: 1em; width:90%;'></div>");
    var html_about = jQuery( "<div><p>This is a javascript tool added to this website which modifies the copy behaviour to insert additional citation information into the HTML version of the clipboard. If you copy normally you shouldn't notice any undesired behaviour. However, the information about where and when you copied from are captured inside the attributes, and may be read if you paste into tools that are looking for it.</p><p>The blue dot gives a menu of other options including copying a high resolution link, which when followed back to this page will highlight the selection, and an option to copy a full HTML citation of the selected area in which the citation information will be visible.</p><p>This is part of a set of experiments to <a href='http://doug-50.info/'>celebrate the 50th aniversary</a> of the famous <a href='https://en.wikipedia.org/wiki/The_Mother_of_All_Demos'>Doug Englebart demo</a>, which isn't as famous as it should be!</p><p>Code by <a href='http://twitter.com/cgutteridge'>Christopher Gutteridge</a>, design by Christopher Gutteridge and Frode Hegland.</p></div>" ).hide();
    html_about.find("a").css("color","white");
    html_about.append( jQuery( "<span>Thanks, hide this again</span>").css("background-color","rgb(255,255,255,0.1)").css("padding","0 10px").css( "cursor","pointer").click( function fn(){html_popup.hide();html_about.hide();html_tools.show();} ) );
    html_what_is_this = jQuery("<span>What is this?</span>").css("background-color","rgb(255,255,255,0.1)").css("padding","0 10px").css( "cursor","pointer").click( function fn(){html_popup.show();html_about.show();html_tools.hide();} );
    var html_tools = jQuery("<div>Enhanced citation copy enabled!</div>").append(jQuery("<div style='float:right'></div>").append( html_what_is_this ));

    var html_popup_inner = jQuery("<div style='padding:5px 5%;background-color:#333;color:#ccc;font-family:monospace;border:solid 1px #000'></div>" );
    html_popup.append(html_popup_inner);
    html_popup_inner.append(html_about, html_tools);
    jQuery('body').append(html_popup);
    html_popup.hide();
    // don't hide the popup when we click inside it
    html_popup.mouseup( function(event) { event.stopPropagation(); } );

    var dotx;
    var doty;








    function highlightLocspec( fragment ) {

        // for now we need it to end with a char range
        if( !fragment.match( /;char=\d+-\d+$/ ) ) {
            return;
        }

        var loc_specBits = fragment.split( ";" );
        var charRange = loc_specBits.pop();
        var loc_specContext = loc_specBits.join( ";" );

        // get the jquery object the loc_specContext indicates. In time this code will
        // hopefully become far more cleverer
        if( !contexts.hasOwnProperty( loc_specContext ) ) {
            console.log( "unknown context "+loc_specContext );
            console.log( "Valid contexts: "+contexts );
            return;
        }

        var highlightContext = contexts[loc_specContext]; 
            console.log( "Valid contexts: "+contexts );

        var l2 = charRange.split(/=/);
        if( l2[0] != 'char' ) {
            return; 
        }

        var range = l2[1].split( /-/ );
        var startInsert = jQuery( "<div class='ultralink-insert ultralink-ignore' style='vertical-align:middle;display:inline-block;font-weight:normal;font-size:small; color: #888;padding:0px 0em;border: 0; margin: 0;font-size:200%'>[[</div>");
        var endInsert = jQuery( "<div class='ultralink-insert ultralink-ignore' style='vertical-align:middle;display:inline-block;font-weight:normal;font-size:small; color: #888;padding:0px 0em;border: 0; margin: 0;font-size:200%'>]]</div>");
        var startLabel = jQuery( "<div style='font-size:80%;position:absolute;top:100px;left:0px' class='ultralink-tooltip ultralink-ignore;text-align:center'><div style='background-color:#000;color:#fff;padding:0px 1em; border-radius:1em'>linked-range start</div><div style='text-align:center;color:#000;line-height:70%;font-size:200%'>▼</div></div>" );
        var endLabel = jQuery( "<div style='font-size:80%;position:absolute;top:100px;left:0px' class='ultralink-tooltip ultralink-ignore;text-align:center'><div style='text-align:center;color:#000;line-height:50%;font-size:200%'>▲</div><div style='background-color:#000;color:#fff;padding:0px 1em;border-radius:1em;'>linked-range end</div></div>" );
        jQuery('body').append( startLabel );
        jQuery('body').append( endLabel );
        insertAtOffset( highlightContext.get(0), range[0], startInsert.get(0) );
        insertAtOffset( highlightContext.get(0), range[1], endInsert.get(0) );

        var startPos = startInsert.offset().top;
        var windowHeight = jQuery(window).height();
        var targetWindowOffset = windowHeight*0.3;
        if( startPos > targetWindowOffset ) {
            jQuery(window).scrollTop( startPos-targetWindowOffset );
        }
        startLabel.hide();
        endLabel.hide();

        /* other changes to the page layout mess these out so let's wait a second before adding these */
        setTimeout( function() {
            startLabel.css( 'top', startPos - startLabel.height() - 5 + "px" );
            var startLabelLeft  = startInsert.offset().left + startInsert.width()/2 - startLabel.width()/2;
            if( startLabelLeft >= 0 ) {
                startLabel.css( 'left', startLabelLeft + "px" );
            }

            endLabel.css( 'top', endInsert.offset().top + endInsert.height() + 5 + "px" );
            var endLabelLeft  = endInsert.offset().left + endInsert.width()/2 - endLabel.width()/2;
            if( endLabelLeft >= 0 ) {
                endLabel.css( 'left', endLabelLeft + "px" );
            }
            startLabel.show();
            endLabel.show();
        },1000);
    }

    function trimText( text, maxLength ) {
        if( text.length <= maxLength ) {
            return text;
        }
        return text.substr( 0, maxLength-1 )+"…";
    }

    function toHTML( jqThing ) {
        var div = jQuery( "<div></div>" );
        div.append( jqThing.clone() );
        return div.html();
    }

    // container is a DOM node not jQuery, as we need to look at things jQuery hides from us
    function insertAtOffset(container, offset, insert ) {

        var kids = container.childNodes;
        for( var i=0; i<kids.length; i++ ) {
            var kid = kids[i];
            if( offset == 0 ) {
            container.insertBefore(insert,kid);
            return;
            }
            if( kid.className && kid.className.match( /ultralink-ignore/ ) ) {
                continue;
            }

            // is this needed as the textlength of such a node should be zero
            if( kid.nodeName == "#text" && kid.textContent.match( /^\s*$/ ) ) {
                continue;
            }

            var kidLength = textLength(kid);
            if( kidLength > offset ) {
                // the offset is inside this 
                if( kid.nodeType==1 && kid.hasAttribute('data-length') ) {
                    var textNode = document.createTextNode( kid.innerText );
                    container.insertBefore( textNode, kid);
                    kid.remove();
                    kid = textNode; 
                }
                if( kid.nodeName == "#text" ) {
                    var text = kid.nodeValue;

                    var t1 = text.substr(0,offset);
                    var s1 = document.createElement('span');
                    s1.setAttribute('data-length',t1.length);
                    s1.appendChild( document.createTextNode( t1 ));

                    var t2 = text.substr(offset,text.length-offset);
                    var s2 = document.createElement('span');
                    s2.setAttribute('data-length',t2.length);
                    s2.appendChild( document.createTextNode( t2 ));

                    container.insertBefore(s1,kid);
                    container.insertBefore(insert,kid);
                    container.insertBefore(s2,kid);
                    kid.remove(); 
                } else {
                    insertAtOffset( kid, offset, insert );
                }
                return;
            }
            offset -= kidLength;
        }
        // how to handle if the selection is the very last character?
    }

    // returns an object with the from and to char offset, or false
    function getSelectionRangeInContext(context) {

        jQuery('.ultralink-ignore').hide();
        var selection = window.getSelection();
        var context_range = {};                                        
        var fromOff = charOffset( context.get(0), selection.anchorNode) 
        var toOff = charOffset( context.get(0), selection.focusNode);
        context_range.text = selection.toString();
        jQuery('.ultralink-ignore').show();

        if( fromOff == -1 || toOff == -1 ) {
            // out of scope
            return false; // propagate event
        }
        context_range.from = fromOff + selection.anchorOffset;
        context_range.to = toOff + selection.focusOffset;
        if( context_range.from == context_range.to ) {
            // right now this is only fussed with context_range, not points in the text, so a zero-character selection should be ignored 
            return false; // propagate event
        }

        if( isNaN(context_range.from) || isNaN(context_range.to) ) {
            // out of scope
            return false; // propagate event
        }
        
        // clean up if user selected backwards 
        if( context_range.from > context_range.to ) {
            var tmp = context_range.from;
            context_range.from = context_range.to;
            context_range.to = tmp;
        }
        
        return context_range; 
    }

    // from https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
    const copyTextToClipboard = str => {
        var el = jQuery( "<textarea></textarea>").val(str).attr('readonly','readonly').css('position','absolute').css('left','-9999px');
        jQuery('body').append(el);
        clearSelections();
        el.select();                                                // Select the <textarea> content
        document.execCommand('copy');                        // Copy - only works as a result of a user action (e.g. click events)
        el.remove();
    };
    const copyDOMToClipboard = dom => {
        clearSelections();
        // make sure there's stuff before and after 'dom' so we only copy it and not the wrapping nodes
        var el = jQuery( "<div></div>").css('position','absolute').css('left','-9999px').append("<div></div>").append( dom ).append("<div></div>");
        jQuery( 'body' ).append( el );
        var range = document.createRange();
        range.selectNode(dom[0]);
        window.getSelection().addRange(range);
        document.execCommand('copy');        
        el.remove();
    };

    function clearSelections() {
        if (window.getSelection) {
            if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
            }
        } else if (document.selection) {  // IE?
            document.selection.empty();
        }
    }

    function findMeta( context, context_range, loc_spec ) {
        meta = {};
        meta.link = pageInfo.url + "#" + loc_spec + ";char="+context_range.from+"-"+context_range.to;
        meta.parent_link = pageInfo.url;
        meta.chars = ""+context_range.from+"-"+context_range.to;
        meta.quote = context_range.text;
        meta.title = pageInfo.title;
        meta.timestamp = Math.floor(Date.now() / 1000);

        var html_meta = context.find( '.augmented_copy_metadata' );
        if( html_meta.length ) {
            var published_dom = context.find( '.published' );
            if( published_dom.length ) { 
                meta.published = published_dom.text();
            }
            var html_author = html_meta.find( ".author" );
            var html_url = html_meta.find( ".author_url" );
            if( html_author.length || html_url.length ) {
                meta.author = {};
            }
            if( html_author.length ) { 
                meta.author.name = html_author.text();
            }
            if( html_url.length ) { 
                meta.author.url = html_url.text();
            }
            // using title from metadata block is preferable, if available
            var html_title = html_meta.find( '.title' );
            if( html_title.length ) { 
                meta.title = html_title.text();
            }
        }
        return meta;
    }

    function activateContextArea( context, loc_spec ) {

        context.mouseup( function(e) {
            var real_range = window.getSelection().getRangeAt(0);
            var context_range = getSelectionRangeInContext(context);
            var meta = findMeta( context, context_range, loc_spec );

            if( !context_range ) { 
                return true; // propagate event if nothing selected
            }

            just_shown_popup = true;

            // setup menu
            html_menu.text("");

            function makeMenu(option, text, fn) { 
                // if we have options set and this menu item isn't in the options list, don't show it.
                if( augmented_copy_options && !augmented_copy_options.includes(option) ) { return; } 
                html_menu.append( 
                    jQuery('<div>'+text+'</div>')
                    .css('padding','2px 10px').css('border','solid 1px black').css('cursor','pointer')
                    .mouseover(function(){jQuery(this).css('background-color','white').css('color','black');})
                    .mouseout(function(){jQuery(this).css('background-color','black').css('color','white');})
                    .click(function(event) {
                        event.stopPropagation();
                        fn(event);
                        clearSelections();
                        window.getSelection().addRange(real_range);
                        html_ui_outer.show();
                        html_menu.hide(); 
                        html_dot.show();
                    })
                );
            }

            function selectionToHtmlQuote( meta ) {
                var html_blockquote = jQuery( '<blockquote></blockquote>' )
                    .attr( "cite", meta.link )
                    .append( real_range.cloneContents() );
                html_cite = jQuery( '<cite style="display:block">- </cite>')
                html_cite.append( jQuery( "<a></a>").attr('href',meta.link ).text(meta.title) );
                if( meta.author && meta.author.name ) {
                    var html_a = jQuery( "<a></a>").text( meta.author.name );
                    if( meta.author && meta.author.url ) {
                        html_a.attr( "href", meta.author.url );
                    }
                    html_cite.append( jQuery.parseHTML( ", " ), html_a );
                }
                html_cite.append( jQuery.parseHTML( ", retrieved "+(new Date().toDateString())));
                html_blockquote.append( html_cite );
                return html_blockquote;
            } 
  
            function selectionToBibTeX( meta ) {
                if( meta.author && meta.author.name ) {
                    var id = "";
                    id+=meta.author.name.toLowerCase().replace( /[^0-9a-z ]/g, '' ).replace( / +/g, '-' );
                    id+=":";
                }
                id+=meta.title.toLowerCase().replace( /[^0-9a-z ]/g, '' ).replace( / +/g, '-' );
                if( meta.published ) {
                    id+=":"+meta.published.substring(0,10);
                }
                id+=":"+meta.chars;
   
                // escape bibtex special chars {, " or $
                function bibesc( text ) {
                    return text.replace( /([\{\"\$])/, '\\$1' );
                }

                // nb this isn't yet doing any escaping on the strings which isn't ideal
                var bibtex = "";
                bibtex += "@article{"+id+",\n";
                if( meta.author && meta.author.name ) {
                        bibtex += "author = {"+bibesc(meta.author.name)+"},\n";
                }
                bibtex += "    title = {"+bibesc(meta.title)+"},\n";
                if( meta.published ) {
                    var mmap = { 
                        '01':'jan', '02':'feb', '03':'mar', '04':'apr', '05':'may', '06':'jun',
                        '07':'jul', '08':'aug', '09':'sep', '10':'oct', '11':'nov', '12':'dec' };
                        bibtex += "    year = {"+bibesc(meta.published.substring(0,4))+"},\n";
                        bibtex += "    month = {"+bibesc(mmap[meta.published.substring(5,7)])+"},\n";
                        bibtex += "    day = {"+bibesc(meta.published.substring(8,10))+"},\n";
                }
                bibtex += "    url = {"+bibesc(meta.link)+"},\n";
                bibtex += "    parenturl = {"+bibesc(meta.parent_link)+"},\n";
                bibtex += "    charscited = {"+bibesc(meta.chars)+"},\n";
                bibtex += "    quote = {"+bibesc(meta.quote)+"}\n";
                bibtex += "}\n";
		return bibtex;
            }
 
            makeMenu( 
                "hires",
                "Copy hires URL", 
                function(event){
                    copyTextToClipboard( meta.link );
                    flashMessage("Copied hires URL");
                });
            makeMenu( 
                "citation",
                "Copy citation", 
                function(event){
                    var html_blockquote = selectionToHtmlQuote( meta );
                    copyDOMToClipboard( html_blockquote );
                    flashMessage("Copied Citation");
                });
            makeMenu( 
                "bibtex",
                "Copy BibTeX", 
                function(event){
                    var bibtex = selectionToBibTeX( meta );
                    copyTextToClipboard( bibtex );
                    flashMessage("Copied BibTeX");
                });
            makeMenu( 
                "twitter",
                "Tweet it", 
                function(event){
                    var tweet = "\""+trimText( context_range.text, 240 )+"\" - " + meta.link;
                    var twitLink = "https://twitter.com/intent/tweet?text="+encodeURIComponent(tweet)+"&source=webclient";
                    window.open(twitLink, 'newwindow', 'width=500, height=380'); 
                }
            );
            makeMenu( 
                "facebook",
                "Facebook it", 
                function(event){
                    var faceLink = "https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(meta.link);
                    window.open(faceLink, 'newwindow', 'width=500, height=380'); 
                }
            );
            makeMenu( 
                "google",
                "Google it", 
                function(event){
                    var googleLink = "https://www.google.com/search?q="+encodeURIComponent(context_range.text);
                    window.open(googleLink, '_blank');
                }
            );
            makeMenu( 
                "about",
                "About this tool", 
                function(event){
                    html_popup.show();
                    html_what_is_this.click();
                }
            );
    
            dotx = 20+e.pageX;
            doty = e.pageY;
            html_ui_outer.css({'left':dotx+"px",'top':doty+"px"});
            html_menu.hide(); 
            html_dot.show(); 
            html_ui_outer.show();

            return true; // propagate event
        });



        /* initialise enhancd copy */
        context.on('copy', function(event) {
            var real_range = window.getSelection().getRangeAt(0);
            var context_range = getSelectionRangeInContext(context);
            if( !context_range ) { 
                return true; // propagate event
            }
    
            var link = contextUrl + ";char="+context_range.from+"-"+context_range.to;
            var author = findAuthor( context );
            var published = findPublished( context );

            // create the thing we really want to copy
            var citation = jQuery('<span></span>');
            citation.attr('data-citation-source', link );
            citation.attr('data-citation-title', pageInfo.title );
            citation.attr('data-citation-timestamp',Math.floor(Date.now() / 1000));
            if( author && author.name ) {
                citation.attr('data-citation-author-name', author.name );
            }
            if( author && author.url ) {
                citation.attr('data-citation-author-url', author.url );
            }
    
            citation.append(real_range.cloneContents());
            var wrapper = jQuery('<div></div>');
            wrapper.append(citation);
    
            var clipboardData = event.clipboardData || window.clipboardData || event.originalEvent.clipboardData;
            clipboardData.setData('text/html', wrapper.html() );
            clipboardData.setData('text/plain', wrapper.text() );

            // remove temporary DOM object
            citation.remove();
    
            flashMessage("Copied augmented citation");

            return true; // stop the normal copy op
        });

    }

    function flashMessage( text ) {
        // only flash if the option is on        
        if( augmented_copy_options && !augmented_copy_options.includes('flash') ) { return; } 

        html_message.text(text);
        html_message.show();
        html_message.css({'left':(dotx-html_message.outerWidth()/2)+"px",'top':(doty-html_message.outerHeight()-10)+"px"});
        html_message.fadeOut( 2000 );
    }

    // assumes DOM nodes not jQuery
    // work out how many characters from the start of the contianer to the start of the thing
    // -1 if the thing is not in the container.
    function charOffset( container, thing ) {
        //console.log( '**offset**',"CONTAINER", container, "THING", thing );
        if( container == thing ) { return 0; } 

        // return -1 if the thing doesn't have container as an ancestor.
        if( !isAncestor( container, thing ) ) { return -1; }

        var offset = 0;
        // find the char length of all the children which don't have this item as a child
        // if the thing is a child, just return the char offset we ot to
        // if the thing is an ancestor of a child, call ourselves on that!
        var kids = container.childNodes;
        //console.log( "KIDCOUNT: "+kids.length );
        for( var i=0; i<kids.length; i++ ) {
            var kid = kids[i];
            if( kid.className && kid.className.match( /ultralink-ignore/ ) ) {
                continue;
            }
            if( kid == thing ) { return offset; }
            
            if( isAncestor( kid, thing ) ) {
            return offset + charOffset( kid, thing );
            }
            offset += textLength( kid );
        }
        // we know the thing is somewhere in here, so one of the children of container
        // should have been it's ancestor too.
        //alert( "Error, this code should not have been reached!" );
        return NaN;
    }

    // takes 2 DOM nodes and returns true if major is an ancestor of minor
    function isAncestor( major, minor ) {
        var parent = minor.parentElement;
        while( parent ) {
            if( parent == major ) { return true; }
            parent = parent.parentElement;
        }
        return false;
    }

    function textLength( el ) {
        if( el.className && el.className.match( /ultralink-ignore/ ) ) {
            return 0;
        }
        if( el.nodeType==1 && el.hasAttribute('data-length') ) {
            return parseInt( el.getAttribute('data-length'), 10 );
        }
        if( el.nodeName == "#text" ) {
            var text = el.textContent;
            if( text.match( /^\s*$/ ) ) {
                return 0;
            }
            return text.length;
        }
        var chars = 0;
        var kids = el.childNodes;
        for( var i=0; i<kids.length; i++ ) {
            var kid = kids[i];
            chars += textLength( kid ); 
        }
        return chars;
    } 

    function bluedot() {
        return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAsCAYAAAAehFoBAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTJENjg3MDRCOEMwMTFFODlFRjRERjdCODgwRkQ0OEIiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTJENjg3MDNCOEMwMTFFODlFRjRERjdCODgwRkQ0OEIiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNSBNYWNpbnRvc2giPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpEREI3NzREQkQzRUExMURGQUFFN0RCNkRFRjA3MTQ3OSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpEREI3NzREQ0QzRUExMURGQUFFN0RCNkRFRjA3MTQ3OSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PuLcEkUAAAr/SURBVHja7FlbjF1V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";
    }


});


