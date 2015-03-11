(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Input = function(document, controller, mapQwertyToDvorakCheckbox, keyboardMapper) {
        document.on('keydown', function(e) {
            // Ignore keyboard shortcuts
            if (e.altKey || e.ctrlKey || e.metaKey) {
                return true;
            }

            // Backspace
            if (e.keyCode === 8) {
                controller.backspaceTyped();
                return false;
            }
        });

        document.on('keypress', function(e) {
            // Normal keys
            var letter = keyboardMapper.fromCharCode(e.charCode);
            if (letter) {
                controller.letterTyped(letter);
                return false;
            }
        });

        mapQwertyToDvorakCheckbox.on('change', function() {
            var mapName = $(this).is(':checked') ? 'qwertyToDvorak' : null;
            keyboardMapper.changeMap(mapName);

            $(this).blur();
            return false;
        });
    };
})($);
