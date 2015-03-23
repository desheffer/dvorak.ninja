(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ScoreBox = function(score) {
        var modes = window.WPM.gameModes;

        function minAndMaxWpm(times) {
            var wpm = {};
            var cpsToWpm = 60 / 5;

            for (var i in times) {
                var chars = 0;
                var chars5 = 0;
                var duration = 0;

                for (var j = i; j >= 0; j--) {
                    duration += times[j].duration;

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
                    wpm.min = Math.min(wpm.min || Infinity, chars * cpsToWpm);
                    wpm.max = Math.max(wpm.max || 0, chars * cpsToWpm);
                }

                if (duration >= 5000) {
                    wpm.min5 = Math.min(wpm.min5 || Infinity, chars5 * cpsToWpm / 5);
                    wpm.max5 = Math.max(wpm.max5 || 0, chars5 * cpsToWpm / 5);
                }
            }

            return wpm;
        }

        function missedLettersByFrequency(times) {
            var letters = {};

            for (var i in times) {
                var letter = times[i].letter;

                if (letters[letter] === undefined) {
                    letters[letter] = {
                        letter: letter,
                        count: 0,
                        duration: 0,
                        average: 0,
                    };
                }

                letters[letter].count++;
                letters[letter].duration += times[i].duration;
                letters[letter].average = letters[letter].duration / letters[letter].count;
            }

            var lettersArr = [];
            for (letter in letters) {
                lettersArr.push(letter);
            }

            lettersArr.sort(function(a, b) {
                return letters[b].average - letters[a].average;
            });

            return lettersArr;
        }

        this.modeChanged = function(e) {
            if (e.mode !== modes.COMPLETE) {
                score.css('visibility', 'hidden');
                score.find('.min .value1').text('--');
                score.find('.min .value5').text('--');
                score.find('.max .value1').text('--');
                score.find('.max .value5').text('--');
                score.find('.missed .value').text('- - - - -');
            }
        };

        this.scoreChanged = function(e) {
            if (!e.complete) {
                return;
            }

            var missed = missedLettersByFrequency(e.times);
            var wpm = minAndMaxWpm(e.times);

            score.find('.min .value1').text(wpm.min !== undefined ? ~~wpm.min : '??');
            score.find('.min .value5').text(wpm.min5 !== undefined ? ~~wpm.min5 : '??');
            score.find('.max .value1').text(wpm.max !== undefined ? ~~wpm.max : '??');
            score.find('.max .value5').text(wpm.max5 !== undefined ? ~~wpm.max5 : '??');
            score.find('.missed .value').text(missed.splice(0, 5).join(' '));
            score.css('visibility', 'visible');
        };
    };
})();
