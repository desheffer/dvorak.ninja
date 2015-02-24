(function() {
    function time() {
        return new Date().getTime() / 1000;
    }

    var view = (function() {
        var that = {
            render: function(correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
                var completed = (notYetTyped.length == 0);

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

        return that;
    })();

    var controller = (function(view) {
        var wordsToType;
        var correctlyTyped;
        var incorrectlyTyped;
        var notYetTyped;
        var startTime;

        function triggerRender() {
            var seconds = Math.round(time() - startTime);

            view.render(correctlyTyped, incorrectlyTyped, notYetTyped, seconds);
        }

        var that = {
            init: function(words) {
                wordsToType = words;
                that.reset();
            },
            reset: function() {
                correctlyTyped = '';
                incorrectlyTyped = '';
                notYetTyped = wordsToType;
                startTime = time();

                triggerRender();
            },
            completed: function() {
                return notYetTyped.length == 0;
            },
            letterTyped: function(letter) {
                if (that.completed()) {
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
                if (that.completed()) {
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

        return that;
    })(view);

    $(document).on('keydown', function(e) {
        if (e.keyCode == 17 || e.keyCode == 18 || e.keyCode == 91) {
            // Ctrl, Alt, Command
            return true;
        }

        if (e.keyCode == 8) {
            // Backspace
            controller.backspaceTyped();
            return false;
        }

        var letter = String.fromCharCode(e.keyCode);
        letter = e.shiftKey ? letter.toUpperCase() : letter.toLowerCase();
        controller.letterTyped(letter);
    });

    $('#paragraphs a').on('click', function() {
        controller.init($(this).data('paragraph'));
        return false;
    });
})();
