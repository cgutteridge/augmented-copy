/* ultralinks.js by Christopher Gutteridge 
   https://github.com/cgutteridge/ultralink/
   GPLv3
*/
jQuery(document).ready(function(){

   var popup;
   var message;
   var whatisthis;

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
         var locSpec = ';article='+(i+1);
         contexts[locSpec] = jQuery(e);
         activateContextArea( jQuery(e), locSpec );
      });
   } else {
      var post = jQuery( ".post" ).first();
      if( post.length ) {
         // use the .post, with an ID for preference.
         var locSpec = "";
         if( post[0].hasAttribute('id') != '' ) {
            locSpec += post.attr('id');
         }
         contexts[locSpec] = post;
         activateContextArea( post, locSpec );
      }
   }

   // detect fragment and highlight range if possible
   if( window.location.hash ) {
      var fragment = window.location.hash.replace(/^#/,'');
      highlightLocspec( fragment );
   }


   function highlightLocspec( fragment ) {

      // for now we need it to end with a char range
      if( !fragment.match( /;char=\d+-\d+$/ ) ) {
         return;
      }

      var locSpecBits = fragment.split( ";" );
      var charRange = locSpecBits.pop();
      var locSpecContext = locSpecBits.join( ";" );

      // get the jquery object the locSpecContext indicates. In time this code will
      // hopefully become far more cleverer
      if( !contexts.hasOwnProperty( locSpecContext ) ) {
         console.log( "unknown context "+locSpecContext );
         console.log( "Valid contexts: "+contexts );
         return;
      }

      var highlightContext = contexts[locSpecContext]; 
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

   var dotdiv = jQuery("<div style='position: absolute;z-index:1000'>");
   var dot = jQuery("<span style='cursor:pointer;font-size:400%;opacity:0.5;color:#36f;'>●</span></div>");
   var menu = jQuery("<div style='background-color: black; color: white;'>A menu with more options of things to do with the selection.</div>");
   dotdiv.append(dot);
   dotdiv.append(menu);
   dotdiv.mouseover(function() { menu.show(); dot.hide();} );
   dotdiv.mouseout(function() { menu.hide(); dot.show();} );
   jQuery('body').append(dotdiv);

   message = jQuery("<div style='position: absolute; z-index: 1100;background:black;color:white;padding:10px;'></div>");
   jQuery('body').append(message);
   message.hide();

   var about=jQuery( "<div><p>This is a javascript tool added to this website which modifies the copy behaviour to insert additional citation information into the HTML version of the clipboard. If you copy normally you shouldn't notice any undesired behaviour. However, the information about where and when you copied from are captured inside the attributes, and may be read if you paste into tools that are looking for it.</p><p>The blue dot gives a menu of other options including copying a high resolution link, which when followed back to this page will highlight the selection, and an option to copy a full HTML citation of the selected area in which the citation information will be visible.</p><p>This is part of a set of experiments to <a href='http://doug-50.info/'>celebrate the 50th aniversary</a> of the famous <a href='https://en.wikipedia.org/wiki/The_Mother_of_All_Demos'>Doug Englebart demo</a>, which isn't as famous as it should be!</p><p>Code by <a href='http://twitter.com/cgutteridge'>Christopher Gutteridge</a>, design by Christopher Gutteridge and Frode Hegland.</p></div>" ).hide();
   about.find("a").css("color","white");
   about.append( jQuery( "<span>Thanks, hide this again</span>").css("background-color","rgb(255,255,255,0.1)").css("padding","0 10px").css( "cursor","pointer").click( function fn(){about.hide();tools.show();} ) );
   whatisthis = jQuery("<span>What is this?</span>").css("background-color","rgb(255,255,255,0.1)").css("padding","0 10px").css( "cursor","pointer").click( function fn(){about.show();tools.hide();} );
   var tools = jQuery("<div>Enhanced citation copy enabled!</div>").append(jQuery("<div style='float:right'></div>").append( whatisthis ));


   popup = jQuery("<div style='position: fixed; bottom:5%; left: 5%; font-size: 120%; padding: 1em; width:90%;'></div>");
   var popupInner = jQuery("<div style='padding:5px 5%;background-color:#333;color:#ccc;font-family:monospace;border:solid 1px #000'></div>" );
   popup.append(popupInner);
   popupInner.append(about, tools);
   jQuery('body').append(popup);
   popup.hide();
   // don't hide the popup when we click inside it
   popup.mouseup( function(event) { event.stopPropagation(); } );


   var dotx;
   var doty;

   jQuery('body').mouseup( function() {
      popup.hide();
      dotdiv.hide();
      return true; // propagate
   });
/*
   var tabs = jQuery("<div style='margin-left:1em;'></div>");
   var closeTab = jQuery( "<div title='Close' style='float:right; border-top-left-radius: 0.5em; border-top-right-radius:0.5em;cursor:pointer;margin-right:1.5em; display:inline-block;padding:2px 0.5em; position:relative;top:2px;border:solid 2px black; background-color: #eee'>X</div>" );
   var blocks = jQuery("<div style='height:10em;padding:1em;border:solid 2px black; background-color: #eee; border-radius:1em;    box-shadow: 5px 5px 5px ;'></div>");
   tabs.append(closeTab);
   closeTab.click(function(){popup.hide();});
   popup.append(tabs);
   popup.append(blocks);
   var tabNames = [ 'Link','Short HTML','Long HTML','Twitter','Facebook','About' ];
   var blocksByName = [];
   var tabsByName = [];
   for( i=0;i<tabNames.length;++i ) {
      var tab = jQuery( "<div data-tab='"+tabNames[i]+"' style='border-top-left-radius: 0.5em; border-top-right-radius:0.5em;cursor:pointer;margin-right:0.5em; display:inline-block;padding:2px 0.5em; position:relative;top:2px;border:solid 2px black; background-color: #eee'>"+tabNames[i]+"</div>" );
      var block = jQuery( "<div style=''></div>" );
      tabs.append(tab);
      blocks.append(block);
      tabsByName[tabNames[i]] = tab;
      blocksByName[tabNames[i]] = block;
      tab.click( function(){ 
         var tabName = jQuery(this).attr( 'data-tab' );
         tabs.children().css('background-color','#666').css('color','white').css( 'border-bottom','solid 1px #000');
         tabsByName[tabName].css('background-color','#eee').css('color','black').css('border-bottom','solid 2px #eee');
         blocks.children().hide();
         blocksByName[tabName].show();
         closeTab.show();
      } );
      tabsByName['Link'].click();
   }
*/

   // returns an object with the from and to char offset, or false
   function getSelectionRangeInContext(context) {

      jQuery('.ultralink-ignore').hide();
      var selection = window.getSelection();
      var contextRange = {};                             
      var fromOff = charOffset( context.get(0), selection.anchorNode) 
      var toOff = charOffset( context.get(0), selection.focusNode);
      contextRange.text = selection.toString();
      jQuery('.ultralink-ignore').show();

      if( fromOff == -1 || toOff == -1 ) {
         // out of scope
         return false; // propagate event
      }
      contextRange.from = fromOff + selection.anchorOffset;
      contextRange.to = toOff + selection.focusOffset;
      if( contextRange.from == contextRange.to ) {
         // right now this is only fussed with contextRange, not points in the text, so a zero-character selection should be ignored 
         return false; // propagate event
      }

      if( isNaN(contextRange.from) || isNaN(contextRange.to) ) {
         // out of scope
         return false; // propagate event
      }
     
      // clean up if user selected backwards 
      if( contextRange.from > contextRange.to ) {
         var tmp = contextRange.from;
         contextRange.from = contextRange.to;
         contextRange.to = tmp;
      }
     
      return contextRange; 
   }

   // from https://hackernoon.com/copying-text-to-clipboard-with-javascript-df4d4988697f
   const copyTextToClipboard = str => {
      var el = jQuery( "<textarea></textarea>").val(str).attr('readonly','readonly').css('position','absolute').css('left','-9999px');
      jQuery('body').append(el);
      clearSelections();
      el.select();                                    // Select the <textarea> content
      document.execCommand('copy');                   // Copy - only works as a result of a user action (e.g. click events)
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


   function activateContextArea( context, locSpec ) {
      var contextUrl = pageInfo.url+"#"+locSpec;

      context.mouseup( function(e) {

         contextRange = getSelectionRangeInContext(context);
         var selection = window.getSelection();
         var realrange = selection.getRangeAt(0);
         if( !contextRange ) { 
            return true; // propagate event
         }

         // Create popup text 
         var link = contextUrl + ";char="+contextRange.from+"-"+contextRange.to;
         var author = findAuthor( context );

	 // setup menu
         menu.text("");

       	 function makeMenu(text,fn) {  
         	menu.append( 
		    jQuery('<div>'+text+'</div>')
			.css('padding','2px 10px')
			.css('border','solid 1px black')
			.css('cursor','pointer')
			.mouseover(function(){jQuery(this).css('background-color','white').css('color','black');})
			.mouseout(function(){jQuery(this).css('background-color','black').css('color','white');})
			.click(function(event) {
				event.stopPropagation();
				fn(event);
      				clearSelections();
      				window.getSelection().addRange(realrange);
				popup.show();
      				dotdiv.show();
			})
		);
	}

         makeMenu( 
		"Copy hires URL", 
		function(event){
			copyTextToClipboard( link );
       			flashMessage("Copied hires URL");
		});
         makeMenu( 
		"Copy citation", 
		function(event){
			var blockQuote = jQuery( '<blockquote></blockquote>' )
				.attr( "cite", link )
				.append( realrange.cloneContents() );
			var title = jQuery( "<a></a>").attr('href',link ).text(pageInfo.title);
			blockQuote.append( jQuery( '<cite style="display:block">- </cite>').append( title ))
         		if( author && author.name ) {
				var a = jQuery( "<a></a>").text( author.name );
         			if( author && author.url ) {
					a.attr( "href", author.url );
         			}
				blockQuote.append( jQuery.parseHTML( ", " ), a );
			}
			blockQuote.append( jQuery.parseHTML( ", retrieved "+(new Date().toDateString())));
			copyDOMToClipboard( blockQuote );
       			flashMessage("Copied HTML Citation");
		});

        makeMenu( 
		"Tweet it", 
		function(event){
         		var tweet = "\""+trimText( contextRange.text, 240 )+"\" - "+link;
         		var twitLink = "https://twitter.com/intent/tweet?text="+encodeURIComponent(tweet)+"&source=webclient";
			window.open(twitLink, 'newwindow', 'width=500, height=380'); 
		}
	);
        makeMenu( 
		"Facebook it", 
		function(event){
         		var faceLink = "https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(link);
			window.open(faceLink, 'newwindow', 'width=500, height=380'); 
		}
	);
        makeMenu( 
		"Google it", 
		function(event){
         		var googleLink = "https://www.google.com/search?q="+encodeURIComponent(contextRange.text);
			window.open(googleLink, '_blank');
		}
	);
        makeMenu( 
		"About this tool", 
		function(event){
			whatisthis.click();
		}
	);
   
 
/*
         blocksByName['Link'].html( "<p>To link directly to this range use:</p><p><tt><a href='"+link+"'>"+link+"</a></tt></p>" );
   
         var sourceLink = jQuery( "<a>Source</a>" );
         sourceLink.attr("href",link).attr("title",pageInfo.title);
         var cite = jQuery("<cite></cite>").append(sourceLink);
         blocksByName['Short HTML'].html( '' ).append( jQuery( '<textarea style="max-width:100%;height:10em;width:100%;font-family:monospace">' ).val( "<q>"+trimText( contextRange.text, 50 )+"</q> - "+toHTML(cite) ) );
   
         var sourceLink2 = jQuery( "<a></a>" );
         sourceLink2.attr("href",link).text(pageInfo.title+", Character range "+contextRange.from+"-"+contextRange.to );
         var cite2 = jQuery("<cite></cite>").append(sourceLink2);
         blocksByName['Long HTML'].html( '' ).append( jQuery( '<textarea style="max-width:100%;height:10em;width:100%;font-family:monospace">' ).val( "<blockquote>\""+contextRange.text+"\"</blockquote>\n<div>- "+toHTML(cite2)+"</div>" ) );
   
         blocksByName['About'].html('<p>Ultralink.js was written by <a href="http://www.ecs.soton.ac.uk/people/cjg">Christopher Guuteridge</a> for the <a href="http://doug-50.info/">Doug@50</a> project.</p><p>It\'s available under the GPL license, at <a href="https://github.com/cgutteridge/ultralink/">GitHub</a>.</p>' );
  */ 
         popup.show();
         dotx = 20+e.pageX;
         doty = e.pageY;
         dotdiv.css({'left':dotx+"px",'top':doty+"px"});
         menu.hide(); 
         dot.show(); 
         dotdiv.show();
	
      //var tabNames = [ 'Link','Short HTML','Long HTML','Twitter','Facebook' ];
   
         
         return false; // don't propagate event
      });


      /* initialise enhancd copy */
      context.on('copy', function(event) {
         var sel = window.getSelection();
         var realrange = sel.getRangeAt(0);

         contextRange = getSelectionRangeInContext(context);
         if( !contextRange ) { 
            return true; // propagate event
         }
   
         var link = contextUrl + ";char="+contextRange.from+"-"+contextRange.to;
         var author = findAuthor( context );

         // create the thing we really want to copy
         var citation = jQuery('<span></span>');
         citation.attr('data-source', link );
         citation.attr('data-title', pageInfo.title );
         if( author && author.name ) {
            citation.attr('data-author-name', author.name );
         }
         if( author && author.url ) {
            citation.attr('data-author-url', author.url );
         }
         citation.append(realrange.cloneContents());
         var wrapper = jQuery('<div></div>');
         wrapper.append(citation);
   
         var json = {
            jrnlCitation: true,
            comment: "This is a demo format. Probably it will be replaced with JSON-LD of dcterms+bibo",
            version: 0.1,
            citation: {
               title: pageInfo.title,
               url: link,
               timestamp: Math.floor(Date.now() / 1000),
               text: citation.text(),
               html: citation.html()
            }
         };
         if( author && author.name ) {
            json.citation.author=author.name;
         }
         if( author && author.url ) {
            json.citation.authorURL=author.url;
         }
   
         var clipboardData = event.clipboardData || window.clipboardData || event.originalEvent.clipboardData;
         clipboardData.setData('application/json', JSON.stringify( json, null,"\t" ));
         clipboardData.setData('text/html', wrapper.html() );
         clipboardData.setData('text/plain', wrapper.text() );

         // remove temporary DOM object
         citation.remove();
   
         flashMessage("Copied augmented citation");

         return false; // stop the normal copy op
      });

   }

   function flashMessage( text ) {
      message.text(text);
      message.show();
      message.css({'left':(dotx-message.outerWidth()/2)+"px",'top':(doty-message.outerHeight()-10)+"px"});
      message.fadeOut( 2000 );
   }

   // try to find the name and or URL of an author for the given context.
   function findAuthor( context ) {
      var vcard = context.find( '.author.vcard' );
      if( !vcard ) {
         return false;
      }

      var fn = vcard.find( '.fn');
      var n = vcard.find( '.n');
      var url = vcard.find('.url');
      var author = {};
      var matched = false;
 
      if( url ) { 
         author.url = url.attr('href');
         matched = true;
      } 
      if( fn ) { 
         author.name = fn.text();
         matched = true;
      } 
      else if( n ) { 
         author.name = n.text();
         matched = true;
      } 

      if( !matched ) {
         return false;
      } 
      return author;
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



});


