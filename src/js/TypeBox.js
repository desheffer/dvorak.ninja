(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type) {
        var modes = window.WPM.gameModes;

        this.modeChanged = function(e) {
            if (e.mode === modes.IDLE) {
                type.html('<div class="overlay">Select a paragraph from above</div>');
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
            var remaining = e.notYetTyped.substr(e.incorrectlyTyped.length);
            type.find('.correct').text(e.correctlyTyped);
            type.find('.incorrect').text(e.incorrectlyTyped);
            type.find('.remaining').text(remaining);
        };

        this.scoreChanged = function(e) {
            if (!e.complete) {
                return;
            }

            type.html('<span class="results"></span>');
            var results = type.find('.results');

            var min, max;
            min = max = e.times[0].duration;

            for (var time in e.times) {
                min = Math.min(min, e.times[time].duration);
                max = Math.max(max, e.times[time].duration);
            }

            for (time in e.times) {
                var percent = (e.times[time].duration - min) / (max - min);
                $('<span class="letter">')
                    .text(e.times[time].letter)
                    .css('background-color', 'rgba(217, 83, 79, ' + percent + ')')
                    .appendTo(results);
            }
        };
    };
})();
