
jQuery(document).ready(function(){
   var url = jQuery( "link[rel='canonical']" ).attr( 'href' );
   var context = jQuery( ".post.full" );
   context.css( 'border','dotted 1px purple' );
   //alert( url );
   context.mouseup( function() {
        var selection = window.getSelection();
	
	var fromChar = charOffset( context.get(0), selection.anchorNode);
	alert( fromChar+"+"+selection.anchorOffset );
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


