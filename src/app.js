/* global Chartist: false */
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
(function($, Chartist) {
    'use strict';

    var Clock = function() {
        this.time = function() {
            return new Date().getTime() / 1000;
        };
    };

    var TypeBox = function(type, stats) {
        function renderTextAndStats(correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
            var remaining = notYetTyped.substr(incorrectlyTyped.length);
            type.find('.correct').text(correctlyTyped);
            type.find('.incorrect').text(incorrectlyTyped);
            type.find('.remaining').text(remaining);

            var characters = correctlyTyped.length;
            var words = correctlyTyped.length / 5;
            var wpm = words / (seconds / 60);

            renderStats(
                Math.round(wpm ? wpm : 0),
                characters,
                ~~words,
                seconds
            );
        }

        function renderStats(wpm, characters, words, seconds) {
            var time;
            if (seconds !== undefined) {
                var min = ~~(seconds / 60);
                var sec = ~~(seconds - min * 60);
                time = min + ':' + (sec < 10 ? '0' + sec : sec);
            }

            stats.find('.wpm .value').text(wpm !== undefined ? wpm : '--');
            stats.find('.wpm-meter meter').val(isFinite(wpm) ? wpm : 0);
            stats.find('.characters .value').text(characters !== undefined ? characters : '--');
            stats.find('.words .value').text(words !== undefined ? words : '--');
            stats.find('.time .value').text(time !== undefined ? time : '-:--');
        }

        this.renderInitial = function () {
            if (type.data('mode') !== 'initial') {
                type.data('mode', 'initial');
                type.html('<div class="overlay">Select a paragraph from above</div>');
                type.removeClass('completed');
            }

            renderStats();
        };

        this.renderCountdown = function (seconds) {
            if (type.data('mode') !== 'countdown') {
                type.data('mode', 'countdown');
                type.html('<div class="overlay"></div>');
                type.removeClass('completed');
            }

            type.find('.overlay').text('- ' + Math.ceil(seconds) + ' -');

            renderTextAndStats('', '', '', 0);
        };

        this.renderProgress = function(correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
            if (type.data('mode') !== 'progress') {
                type.data('mode', 'progress');
                type.html(
                    '<span class="correct"></span>' +
                    '<span class="incorrect"></span>' +
                    '<span class="cursor"></span>' +
                    '<span class="remaining"></span>'
                );
                type.removeClass('completed');
            }

            renderTextAndStats(correctlyTyped, incorrectlyTyped, notYetTyped, seconds);
        };

        this.renderCompleted = function(correctlyTyped, seconds, histogram /* , incorrect */) {
            if (type.data('mode') !== 'completed') {
                type.data('mode', 'completed');
                type.html(
                    '<span class="correct"></span>' +
                    '<div class="ct-chart"></div>'
                );
                type.addClass('completed');
            }

            new Chartist.Line(type.find('.ct-chart').get(0), {
                labels: Object.keys(histogram),
                series: [ histogram ],
            }, {
                low: 0,
                showArea: true,
                showPoint: false,
                height: type.height(),
                fullWidth: true,
                axisX: {
                    showLabel: false,
                    showGrid: false,
                },
            });

            renderTextAndStats(correctlyTyped, '', '', seconds);
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
            for (var i in layout) {
                var row = $('<div class="row-' + i + '">');
                for (var j = 0; j < layout[i].length; j++) {
                    var key = $('<span class="key">')
                        .text(layout[i][j][0])
                        .toggleClass('home', i === 1 && (0 <= j && j <= 3 || 6 <= j && j <= 9))
                        .toggleClass('bump', i === 1 && (j === 3 || j === 6))
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

        for (var i in paragraphs) {
            var li = $('<li>');
            $('<a class="paragraph" href="#">')
                .text(paragraphs[i].name)
                .data('paragraph', paragraphs[i].text)
                .data('shuffle', paragraphs[i].shuffle === true)
                .appendTo(li);
            li.appendTo(container);
        }

        container.find('a.paragraph').on('click', function() {
            var paragraph = $(this).data('paragraph');
            if ($(this).data('shuffle') === true) {
                paragraph = shuffle(paragraph.split(' ')).join(' ');
            }

            controller.start(paragraph, 3);

            container.find('li a.active').removeClass('active');
            $(this).addClass('active').blur();
            return false;
        });
    };

    var Controller = function(clock, typeBox, keyboardLayoutRenderer) {
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
            return maps[mapName][char] || char;
        };

        this.changeMap = function(newMapName) {
            if (maps[newMapName] !== undefined) {
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
    new ParagraphSelector(window.paragraphs, $('#paragraphs'));

    var clock = new Clock();
    var controller = new Controller(clock, typeBox, keyboardLayoutsRenderer);
    var keyboardMapper = new KeyboardMapper();
    new Input($(document), controller, $('#map-qwerty-to-dvorak'), keyboardMapper);
})(jQuery, Chartist);
