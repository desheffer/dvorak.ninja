(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ScoreBox = function(score) {
        var modes = window.WPM.gameModes;

        this.modeChanged = function(e) {
            if (e.mode !== modes.COMPLETE) {
                score.css('visibility', 'hidden');
                score.find('.min .value').text('??');
                score.find('.min5 .value').text('??');
                score.find('.max .value').text('??');
                score.find('.max5 .value').text('??');
            }
        };

        this.scoreChanged = function(e) {
            if (!e.complete) {
                return;
            }

            var min, max, min5, max5;
            var cpsToWpm = 60 / 5;

            for (var i in e.times) {
                var chars = 0;
                var chars5 = 0;
                var duration = 0;

                for (var j = i; j >= 0; j--) {
                    duration += e.times[j].duration;

                    if (duration <= 1000) {
                        chars++;
                    }

                    if (duration <= 5000) {
                        chars5++;
                    } else {
                        break;
                    }
                }

                if (duration >= 1000) {
                    min = Math.min(min || Infinity, chars * cpsToWpm);
                    max = Math.max(max || 0, chars * cpsToWpm);
                }

                if (duration >= 5000) {
                    min5 = Math.min(min5 || Infinity, chars5 * cpsToWpm / 5);
                    max5 = Math.max(max5 || 0, chars5 * cpsToWpm / 5);
                }
            }

            score.find('.min .value').text(min !== undefined ? ~~min : '??');
            score.find('.min5 .value').text(min5 !== undefined ? ~~min5 : '??');
            score.find('.max .value').text(max !== undefined ? ~~max : '??');
            score.find('.max5 .value').text(max5 !== undefined ? ~~max5 : '??');
            score.css('visibility', 'visible');
        };
    };
})();
