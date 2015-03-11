(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Controller = function(clock, typeBox, keyboardLayoutRenderer) {
        var wordsToType;
        var correctlyTyped;
        var incorrectlyTyped;
        var notYetTyped;
        var startTime;

        var isActive = false;
        var timer;

        var histogram;
        var incorrectCount;

        function calculateHistogram() {
            var endTime = clock.time();

            var avgHistogram = [];
            for (var i = ~~startTime; i < endTime; i++) {
                var chars = 0;
                var count = 5;
                for (var j = i - count + 1; j <= i; j++) {
                    chars += histogram[j] || 0;
                }

                // WPM = CPS * 60 sec/min * 1/5 words/char, averaged over count
                var wpm = chars * 60 / 5 / count;
                avgHistogram.push(wpm);
            }

            return avgHistogram;
        }

        function tick() {
            var now = clock.time();

            isActive = (startTime !== undefined && now > startTime && notYetTyped !== undefined && notYetTyped !== '');
            var isCountdown = (startTime !== undefined && now < startTime);
            var isCompleted = (!isCountdown && notYetTyped === '');

            if (isCountdown) {
                typeBox.renderCountdown(startTime - now);
            } else if (isActive) {
                typeBox.renderProgress(correctlyTyped, incorrectlyTyped, notYetTyped, now - startTime);
            } else if (isCompleted) {
                typeBox.renderCompleted(correctlyTyped, now - startTime, calculateHistogram(), incorrectCount);
            } else {
                typeBox.renderInitial();
            }

            if (isActive && incorrectlyTyped.length === 0) {
                keyboardLayoutRenderer.renderNextKey(notYetTyped[0]);
            } else {
                keyboardLayoutRenderer.clearNextKey();
            }

            clearInterval(timer);
            timer = undefined;

            if (isCountdown || isActive) {
                timer = setTimeout(tick, 100);
            }
        }

        this.start = function(words, timeout) {
            if (timeout === undefined) {
                timeout = 0;
            }

            wordsToType = notYetTyped = words;
            correctlyTyped = incorrectlyTyped = '';
            startTime = clock.time() + timeout;

            histogram = {};
            incorrectCount = 0;

            tick();
        };

        this.letterTyped = function(letter) {
            if (!isActive) {
                return;
            }

            var expected = notYetTyped.substr(0, 1);

            if (incorrectlyTyped.length === 0 && letter === expected) {
                // Add a correct letter
                correctlyTyped = correctlyTyped + letter;
                notYetTyped = notYetTyped.substr(1);

                // Record it in the histogram
                var time = ~~clock.time();
                histogram[time] = (histogram[time] || 0) + 1;
            } else if (incorrectlyTyped.length <= 10) {
                // Add an incorrect letter
                incorrectlyTyped = incorrectlyTyped + letter;
                incorrectCount++;
            }

            tick();
        };

        this.backspaceTyped = function() {
            if (!isActive) {
                return;
            }

            if (incorrectlyTyped.length > 0) {
                // Remove an incorrect letter
                incorrectlyTyped = incorrectlyTyped.substr(0, incorrectlyTyped.length - 1);
            } else if (correctlyTyped.length > 0) {
                // Remove a correct letter
                notYetTyped = correctlyTyped[correctlyTyped.length - 1] + notYetTyped;
                correctlyTyped = correctlyTyped.substr(0, correctlyTyped.length - 1);

                // Record it in the histogram
                var time = ~~clock.time();
                histogram[time] = (histogram[time] || 0) - 1;
            }

            tick();
        };

        tick();
    };
})();
