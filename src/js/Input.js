(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Input = function(document, keyboardMapper) {
        var that = this;

        document.on('keydown', function(e) {
            // Ignore keyboard shortcuts
            if (e.altKey || e.ctrlKey || e.metaKey) {
                return true;
            }

            // Backspace
            if (e.keyCode === 8) {
                $(that).trigger({
                    type: 'backspacepress.wpm',
                });

                return false;
            }
        });

        document.on('keypress', function(e) {
            // Normal keys
            var letter = keyboardMapper.fromCharCode(e.charCode);
            if (letter) {
                $(that).trigger({
                    type: 'letterpress.wpm',
                    letter: letter,
                });

                return false;
            }
        });
    };
})(jQuery);
