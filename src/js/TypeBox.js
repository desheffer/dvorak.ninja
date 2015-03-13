(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type, stats) {
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

            if (e.mode === modes.PLAYING) {
                stats.find('.wpm .value').text(0);
                stats.find('.wpm-meter meter').val(0);
                stats.find('.characters .value').text(0);
                stats.find('.words .value').text(0);
                stats.find('.time .value').text('0:00');
            } else {
                stats.find('.wpm .value').text('--');
                stats.find('.wpm-meter meter').val(0);
                stats.find('.characters .value').text('--');
                stats.find('.words .value').text('--');
                stats.find('.time .value').text('-:--');
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
            var time;
            if (e.seconds !== undefined) {
                var min = ~~(e.seconds / 60);
                var sec = ~~(e.seconds - min * 60);
                time = min + ':' + (sec < 10 ? '0' + sec : sec);
            }

            stats.find('.wpm .value').text(~~e.wpm);
            stats.find('.wpm-meter meter').val(isFinite(e.wpm) ? e.wpm : 0);
            stats.find('.characters .value').text(e.characters);
            stats.find('.words .value').text(~~e.words);
            stats.find('.time .value').text(time);
        };
    };
})();
