(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.StatsBox = function(stats) {
        var modes = window.WPM.gameModes;

        this.modeChanged = function(e) {
            if (e.mode === modes.COUNTDOWN || e.mode === modes.IDLE) {
                stats.find('.wpm .value').text('--');
                stats.find('.wpm-meter meter').val(0);
                stats.find('.characters .value').text('--');
                stats.find('.words .value').text('--');
                stats.find('.time .value').text('-:--');
            } else if (e.mode === modes.PLAYING) {
                stats.find('.wpm .value').text(0);
                stats.find('.wpm-meter meter').val(0);
                stats.find('.characters .value').text(0);
                stats.find('.words .value').text(0);
                stats.find('.time .value').text('0:00');
            }
        };

        this.scoreChanged = function(e) {
            var time;
            if (e.seconds !== undefined) {
                var min = ~~(e.seconds / 60);
                var sec = ~~(e.seconds - min * 60);
                time = min + ':' + ('0' + sec).substr(-2);
            }

            stats.find('.wpm .value').text(~~e.wpm);
            stats.find('.wpm-meter meter').val(isFinite(e.wpm) ? e.wpm : 0);
            stats.find('.characters .value').text(e.characters);
            stats.find('.words .value').text(~~e.words);
            stats.find('.time .value').text(time);
        };
    };
})();
