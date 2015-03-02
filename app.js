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
    var Clock = function() {
        this.time = function() {
            return new Date().getTime() / 1000;
        };
    };

    var TypeBox = function(type, stats) {
        function renderStats(wpm, characters, words, seconds) {
            stats.find('.wpm .value').text(wpm);
            stats.find('.wpm-meter meter').val(isFinite(wpm) ? wpm : 0);
            stats.find('.characters .value').text(characters);
            stats.find('.words .value').text(words);
            stats.find('.seconds .value').text(seconds);
        }

        this.renderInitial = function () {
            if (type.data('mode') !== 'initial') {
                type.data('mode', 'initial');
                type.html('<div class="overlay">Select a paragraph from above</div>');
                type.removeClass('completed');
            }

            renderStats('--', '--', '--', '--');
        };

        this.renderCountdown = function (seconds) {
            if (type.data('mode') !== 'countdown') {
                type.data('mode', 'countdown');
                type.html('<div class="overlay"></div>');
                type.removeClass('completed');
            }

            type.find('.overlay').text(Math.ceil(seconds));

            renderStats(0, 0, 0, 0);
        };

        this.renderProgress = function(isCompleted, correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
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
        };
    };

    var KeyboardLayoutsRenderer = function(qwertyContainer, dvorakContainer) {
        var layouts = {
            qwerty: [
                ['Qq', 'Ww', 'Ee', 'Rr', 'Tt', 'Yy', 'Uu', 'Ii', 'Oo', 'Pp', '[{', ']}'],
                ['Aa', 'Ss', 'Dd', 'Ff', 'Gg', 'Hh', 'Jj', 'Kk', 'Ll', ';:', '\'"'],
                ['Zz', 'Xx', 'Cc', 'Vv', 'Bb', 'Nn', 'Mm', ',<', '.>', '/?'],
            ],
            dvorak: [
                ['\'"', ',<', '.>', 'Pp', 'Yy', 'Ff', 'Gg', 'Cc', 'Rr', 'Ll', '/?', '=+'],
                ['Aa', 'Oo', 'Ee', 'Uu', 'Ii', 'Dd', 'Hh', 'Tt', 'Nn', 'Ss', '-_'],
                [';:', 'Qq', 'Jj', 'Kk', 'Xx', 'Bb', 'Mm', 'Ww', 'Vv', 'Zz'],
            ],
        };
        var nextKey = null;

        function renderLayout(container, layout) {
            for (i in layout) {
                var row = $('<div class="row-' + i + '">');
                for (var j = 0; j < layout[i].length; j++) {
                    var key = $('<span class="key">')
                        .text(layout[i][j][0])
                        .toggleClass('home', i == 1 && (0 <= j && j <= 3 || 6 <= j && j <= 9))
                        .toggleClass('bump', i == 1 && (j === 3 || j === 6))
                        .appendTo(row);

                    for (var k in layout[i][j]) {
                        key.addClass('key-' + layout[i][j][k].charCodeAt());
                    }
                }
                row.appendTo(container);
            }
        }

        this.clearNextKey = function() {
            qwertyContainer.find('.key.next').removeClass('next');
            dvorakContainer.find('.key.next').removeClass('next');
            nextKey = null;
        };

        this.renderNextKey = function(key) {
            if (nextKey === key) {
                return;
            }

            this.clearNextKey();
            qwertyContainer.find('.key.key-' + key.charCodeAt()).addClass('next');
            dvorakContainer.find('.key.key-' + key.charCodeAt()).addClass('next');
            nextKey = key;
        };

        renderLayout(qwertyContainer, layouts.qwerty);
        renderLayout(dvorakContainer, layouts.dvorak);
    };

    var ParagraphSelector = function(paragraphs, container) {
        function shuffle(arr) {
            var temp, j, i = arr.length;
            while (--i) {
                j = ~~(Math.random() * (i + 1));
                temp = arr[i];
                arr[i] = arr[j];
                arr[j] = temp;
            }

            return arr;
        }

        for (i in paragraphs) {
            var li = $('<li>');
            $('<a href="#">')
                .text(paragraphs[i].name)
                .data('paragraph', paragraphs[i].text)
                .data('shuffle', paragraphs[i].shuffle === true)
                .on('click', function() {
                    var paragraph = $(this).data('paragraph');
                    if ($(this).data('shuffle') === true) {
                        paragraph = shuffle(paragraph.split(' ')).join(' ');
                    }

                    controller.start(paragraph, 3);

                    container.find('li a.active').removeClass('active');
                    $(this).addClass('active').blur();
                    return false;
                })
                .appendTo(li);
            li.appendTo(container);
        }
    };

    var Controller = function(clock, typeBox, keyboardLayoutRenderer) {
        var wordsToType = null;
        var correctlyTyped = null;
        var incorrectlyTyped = null;
        var notYetTyped = null;
        var startTime = null;

        var isActive = false;
        var timer = null;

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

            if (isActive && incorrectlyTyped.length === 0) {
                keyboardLayoutRenderer.renderNextKey(notYetTyped[0]);
            } else {
                keyboardLayoutRenderer.clearNextKey();
            }

            clearInterval(timer);
            timer = null;

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

            tick();
        };

        this.letterTyped = function(letter) {
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
        };

        this.backspaceTyped = function() {
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
        };

        tick();
    };

    var KeyboardMapper = function() {
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

        this.fromCharCode = function(charCode) {
            var char = String.fromCharCode(charCode);
            return maps[mapName][char] !== undefined ? maps[mapName][char] : char;
        };

        this.changeMap = function(newMapName) {
            if (maps[mapName] !== undefined) {
                mapName = newMapName;
            } else {
                mapName = null;
            }
        };
    };

    var Input = function(document, controller, mapQwertyToDvorakCheckbox, keyboardMapper) {
        document.on('keydown', function(e) {
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

        document.on('keypress', function(e) {
            // Normal keys
            var letter = keyboardMapper.fromCharCode(e.charCode);
            if (letter) {
                controller.letterTyped(letter);
                return false;
            }
        });

        $(mapQwertyToDvorakCheckbox).on('change', function() {
            var mapName = $(this).is(':checked') ? 'qwertyToDvorak' : null;
            keyboardMapper.changeMap(mapName);

            $(this).blur();
            return false;
        });
    };

    var typeBox = new TypeBox($('#type'), $('#stats'));
    var keyboardLayoutsRenderer = new KeyboardLayoutsRenderer($('#qwerty-layout'), $('#dvorak-layout'));
    var paragraphSelector = new ParagraphSelector(window.paragraphs, $('#paragraphs'));

    var clock = new Clock();
    var controller = new Controller(clock, typeBox, keyboardLayoutsRenderer);
    var keyboardMapper = new KeyboardMapper();
    var input = new Input($(document), controller, $('#map-qwerty-to-dvorak'), keyboardMapper);
})($);
