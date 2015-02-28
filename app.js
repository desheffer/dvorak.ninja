/**
 * Copyright (C) 2015 Doug Sheffer <desheffer@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
(function($) {
    var clock = (function() {
        return {
            time: function() {
                return new Date().getTime() / 1000;
            },
        };
    })();

    var typeBox = (function() {
        var type = $('#type');
        var stats = $('#stats');

        function renderStats(wpm, characters, words, seconds) {
            stats.find('.wpm .value').text(wpm);
            stats.find('.wpm-meter meter').val(isFinite(wpm) ? wpm : 0);
            stats.find('.characters .value').text(characters);
            stats.find('.words .value').text(words);
            stats.find('.seconds .value').text(seconds);
        }

        return {
            renderInitial: function () {
                if (type.data('mode') !== 'initial') {
                    type.data('mode', 'initial');
                    type.html('<div class="overlay">Select a paragraph from above</div>');
                    type.removeClass('completed');
                }

                renderStats('--', '--', '--', '--');
            },
            renderCountdown: function (seconds) {
                if (type.data('mode') !== 'countdown') {
                    type.data('mode', 'countdown');
                    type.html('<div class="overlay"></div>');
                    type.removeClass('completed');
                }

                type.find('.overlay').text(Math.ceil(seconds));

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

                var characters = correctlyTyped.length;
                var words = correctlyTyped.length / 5;
                var wpm = words / (seconds / 60);

                renderStats(
                    Math.round(wpm ? wpm : 0),
                    characters,
                    Math.floor(words),
                    Math.floor(seconds)
                );
            },
        };
    })();

    var controller = (function(clock, typeBox) {
        var wordsToType = null;
        var correctlyTyped = null;
        var incorrectlyTyped = null;
        var notYetTyped = null;
        var startTime = null;

        var isActive = false;
        var timer = null;

        tick();

        function tick() {
            var now = clock.time();

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
            timer = null;

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
                startTime = clock.time() + timeout;

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
    })(clock, typeBox);

    var keyboardMapper = (function() {
        var maps = {
            null: {},
            qwertyToDvorak: {
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
            },
        };
        var mapName = null;

        return {
            fromCharCode: function(charCode) {
                var char = String.fromCharCode(charCode);
                return maps[mapName][char] !== undefined ? maps[mapName][char] : char;
            },
            setMap: function(aMapName) {
                if (maps[mapName] !== undefined) {
                    mapName = aMapName;
                } else {
                    mapName = null;
                }
            },
        };
    })();

    var keyboardLayouts = (function(qwertyContainer, dvorakContainer) {
        var layouts = {
            qwerty: ['QWERTYUIOP[]', 'ASDFGHJKL;\'', 'ZXCVBNM,./'],
            dvorak: ['\',.PYFGCRL/=', 'AOEUIDHTNS-', ';QJKXBMWVZ'],
        };

        function renderLayout(container, layout) {
            for (i in layout) {
                var row = $('<div class="row-' + i + '">');
                for (var j = 0; j < layout[i].length; j++) {
                    $('<span class="key">')
                        .text(layout[i][j])
                        .toggleClass('home', i == 1 && (0 <= j && j <= 3 || 6 <= j && j <= 9))
                        .toggleClass('bump', i == 1 && (j === 3 || j === 6))
                        .appendTo(row);
                }
                row.appendTo(container);
            }
        }

        renderLayout(qwertyContainer, layouts.qwerty);
        renderLayout(dvorakContainer, layouts.dvorak);

        return {};
    })($('#qwerty-layout'), $('#dvorak-layout'));

    var input = (function($, controller, keyboardMapper) {
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
        });

        $(document).on('keypress', function(e) {
            // Normal keys
            var letter = keyboardMapper.fromCharCode(e.charCode);
            if (letter) {
                controller.letterTyped(letter);
                return false;
            }
        });

        $('#map-dvorak').on('change', function() {
            var mapName = $(this).is(':checked') ? 'qwertyToDvorak' : null;
            keyboardMapper.setMap(mapName);

            $(this).blur();
            return false;
        });

        return {};
    })($, controller, keyboardMapper);

    var paragraphSelector = (function(container, paragraphs) {
        for (i in paragraphs) {
            var li = $('<li>');
            var a = $('<a href="#">')
                .text(paragraphs[i].name)
                .data('paragraph', paragraphs[i].text)
                .on('click', function() {
                    controller.start($(this).data('paragraph'), 3);
                    $(this).blur();
                    return false;
                })
                .appendTo(li);
            li.appendTo(container);
        }

        return {};
    })($('#paragraphs'), window.paragraphs);
})($);
