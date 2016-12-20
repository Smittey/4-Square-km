/**
 * @author Colin Deepe.

 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 *
 */
$(document).ready(function() {

    console.log('sidebar.js Geladen!!');

    var $sidebar = $.extend($('#sidebar'), {
        timeoutId: null,
        visible: false,
        delay: 10,
        delayLeave: 10,
        init: function() {
            $.each($(this).find('.contents').find('.content'), function(index, content) {
                if ($(content).html().trim().length > 0) {
                    $('#sidebar').find('.icon[data-content="' + $(content).data('content') + '"]').removeClass('hide');
                }
            });
        },
        show: function() {
            if (!$(this).hasClass('open')) {
                $(this).addClass('open');

                this.visible = true;
            }
        },
        hide: function() {
            if ($(this).hasClass('open')) {
                $(this).removeClass('open');
                var sidebar = this;
                window.setTimeout(function() {
                    sidebar.visible = false;
                    sidebar.reset();
                }, this.getTransitionDurationMs());
            }
        },
        mouseover: function(event) {
            var relTarg = event.relatedTarget || event.fromElement;
            if ($(relTarg).attr('id') === 'sidebar' && !this.visible) {
                $sidebar.mouseenter(event);
            }
        },
        mouseenter: function(event) {
            var $icon = null;
            if ($(event.target).hasClass('icon')) {
                $icon = event.target;
            } else if ($(event.target).parent('.icon').length) {
                $icon = $(event.target).parent('.icon');
            }
            if ($icon !== null) {
                if (!this.timeoutId) {
                    var sidebar = this;
                    this.timeoutId = window.setTimeout(function() {
                        sidebar.timeoutId = null;
                        sidebar.reset();
                        sidebar.switchContent($icon);
                        sidebar.show();
                    }, this.delay);
                }
            }
        },
        mouseleave: function() {
            if (this.timeoutId) {
                window.clearTimeout(this.timeoutId);
                this.timeoutId = null;
            } else {
                var sidebar = this;
                setTimeout(function() {
                    sidebar.hide();
                }, this.delayLeave);

            }
        },
        reset: function() {
            // RESET DER ANDEREN TABS
            var $icons = $(this).find('.icon');
            var $contents = $(this).find('.content');

            $.each($icons, function(key, icon) {
                if ($(icon).hasClass('active')) {
                    $(icon).removeClass('active');
                }
            });

            $.each($contents, function(key, content) {
                if ($(content).hasClass('show')) {
                    $(content).removeClass('show');
                }
                if (!$(content).hasClass('hide')) {
                    $(content).addClass('hide');
                }
            });
        },
        switchContent: function(icon) {
            this.reset();
            // AKTUELLEN TAB ALS AKTIV MARKIEREN
            $(icon).addClass('active');
            $(icon).parents('#sidebar').find('.content[data-content="' + $(icon).data('content') + '"]').addClass('show');
        },
        getTransitionDurationMs: function() {
            var cssSec = $(this).css('transition-duration');

            var sec = cssSec.substr(0, (cssSec.length - 1));
            var ms = sec * 1000;

            return ms;
        },
        enable: function() {
            $(this).addClass('in');
        },
        disable: function() {
            $(this).removeClass('in');
        },
    });

    // Sidebar initialisieren
    $sidebar.init();
    $sidebar.enable();

    // SIDEBAR
    // ---------------------------------------------------------------------------- //
    $("#sidebar").mouseenter(function(event) {
        $sidebar.mouseenter(event);
    }).mouseleave(function() {
        $sidebar.mouseleave();
    });

    $('#sidebar').mouseover(function(event) {
        $sidebar.mouseover(event);
    });

    $('#sidebar > .icons > .icon').on('mouseover touchstart', function(event) {
        if ($sidebar.visible) {
            $sidebar.switchContent(this);
        }
        if (event.type === 'touchstart') {
            $sidebar.mouseenter(event);
        }
    });
});
