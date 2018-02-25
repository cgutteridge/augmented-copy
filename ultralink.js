/* ultralinks.js by Christopher Gutteridge 
   https://github.com/cgutteridge/ultralink/
   GPLv3   
*/
jQuery(document).ready(function(){

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

   // detect fragment
   if( window.location.hash ) {
      var fragment = window.location.hash.replace(/^#/,'');
      if( fragment.match( /;/ ) ) {
         var l1 = fragment.split( /;/ );
         var id = l1[0];
         var l2 = l1[1].split(/=/);
         if( l2[0] == 'chars' ) {
            var range = l2[1].split( /-/ );
            var startInsert = jQuery( "<div class='ultralink-insert ultralink-ignore' style='vertical-align:middle;display:inline-block;font-weight:normal;font-size:small; color: #888;padding:0px 0em;border: 0; margin: 0;font-size:200%'>[[</div>");
            var endInsert = jQuery( "<div class='ultralink-insert ultralink-ignore' style='vertical-align:middle;display:inline-block;font-weight:normal;font-size:small; color: #888;padding:0px 0em;border: 0; margin: 0;font-size:200%'>]]</div>");
            var startLabel = jQuery( "<div style='font-size:80%;position:absolute;top:100px;left:0px' class='ultralink-tooltip ultralink-ignore;text-align:center'><div style='background-color:#000;color:#fff;padding:0px 1em; border-radius:1em'>linked-range start</div><div style='text-align:center;color:#000;line-height:70%;font-size:200%'>▼</div></div>" );
            var endLabel = jQuery( "<div style='font-size:80%;position:absolute;top:100px;left:0px' class='ultralink-tooltip ultralink-ignore;text-align:center'><div style='text-align:center;color:#000;line-height:50%;font-size:200%'>▲</div><div style='background-color:#000;color:#fff;padding:0px 1em;border-radius:1em;'>linked-range end</div></div>" );
            jQuery('body').append( startLabel );
            jQuery('body').append( endLabel );
            insertAtOffset( jQuery('#'+id).get(0), range[0], startInsert.get(0) );
            insertAtOffset( jQuery('#'+id).get(0), range[1], endInsert.get(0) );
            var startPos = startInsert.offset().top;
            var windowHeight = jQuery(window).height();
            var targetWindowOffset = windowHeight*0.3;
            if( startPos > targetWindowOffset ) {
               jQuery(window).scrollTop( startPos-targetWindowOffset );
            }
            startLabel.hide();
            endLabel.hide();


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
      }
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





   // initialise selection capture
   var url = jQuery( "link[rel='canonical']" ).attr( 'href' );

   // override the url for debugging purposes, not appropriate in final version. 
   url = window.location.href.replace( /#.*$/, '' );

   // this is the actual article in the page that the reference looks at, ignoring the outer template which may change over time
   var context = jQuery( ".post.full" );

   var popup = jQuery("<div style='position: fixed; bottom:5%; left: 5%; font-size: 120%; padding: 1em; width:90%;'></div>" );
   popup.hide();
   var tabs = jQuery("<div style='margin-left:1em;'></div>");
   var closeTab = jQuery( "<div title='Close' style='float:right; font-size:80%; border-top-left-radius: 0.5em; border-top-right-radius:0.5em;cursor:pointer;margin-right:1.5em; display:inline-block;padding:2px 0.5em; position:relative;top:2px;border:solid 2px black; background-color: #eee'>X</div>" );
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
   jQuery('body').append(popup);
   // don't hide the popup when we click inside it
   popup.mouseup( function() { return false; } );

   jQuery('body').mouseup( function() {
      popup.hide();
      return true; // propagate
   });
   context.mouseup( function() {
      jQuery('.ultralink-ignore').hide();
      var selection = window.getSelection();
                                
      var fromOff = charOffset( context.get(0), selection.anchorNode) 
      var toOff = charOffset( context.get(0), selection.focusNode);
      var text = selection.toString();
      var title = jQuery(document).prop('title');

      jQuery('.ultralink-ignore').show();

      if( fromOff == -1 || toOff == -1 ) {
         // out of scope
         return true; // propagate event
      }
      var fromChar = fromOff + selection.anchorOffset;
      var toChar = toOff + selection.focusOffset;
      if( fromChar == toChar ) {
         // right now this is only fussed with ranges, not points in the text, so a zero-character selection should be ignored 
         return true; // propagate event
      }

      if( isNaN(fromChar) || isNaN(toChar) ) {
         // out of scope
         return true; // propagate event
      }
     
      // clean up if user selected backwards 
      if( fromChar > toChar ) {
         var tmp = fromChar;
         fromChar = toChar;
         toChar = tmp;
      }

      var link = url+'#'+context.attr('id')+";chars="+fromChar+"-"+toChar;
      blocksByName['Link'].html( "<p>To link directly to this range use:</p><p><tt><a href='"+link+"'>"+link+"</a></tt></p>" );

      var sourceLink = jQuery( "<a>Source</a>" );
      sourceLink.attr("href",link).attr("title",title);
      var cite = jQuery("<cite></cite>").append(sourceLink);
      blocksByName['Short HTML'].html( '' ).append( jQuery( '<textarea style="height:10em;width:100%;font-family:monospace">' ).val( "<q>"+trimText( text, 50 )+"</q> - "+toHTML(cite) ) );

      var sourceLink2 = jQuery( "<a></a>" );
      sourceLink2.attr("href",link).text(title+", Character range "+fromChar+"-"+toChar );
      var cite2 = jQuery("<cite></cite>").append(sourceLink2);
      blocksByName['Long HTML'].html( '' ).append( jQuery( '<textarea style="height:10em;width:100%;font-family:monospace">' ).val( "<blockquote>\""+text+"\"</blockquote>\n<div>- "+toHTML(cite2)+"</div>" ) );

      blocksByName['About'].html('<p>Ultralink.js was written by <a href="http://www.ecs.soton.ac.uk/people/cjg">Christopher Guuteridge</a> for the <a href="http://doug-50.info/">Doug@50</a> project.</p><p>It\'s available under the GPL license, at <a href="https://github.com/cgutteridge/ultralink/">GitHub</a>.</p>' );

      var tweet = "\""+trimText( text, 240 )+"\" - "+link;
      var twitLink = "https://twitter.com/intent/tweet?text="+encodeURIComponent(tweet)+"&source=webclient";
      blocksByName['Twitter'].html("<p><a href='"+twitLink+"'>Tweet this</a> (you will have a chance to edit before tweeting)</p>" );

      var faceLink = "https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(link);
      blocksByName['Facebook'].html("<p><a href='"+faceLink+"'>Share this on the Facebooks</a> (you will have a chance to edit before posting)</p>" );

      popup.show();
   //var tabNames = [ 'Link','Short HTML','Long HTML','Twitter','Facebook' ];

         
      return false; // don't propagate event
   });


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


