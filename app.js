(function() {
    function time() {
        return new Date().getTime() / 1000;
    }

    function fromCharCode(keyCode, shiftKey) {
        var layers = {};

        layers.normal = {
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

        layers.shift = {
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

        if (shiftKey) {
            return layers.shift[keyCode];
        } else {
            return layers.normal[keyCode];
        }
    }

    var view = (function() {
        return {
            render: function(started, completed, correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
                if (completed) {
                    $('#type').html(
                        '<span class="correct">' + correctlyTyped + '</span>'
                    );
                } else {
                    $('#type').html(
                        '<span class="correct">' + correctlyTyped + '</span>'
                        + '<span class="incorrect">' + incorrectlyTyped + '</span>'
                        + '<span class="cursor"></span>'
                        + '<span class="not-yet-typed">' + notYetTyped.substr(incorrectlyTyped.length) + '</span>'
                    );
                }

                $('#type').toggleClass('completed', completed);

                var words = correctlyTyped.length / 5;
                var wpm = words / (seconds / 60);
                $('#stats .wpm .value').text(Math.round(wpm ? wpm : 0));
                $('#stats .characters .value').text(Math.round(correctlyTyped.length));
                $('#stats .words .value').text(Math.floor(words));
                $('#stats .seconds .value').text(seconds);
            },
        };
    })();

    var controller = (function(view) {
        var wordsToType = '';
        var correctlyTyped = '';
        var incorrectlyTyped = '';
        var notYetTyped = '';
        var startTime = null;

        function started() {
            return wordsToType.length > 0;
        }

        function completed() {
            return started() && notYetTyped.length == 0;
        }

        function triggerRender() {
            var seconds = Math.round(time() - startTime);

            view.render(started(), completed(), correctlyTyped, incorrectlyTyped, notYetTyped, seconds);
        }

        return {
            start: function(words) {
                wordsToType = words;

                correctlyTyped = '';
                incorrectlyTyped = '';
                notYetTyped = wordsToType;
                startTime = time();

                triggerRender();
            },
            letterTyped: function(letter) {
                if (!started() || completed()) {
                    return;
                }

                var expected = notYetTyped.substr(0, 1);

                if (incorrectlyTyped.length == 0 && letter == expected) {
                    correctlyTyped = correctlyTyped + letter;
                    notYetTyped = notYetTyped.substr(1);
                } else if (incorrectlyTyped.length <= 10) {
                    incorrectlyTyped = incorrectlyTyped + letter;
                }

                triggerRender();
            },
            backspaceTyped: function() {
                if (!started() || completed()) {
                    return;
                }

                if (incorrectlyTyped.length > 0) {
                    incorrectlyTyped = incorrectlyTyped.substr(0, incorrectlyTyped.length - 1);
                } else if (correctlyTyped.length > 0) {
                    notYetTyped = correctlyTyped[correctlyTyped.length - 1] + notYetTyped;
                    correctlyTyped = correctlyTyped.substr(0, correctlyTyped.length - 1);
                }

                triggerRender();
            },
        };
    })(view);

    $(document).on('keydown', function(e) {
        // Ignore keyboard shortcuts
        if (e.altKey || e.ctrlKey || e.metaKey) {
            return true;
        }

        // Backspace
        if (e.keyCode == 8) {
            controller.backspaceTyped();
            return false;
        }

        // Normal keys
        var letter = fromCharCode(e.keyCode, e.shiftKey);
        if (letter) {
            controller.letterTyped(letter);
        }
    });

    $('#paragraphs a').on('click', function() {
        var link = $(this);

        var timeout = 3;
        function countdown() {
            if (timeout > 0) {
                $('#type').html('<div class="countdown">' + timeout + '</div>');
                timeout--;
                setTimeout(countdown, 1000);
            } else {
                controller.start(link.data('paragraph'));
            }
        }
        countdown();

        $(this).blur();
        return false;
    });
})();
