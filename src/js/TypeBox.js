(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type) {
        var modes = window.WPM.gameModes;

        function htmlEscape(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\s/g, '&nbsp;');
        }

        this.modeChanged = function(e) {
            if (e.mode === modes.IDLE) {
                type.html('<div class="overlay">Select a word set from above</div>');
            } else if (e.mode === modes.COUNTDOWN) {
                type.html('<div class="overlay"></div>');
            } else if (e.mode === modes.PLAYING) {
                type.html(
                    '<span class="correct"></span>' +
                    '<span class="incorrect"></span>' +
                    '<span class="cursor"></span>' +
                    '<span class="remaining"></span>'
                );
            }

            type.toggleClass('completed', e.mode === modes.COMPLETE);
        };

        this.countdown = function(e) {
            type.find('.overlay').text('- ' + Math.ceil(e.countdown) + ' -');
        };

        this.textChanged = function(e) {
            var i;

            // Correct text is everything that has been typed correctly.  Line
            // breaks are added after spaces.
            var correct = '';
            for (i = 0; i < e.correctlyTyped.length; i++) {
                correct += htmlEscape(e.correctlyTyped[i]);
                if (e.correctlyTyped[i] === ' ') {
                    correct += '<wbr>';
                }
            }

            // Incorrect text is anything that has been typed incorrectly.
            // Line breaks are transposed from the spaces in the intended word
            // list.
            var incorrect = '';
            for (i = 0; i < e.incorrectlyTyped.length; i++) {
                incorrect += htmlEscape(e.incorrectlyTyped[i]);
                if (i >= e.notYetTyped.length || e.notYetTyped[i] === ' ') {
                    incorrect += '<wbr>';
                }
            }

            // Remaining text is anything left to be typed minus errors.  Line
            // breaks are added after spaces.
            var remaining = '';
            for (i = e.incorrectlyTyped.length; i < e.notYetTyped.length; i++) {
                remaining += htmlEscape(e.notYetTyped[i]);
                if (e.notYetTyped[i] === ' ') {
                    remaining += '<wbr>';
                }
            }

            type.find('.correct').html(correct);
            type.find('.incorrect').html(incorrect);
            type.find('.remaining').html(remaining);
        };

        this.scoreChanged = function(e) {
            if (!e.complete) {
                return;
            }

            var min = Infinity;
            var max = 500;

            for (var i in e.times) {
                min = Math.min(min, e.times[i].duration);
                max = Math.max(max, e.times[i].duration);
            }

            type.html('<span class="results"></span>');
            var results = type.find('.results');

            for (i in e.times) {
                var percent = (e.times[i].duration - min) / (max - min);
                $('<span class="letter">')
                    .text(e.times[i].letter)
                    .css('background-color', 'rgba(217, 83, 79, ' + percent + ')')
                    .appendTo(results);
            }
        };
    };
})();
