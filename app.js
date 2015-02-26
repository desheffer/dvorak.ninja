(function() {
    function time() {
        return new Date().getTime() / 1000;
    }

    var keyboardMapper = (function() {
        var layoutMapper = null;

        var normalLayer = {
            32: ' ',
            48: '0', 49: '1', 50: '2', 51: '3', 52: '4',
            53: '5', 54: '6', 55: '7', 56: '8', 57: '9',
            65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e',
            70: 'f', 71: 'g', 72: 'h', 73: 'i', 74: 'j',
            75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o',
            80: 'p', 81: 'q', 82: 'r', 83: 's', 84: 't',
            85: 'u', 86: 'v', 87: 'w', 88: 'x', 89: 'y',
            90: 'z',
            186: ';', 187: '=', 188: ',', 189: '-', 190: '.',
            191: '/', 192: '`', 219: '[', 220: '\\', 221: ']',
            222: '\'',
        };

        var shiftLayer = {
            32: ' ',
            48: ')', 49: '!', 50: '@', 51: '#', 52: '$',
            53: '%', 54: '^', 55: '&', 56: '*', 57: '(',
            65: 'A', 66: 'B', 67: 'C', 68: 'D', 69: 'E',
            70: 'F', 71: 'G', 72: 'H', 73: 'I', 74: 'J',
            75: 'K', 76: 'L', 77: 'M', 78: 'N', 79: 'O',
            80: 'P', 81: 'Q', 82: 'R', 83: 'S', 84: 'T',
            85: 'U', 86: 'V', 87: 'W', 88: 'X', 89: 'Y',
            90: 'Z',
            186: ':', 187: '+', 188: '<', 189: '_', 190: '>',
            191: '?', 192: '~', 219: '{', 220: '|', 221: '}',
            222: '"',
        };

        return {
            fromCharCode: function(keyCode, shiftKey) {
                var char = shiftKey ? shiftLayer[keyCode] : normalLayer[keyCode];

                if (layoutMapper !== null) {
                    return layoutMapper.map(char);
                } else {
                    return char;
                }
            },
            setLayoutMapper: function(aLayoutMapper) {
                layoutMapper = aLayoutMapper;
            },
        };
    })();

    var dvorakLayoutMapper = (function() {
        var map = {
            'a': 'a', 'A': 'A', 'b': 'x', 'B': 'X', 'c': 'j', 'C': 'J',
            'd': 'e', 'D': 'E', 'e': '.', 'E': '>', 'f': 'u', 'F': 'U',
            'g': 'i', 'G': 'I', 'h': 'd', 'H': 'D', 'i': 'c', 'I': 'C',
            'j': 'h', 'J': 'H', 'k': 't', 'K': 'T', 'l': 'n', 'L': 'N',
            'm': 'm', 'M': 'M', 'n': 'b', 'N': 'B', 'o': 'r', 'O': 'R',
            'p': 'l', 'P': 'L', 'q': '\'', 'Q': '"', 'r': 'p', 'R': 'P',
            's': 'o', 'S': 'O', 't': 'y', 'T': 'Y', 'u': 'g', 'U': 'G',
            'v': 'k', 'V': 'K', 'w': ',', 'W': '<', 'x': 'q', 'X': 'Q',
            'y': 'f', 'Y': 'F', 'z': ';', 'Z': ';', '-': '[', '_': '{',
            '=': ']', '+': '}', '[': '/', '{': '?', ']': '=', '}': '+',
            ';': 's', ':': 'S', '\'': '-', '"': '_', ',': 'w', '<': 'W',
            '.': 'v', '>': 'V', '/': 'z', '?': 'Z',
        };

        return {
            map: function(char) {
                return map[char] ? map[char] : char;
            },
        };
    })();

    var typeBox = (function() {
        var type = $('#type');
        var stats = $('#stats');

        function renderStats(wpm, characters, words, seconds) {
            if (!isFinite(wpm)) {
                wpm = 0;
            }

            stats.find('.wpm .value').text(wpm);
            stats.find('.characters .value').text(characters);
            stats.find('.words .value').text(words);
            stats.find('.seconds .value').text(seconds);

            // Scale of [0, 1) with 60 WPM at 0.5.
            var meter = 1 - 60 / (wpm + 60);
            stats.find('.wpm-meter meter').val(meter);
        }

        return {
            renderInitial: function () {
                type.removeClass('completed');

                renderStats('--', '--', '--', '--');
            },
            renderCountdown: function (seconds) {
                if (type.data('mode') !== 'countdown') {
                    type.data('mode', 'countdown');
                    type.html('<div class="overlay"></div>');
                }

                type.find('.overlay').text(Math.ceil(seconds));

                type.removeClass('completed');

                renderStats(0, 0, 0, 0);
            },
            renderProgress: function(isCompleted, correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
                if (type.data('mode') !== 'progress') {
                    type.data('mode', 'progress');
                    type.html(
                        '<span class="correct"></span>'
                        + '<span class="incorrect"></span>'
                        + '<span class="cursor"></span>'
                        + '<span class="remaining"></span>'
                    );
                }

                type.toggleClass('completed', isCompleted);

                var remaining = notYetTyped.substr(incorrectlyTyped.length)
                type.find('.correct').text(correctlyTyped);
                type.find('.incorrect').text(incorrectlyTyped);
                type.find('.remaining').text(remaining);

                seconds = Math.floor(seconds);
                var characters = correctlyTyped.length;
                var words = correctlyTyped.length / 5;
                var wpm = words / (seconds / 60);

                renderStats(
                    Math.round(wpm ? wpm : 0),
                    Math.round(characters),
                    Math.floor(words),
                    seconds
                );
            },
        };
    })();

    var controller = (function(typeBox) {
        var wordsToType = null;
        var correctlyTyped = null;
        var incorrectlyTyped = null;
        var notYetTyped = null;
        var startTime = null;

        var isActive = false;
        var timer = null;

        tick();

        function tick() {
            var now = time();

            isActive = (startTime !== null && now > startTime && notYetTyped !== null && notYetTyped !== '');

            var isCountdown = (startTime !== null && now < startTime);
            var isCompleted = (!isCountdown && notYetTyped === '');

            if (isCountdown) {
                typeBox.renderCountdown(startTime - now);
            } else if (isActive || isCompleted) {
                typeBox.renderProgress(isCompleted, correctlyTyped, incorrectlyTyped, notYetTyped, now - startTime);
            } else {
                typeBox.renderInitial();
            }

            clearInterval(timer);
            if (isCountdown || isActive) {
                timer = setTimeout(tick, 100);
            }
        }

        return {
            start: function(words, timeout) {
                if (timeout === undefined) {
                    timeout = 0;
                }

                wordsToType = notYetTyped = words;
                correctlyTyped = incorrectlyTyped = '';
                startTime = time() + timeout;

                tick();
            },
            letterTyped: function(letter) {
                if (!isActive) {
                    return;
                }

                var expected = notYetTyped.substr(0, 1);

                if (incorrectlyTyped.length === 0 && letter === expected) {
                    correctlyTyped = correctlyTyped + letter;
                    notYetTyped = notYetTyped.substr(1);
                } else if (incorrectlyTyped.length <= 10) {
                    incorrectlyTyped = incorrectlyTyped + letter;
                }

                tick();
            },
            backspaceTyped: function() {
                if (!isActive) {
                    return;
                }

                if (incorrectlyTyped.length > 0) {
                    incorrectlyTyped = incorrectlyTyped.substr(0, incorrectlyTyped.length - 1);
                } else if (correctlyTyped.length > 0) {
                    notYetTyped = correctlyTyped[correctlyTyped.length - 1] + notYetTyped;
                    correctlyTyped = correctlyTyped.substr(0, correctlyTyped.length - 1);
                }

                tick();
            },
        };
    })(typeBox);

    $(document).on('keydown', function(e) {
        // Ignore keyboard shortcuts
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return true;
        }

        // Backspace
        if (e.keyCode === 8) {
            controller.backspaceTyped();
            return false;
        }

        // Normal keys
        var letter = keyboardMapper.fromCharCode(e.keyCode, e.shiftKey);
        if (letter) {
            controller.letterTyped(letter);
            return false;
        }
    });

    $('#paragraphs a').on('click', function() {
        controller.start($(this).data('paragraph'), 3);
        $(this).blur();
        return false;
    });

    $('#map-dvorak').on('change', function() {
        var layoutMapper = $(this).is(':checked') ? dvorakLayoutMapper : null;
        keyboardMapper.setLayoutMapper(layoutMapper);
        $(this).blur();
        return false;
    });
})();
