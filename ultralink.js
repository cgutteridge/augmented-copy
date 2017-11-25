
jQuery(document).ready(function(){

   // detect fragment
   if( window.location.hash ) {
      var fragment = window.location.hash.replace(/^#/,'');
      if( fragment.match( /;/ ) ) {
         var l1 = fragment.split( /;/ );
         var id = l1[0];
         var l2 = l1[1].split(/=/);
         if( l2[0] == 'chars' ) {
            var range = l2[1].split( /-/ );
            insertAtOffset( jQuery('#'+id).get(0), range[0], jQuery("<div class='ultralink-insert' style='display:inline-block;width:10px;height:10px; background-color: green; margin: 0 0em;'></div>").get(0));
            insertAtOffset( jQuery('#'+id).get(0), range[1], jQuery("<div class='ultralink-insert' style='display:inline-block;width:10px;height:10px; background-color: red; margin: 0 0em;'></div>").get(0));
         }
      }
   }
   // assumes DOM nodes not jQuery
   function insertAtOffset(container, offset, insert ) {

      var kids = container.childNodes;
      for( var i=0; i<kids.length; i++ ) {
        var kid = kids[i];
        console.log(container,i,kid,offset);
        if( offset == 0 ) {
          container.insertBefore(insert,kid);
          return;
        }

        var kidLength = textLength(kid);
        if( kidLength > offset ) {
           // the offset is inside this 
           if( kid.nodeName == "#text" ) {
              container.insertBefore(insert,kid);
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
   url = "http://lemur.ecs.soton.ac.uk/~cjg/link/";
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
         return true; // propagate
      }
      var fromChar = fromOff + selection.anchorOffset;
      var toChar = toOff + selection.focusOffset;
      if( fromChar > toChar ) {
         var tmp = fromChar;
         fromChar = toChar;
         toChar = tmp;
      }

      var link = url+'#'+context.attr('id')+";chars="+fromChar+"-"+toChar;
      popup.html( link );
      popup.show();
         
      return false; // don't propagate
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
        //console.log( "KID:"+i+" -- "+kid.nodeName, kid );
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
      if( el.nodeName == "#text" ) {
        var text = el.textContent;
        //console.log( "TEXT: "+text );
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


