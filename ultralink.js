
jQuery(document).ready(function(){

/*
   for( var i =0;i<100;++i ) {
            insertAtOffset( jQuery('#post-content-1685').get(0), i, makeInsert('blue',i) );
   }
*/
   // detect fragment
   if( window.location.hash ) {
      var fragment = window.location.hash.replace(/^#/,'');
      if( fragment.match( /;/ ) ) {
         var l1 = fragment.split( /;/ );
         var id = l1[0];
         var l2 = l1[1].split(/=/);
         if( l2[0] == 'chars' ) {
            var range = l2[1].split( /-/ );
            insertAtOffset( jQuery('#'+id).get(0), range[0], makeInsert('green','start') );
            insertAtOffset( jQuery('#'+id).get(0), range[1], makeInsert('red','end') );
         }
      }
   }

   /* creates an insert to be placed in HTML but ignored by our "character counting" tools. */
   function makeInsert( col, text ) {
      return jQuery( "<div class='ultralink-insert ultralink-ignore' style='display:inline-block;font-weight:normal;font-size:small; color: "+col+";padding:0px 0.25em;border: solid 2px "+col+"; margin: 0 0em;background-color:#000'>"+text+"</div>").get(0);
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


   var popup = jQuery("<div style='position: fixed; bottom:5%; left: 5%; font-size: 120%; padding: 1em;  width:90%; border:solid 2px black; background-color: #ccc'></div>" ).hide();
   jQuery('body').append(popup);
   // don't hide the popup when we click inside it
   popup.mouseup( function() { return false; } );

   jQuery('body').mouseup( function() {
      popup.hide();
      return true; // propagate
   });
   context.mouseup( function() {
      var selection = window.getSelection();
                                
      var fromOff = charOffset( context.get(0), selection.anchorNode) 
      var toOff = charOffset( context.get(0), selection.focusNode);
      if( fromOff == -1 || toOff == -1 ) {
         // out of scope
         //return true; // propagate event
      }
      var fromChar = fromOff + selection.anchorOffset;
      var toChar = toOff + selection.focusOffset;
      if( fromChar == toChar ) {
         // right now this is only fussed with ranges, not points in the text, so a zero-character selection should be ignored 
         return true; // propagate event
      }
     
      // clean up if user selected backwards 
      if( fromChar > toChar ) {
         var tmp = fromChar;
         fromChar = toChar;
         toChar = tmp;
      }

      var link = url+'#'+context.attr('id')+";chars="+fromChar+"-"+toChar;
      popup.html( link );
      popup.show();
         
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
      alert( "Error, this code should not have been reached!" );
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


