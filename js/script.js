/* global jQuery, $, interact */
jQuery(document).ready(function() {

    var toggle_html='<span class="toggle"></span>';

    // attach the plugin to an element
    $('#wrapper').gitdown( {    'title': 'EntwinED',
                                'content': 'README.md',
                                'callback': main
    } );
    var $gd = $('#wrapper').data('gitdown');

    function main() {
        position_sections();
        configure_sections();
        notize();
        register_events();
        render_connections();
    }

    function position_sections() {
        var docwidth = $(document).width();
        var $sections = $('.section *');
        if ( $sections.length > 0 ) {
            // find attributes and position section
            $sections.children().each(function() {
                var comments = $(this).getComments();
                if ( comments.length > 0 ) {
                    // comment found, extract attributes
                    var text = comments[0];
                    var s = text.substr(text.indexOf("{") + 1).split('}')[0];
                    var pairs = s.split(',');
                    for ( var i = 0; i < pairs.length; i++ ) {
                        var key = pairs[i].split(':')[0];
                        var value = pairs[i].split(':')[1];
                        $(this).closest('.section').css( key, value );
                    }
                }
            });
        }

        // iterate over sections and position elements if they're at 0,0
        var counter = 0;
        var left = 0;
        var top = 0;
        $('.section').each(function() {
            var position = $(this).position();
            if ( position.top === 0 && position.left === 0 ) {
                // set default values for section positions
                if ( counter > 0 ) {
                    var prev_width = $(this).prev('.section').width();
                    // increment height if width of document is surpassed
                    if ( left > docwidth - prev_width * 2 ) {
                        left = 0;
                        top += $(this).prev('.section').height();
                    } else {
                        left += prev_width;
                    }
                    $(this).css( {top: top, left: left} );
                }
                counter += 1;
            }
        });
    }

    function configure_sections() {
        $('.section').each(function() {
            
            var $s = $(this);

            // quickly add a draggable class for drag method
            $s.addClass('draggable');

            // set initial position values
            var x = $s.css('left').slice( 0, -2 );
            var y = $s.css('top').slice( 0, -2 );
            $s.attr('data-x', x);
            $s.attr('data-y', y);
        });
    }

    function notize() {
        $('.section').each(function() {
            var $s = $(this);
            var name = $s.find('a.handle').attr('name');
            // check if any anchor links reference this setion and add respective classes if so
            $(".content a[href^=#]").each(function() {
                var $link = $(this);
                var href = $link.attr('href').substr(1);
                if ( href === name ) {
                    // this is a note, so set boolean for later
                    var classes = ' note note-' + href;
                    $s.addClass(classes);
                    // add note class to anchor link too
                    $link.addClass( 'n-' + href );
                    $link.addClass( 'n-reference' );
                    $link.closest('.section').addClass('reference');
                }
            });
        });
    }

    function render_connections() {
        if ( $('connection').length > 0 ) {
            $('.n-reference').connections('remove');
        }
        $( '.section .content .n-reference' ).each(function() {
            var classes = $(this).attr('class');
            // get note's referent
            var to = classes.split('n-reference')[0].trim();
            to = to.substr(2);
            $(this).connections({ to: '.note-' + to});
        });
    }

    function open_export() {

        // open new window
        var xWindow = window.open('export');
        var content = '<pre>';
        var newline = '\n'; //'<br/>';

        // iterate over all sections to get content
        $('.section').each(function() {

            // get content
            content += toMarkdown( $(this).html() );

            //get section attributes
            var attr = '';
            var px = 'px';
            attr += 'left:' + $(this).position().left + px;
            attr += ',top:' + $(this).position().top + px;
            attr += ',width:' + $(this).width() + px;
            attr += ',height:' + $(this).height() + px;
            
            content += newline + newline;
            content += '&lt;!-- {' + attr + '} -->';
            content += newline + newline;
        });
        content += newline + '</pre>';
        xWindow.document.write( content.replace(/\n\n/g, '<br/>') );
    }
    
    function render_editor(id) {
        // remove any existing editors first
        $('.editor').remove();

        var $s = $('.section#' + id);
        var left = $s.position().left;
        var top = $s.position().top;
        var width = $s.width();
        var height = $s.height();
        var content = toMarkdown( $s.find('.content').html() );
        
        var html = '<div class="editor" data-section="' + id + '">';
        html += '<pre class="md">';
        html += content;
        html += '</pre>';
        html += '<textarea class="editor-content" />';
        html += '</div>';
        $('.inner').append(html);
        var $editor = $('.editor');
        //$editor.width( width );
        $editor.css( { top: top, left: left + width + 50,
        width: width, height: height } );
        $('.editor-content').val( $('.md').text() );

        // event handler for editor content changes
        $('.editor-content').change(function() {
            content = $('.editor-content').val();
            var container = '.section#' + id + ' .content';
            $gd.render( content, container );
            notize();
            render_connections();
        });
        $('.editor-content').keyup(function() {
            content = $('.editor-content').val();
            var container = '.section#' + id + ' .content';
            $gd.render( content, container );
            notize();
            render_connections();
        });

        // hide the editor if anything else is clicked
        $( '.inner' ).on('click', function (e) {
            if ( $(e.target).closest(".section").length === 0 ) {
                if ( $(e.target).closest(".editor").length === 0 ) {
                    $('.editor' ).remove();
                }
            }
        });

        $('.editor .md').remove();
        
    }

    function register_events() {
        // Key events
        $(document).keyup(function(e) {
            if( e.which == 88 ) {
                // x for export
                open_export();
            }
        });

        $('.content').click(function(){
            var content = '';
            var id = $(this).parent().attr('id');
            render_editor(id);
        });

        $('.n-reference').mouseenter( function(){
            var bg = $(this).css('background');
            var href = $(this).attr('href');
            $(href).css( 'background', bg );
        });
        $('.n-reference').mouseleave( function(){
            var href = $(this).attr('href');
            var bg = $('.section').css('background');
            $(href).css( 'background', bg );
        });

        // target elements with the "draggable" class
        interact('.draggable').allowFrom('.handle-heading')
            .draggable({
                // enable inertial throwing
                inertia: false,
                // keep the element within the area of it's parent
                restrict: {
                restriction: 'self',
                endOnly: true,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            // enable autoScroll
            autoScroll: true,

            // call this function on every dragmove event
            onmove: dragMoveListener,
            // call this function on every dragend event
            onend: function (event) {
            }
        });

        interact('.section').resizable({
            preserveAspectRatio: false,
            edges: { left: true, right: true, bottom: true, top: true }
            })
            .on('resizemove', function (event) {
            var target = event.target,
                x = (parseFloat(target.getAttribute('data-x')) || 0),
                y = (parseFloat(target.getAttribute('data-y')) || 0);

            // update the element's style
            target.style.width  = event.rect.width + 'px';
            target.style.height = event.rect.height + 'px';

            // translate when resizing from top or left edges
            x += event.deltaRect.left;
            y += event.deltaRect.top;

            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
            render_connections();
        });
    }

    function dragMoveListener (event) {
        var target = event.target,
        // keep the dragged position in the data-x/data-y attributes
        x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
        y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        $(target).css('top', y + 'px');
        $(target).css('left', x + 'px');

        // update the position attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
        render_connections();
    }

});
