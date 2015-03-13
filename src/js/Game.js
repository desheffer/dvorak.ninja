(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Game = function(clock, typeBox, keyboardLayoutRenderer) {
        var that = this;

        var modes = this.modes = {
            IDLE: 0,
            COUNTDOWN: 1,
            PLAYING: 2,
            COMPLETE: 3,
        };

        var mode = modes.IDLE;
        var startTime;
        var timer;

        var wordsToType;
        var correctlyTyped;
        var incorrectlyTyped;
        var notYetTyped;
        var incorrectCount;

        function updateMode() {
            var now = clock.time();
            var newMode = modes.IDLE;

            if (startTime !== undefined && now < startTime) {
                newMode = modes.COUNTDOWN;
            } else if (startTime !== undefined && now > startTime && notYetTyped !== undefined && notYetTyped.length > 0) {
                newMode = modes.PLAYING;
            } else if (notYetTyped === '') {
                newMode = modes.COMPLETE;
            }

            if (newMode !== mode) {
                mode = newMode;

                $(that).trigger({
                    type: 'modechange.wpm',
                    mode: mode,
                });
            }
        }

        // @TODO: Remove
        function updateStatus() {
            var now = clock.time();

            if (mode === modes.COUNTDOWN) {
                typeBox.renderCountdown(startTime - now);
            } else if (mode === modes.PLAYING) {
                typeBox.renderProgress(correctlyTyped, incorrectlyTyped, notYetTyped, now - startTime);
            } else if (mode === modes.COMPLETE) {
                typeBox.renderCompleted(correctlyTyped, now - startTime, [], incorrectCount);
            } else if (mode === modes.IDLE) {
                typeBox.renderInitial();
            }

            if (mode === modes.PLAYING && incorrectlyTyped.length === 0) {
                keyboardLayoutRenderer.renderNextKey(notYetTyped[0]);
            } else {
                keyboardLayoutRenderer.clearNextKey();
            }
        }

        function tick() {
            clearInterval(timer);
            timer = undefined;

            updateMode();
            updateStatus();

            if (mode === modes.COUNTDOWN) {
                $(that).trigger({
                    type: 'countdown.wpm',
                    countdown: startTime - clock.time(),
                });
            }

            if (mode === modes.PLAYING || mode === modes.COMPLETE) {
                var seconds = clock.time() - startTime;
                var characters = correctlyTyped.length;
                var words = correctlyTyped.length / 5;
                var wpm = words / (seconds / 60);

                $(that).trigger({
                    type: 'score.wpm',
                    seconds: seconds,
                    characters: characters,
                    words: words,
                    wpm: wpm,
                });
            }

            if (mode === modes.COUNTDOWN || mode === modes.PLAYING) {
                timer = setTimeout(tick, 100);
            }
        }

        this.start = function(words, timeout) {
            if (timeout === undefined) {
                timeout = 0;
            }

            startTime = clock.time() + timeout;

            wordsToType = notYetTyped = words;
            correctlyTyped = incorrectlyTyped = '';
            incorrectCount = 0;

            tick();
        };

        this.letterTyped = function(letter) {
            if (mode !== modes.PLAYING) {
                return;
            }

            var expected = notYetTyped.substr(0, 1);

            if (incorrectlyTyped.length === 0 && letter === expected) {
                // Add a correct letter
                correctlyTyped = correctlyTyped + letter;
                notYetTyped = notYetTyped.substr(1);
            } else if (incorrectlyTyped.length <= 10) {
                // Add an incorrect letter
                incorrectlyTyped = incorrectlyTyped + letter;
                incorrectCount++;
            } else {
                return;
            }

            $(that).trigger({
                type: 'textchange.wpm',
                correctlyTyped: correctlyTyped,
                incorrectlyTyped: incorrectlyTyped,
                notYetTyped: notYetTyped,
                incorrectCount: incorrectCount,
                nextLetter: notYetTyped[0],
            });

            tick();
        };

        this.backspaceTyped = function() {
            if (mode !== modes.PLAYING) {
                return;
            }

            if (incorrectlyTyped.length > 0) {
                // Remove an incorrect letter
                incorrectlyTyped = incorrectlyTyped.substr(0, incorrectlyTyped.length - 1);
            } else if (correctlyTyped.length > 0) {
                // Remove a correct letter
                notYetTyped = correctlyTyped[correctlyTyped.length - 1] + notYetTyped;
                correctlyTyped = correctlyTyped.substr(0, correctlyTyped.length - 1);
            } else {
                return;
            }

            $(that).trigger({
                type: 'textchange.wpm',
                correctlyTyped: correctlyTyped,
                incorrectlyTyped: incorrectlyTyped,
                notYetTyped: notYetTyped,
                incorrectCount: incorrectCount,
            });

            tick();
        };

        tick();
    };
})();
