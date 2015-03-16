(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.StatsBox = function(stats) {
        var modes = window.WPM.gameModes;

        this.modeChanged = function(e) {
            if (e.mode === modes.COUNTDOWN || e.mode === modes.IDLE) {
                stats.find('.wpm .value').text('---');
                stats.find('.wpm-meter meter').val(0);
                stats.find('.accuracy .value').text('---%');
                stats.find('.characters .value').text('---');
                stats.find('.time .value').text('-:--');
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
            stats.find('.accuracy .value').text(~~e.accuracy + '%');
            stats.find('.characters .value').text(~~e.characters);
            stats.find('.time .value').text(time);
        };
    };
})();
