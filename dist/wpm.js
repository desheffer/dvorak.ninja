/*! wpm 2015-03-11 */
/* global Chartist: false */
/* global vex: false */
(function($, Chartist, vex) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type, stats) {
        function renderTextAndStats(correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
            var remaining = notYetTyped.substr(incorrectlyTyped.length);
            type.find('.correct').text(correctlyTyped);
            type.find('.incorrect').text(incorrectlyTyped);
            type.find('.remaining').text(remaining);

            var characters = correctlyTyped.length;
            var words = correctlyTyped.length / 5;
            var wpm = words / (seconds / 60);

            renderStats(
                wpm ? ~~wpm : 0,
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

        this.renderCompleted = function(correctlyTyped, seconds, histogram, incorrect) {
            if (type.data('mode') !== 'completed') {
                type.data('mode', 'completed');
                type.html('<span class="correct"></span>');
                type.addClass('completed');
            }

            renderTextAndStats(correctlyTyped, '', '', seconds);

            var score = vex.open({});

            $('<h2>').text('Score card').appendTo(score);

            var chart = $('<div class="ct-chart">').appendTo(score);

            new Chartist.Line(chart.get(0), {
                labels: Object.keys(histogram),
                series: [histogram],
            }, {
                showArea: true,
                showPoint: false,
                fullWidth: true,
                axisX: {
                    showLabel: false,
                    showGrid: false,
                },
            });

            var accuracy = correctlyTyped.length / (correctlyTyped.length + incorrect) * 100;
            var wpm = (correctlyTyped.length / 5) / (seconds / 60);

            var max = 0;
            for (var val in histogram) {
                max = Math.max(max, histogram[val]);
            }

            var dl = $('<dl class="dl-horizontal">').appendTo(score);
            $('<dt>').text('Accuracy:').appendTo(dl);
            $('<dd>').text(~~accuracy + '%').appendTo(dl);
            $('<dt>').text('Average WPM:').appendTo(dl);
            $('<dd>').text(~~wpm).appendTo(dl);
            $('<dt>').text('Maximum WPM:').appendTo(dl);
            $('<dd>').text(~~max).appendTo(dl);
        };
    };

    vex.defaultOptions.className = 'vex-theme-default';
})($, Chartist, vex);

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Clock = function() {
        this.time = function() {
            return new Date().getTime() / 1000;
        };
    };
})();

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.KeyboardLayoutsRenderer = function(qwertyContainer, dvorakContainer) {
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
})();

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.KeyboardMapper = function() {
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
})();

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

(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ParagraphSelector = function(paragraphs, container, controller) {
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
})($);

(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Input = function(document, controller, mapQwertyToDvorakCheckbox, keyboardMapper) {
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

        mapQwertyToDvorakCheckbox.on('change', function() {
            var mapName = $(this).is(':checked') ? 'qwertyToDvorak' : null;
            keyboardMapper.changeMap(mapName);

            $(this).blur();
            return false;
        });
    };
})($);

(function() {
    "use strict";

    window.WPM = window.WPM || {};

    window.WPM.paragraphs = [
        {
            name: "Dvorak 1 [aeouhtns]",
            text: "eats unset seats noses onto asset sane note oath nests shut hates shush tans sate hues tune oats shoot shoe auto shot autos totes antes tenet huts nest ethos host shoos tonne tan sooth stone net nose stuns anus east shout too shuts souse sheet one tenon son hose snots ton sent toes tees out senna nun tutus tease tunes sees tots that tho the state eases shoo aeon noon noose hath taste nosh hat hens tost hoes eons tutu teen neon hue ten anon nth tones neat tush anons sues ones set heats none teeth sea stun aunt stout",
            shuffle: true,
        },
        {
            name: "Dvorak 2 [id]",
            text: "dissents thinness assassination annotates statehouse disuse tidiest shoeshines headset anoint ashiest atone undies seasoned settees nosiness untested sedatest intensest shone shoots insets detention sinus distention sustain sententious tided anaesthesia heaths tenses assassinate stains editions eased stash shunned nudes stoniest enthusiast dunned dietitian toniest neatness season suntan easiest heisted annotate untainted denuded oaths donuts shoddiness shooed hunts sassed densities headstone audited insinuation dudes hostess dietitians seasides siesta undated sonnet sainthood enthusiasts audits noses doted institution hoods assisted sheen hotheadedness inset shush dosed tattooists dandiest antidotes outdone insistent atones notations ensued tannin haunted dustiest tides stationed dense eddied outed deadest shodden sundaes",
            shuffle: true,
        },
        {
            name: "Dvorak 3 [cfklmprv]",
            text: "partitions inked visit months scammed hoorahs epics internship fondu milks carousals honorific ducts stilled concretes avatars speller enslave moderns pictured preponderate freeholders smirks missions litter retardation printer turned radius antihistamine forth patches transcendentalist interlink ruffs admiration satisfaction financial pauses ecstasies moochers sheller pioneered maidenheads accommodate refresh counterpoints platformed riddle aortas purloin occult merchantmen complainers patchier penlites clasps recoup continue rookie stuffed dipsomania footloose muralists unloved trickiest savvied minefields mainland coifed attempt uniform seventeens roasted technicians corsair stalemate terraria impulses scuds preparation tinier cattail limpet overeaten niter trammelled investiture administrators interstates carpets officious aseptic illusive mentored upend repeater commandoes middle reverenced",
            shuffle: true,
        },
        {
            name: "Dvorak 4 [bgjqwxyz]",
            text: "banqueting squishes bisque antiquated bonging zoned batting hobbyist jawed awash swath showbiz soybean aqueous whitings subduing outsizes oxygenated headwinds downy seabeds bandits thawed anaesthetizing adjoin absenting wends signings highs joists dinginess doggonedest budge anaesthetize downsizes inundating indebted waysides busyness gauziest ghosting antique dogged satiny twinning swathing signets subjugating hogshead aweigh antiquates instigates bogeys seized gabbing ghettoes dousing bingeing beads adequate sandhogs dizziest agitations dozing gowned toxins swagged botany sexist bagging aquas debase baths shebangs adobes budged hubbies nightgown gunshot budgets headbands hogging guest beatings snobbishness nabbing snowy equation sowing washtub twinned washout yeast dotage hiding banjoist quanta beaded owning dyeing",
            shuffle: true,
        },
        {
            name: "Dvorak 5 [a-z]",
            text: "charmed limns headgear sanserif coinciding bottling commentaries normal intervene hippest restatements draftier grubbiest empire crystallizes kinglier embracing hybrid spins washtubs upkeep sweetheart chateaus ethics brands parting hospitalize heaping perspired retorting alternated prettified islets moneybag straightens boogieing steed directional annoyingly typewrite routinize interact comparatively glorious forego contingency neurotically simplicity geegaws implausibly corpora journalists conscientious disgustingly appeases proportionate feasible dropping counteracts terrorize northerners vehemently opined meets portioning ammonia aesthetes usage legatees suspicious chaster equipment hangings sandbagging laundresses mortality underacted districts incoherence nibbles refrigerating wallet footing backings register grits fleeced amongst spake sponger shareholder dorkier superman excited pommel rhinoceroses whaler piddling hydrae prerecords",
            shuffle: true,
        },
        {
            name: "Dvorak 6 [A-Z]",
            text: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE WIZARD QUICKLY JINXED THE GNOMES BEFORE THEY VAPORIZED",
            shuffle: false,
        },
        {
            name: "Quote 1",
            text: "Let me tell you why you're here. You're here because you know something. What you know you can't explain, but you feel it. You've felt it your entire life, that there's something wrong with the world. You don't know what it is, but it's there, like a splinter in your mind, driving you mad. It is this feeling that has brought you to me. Do you know what I'm talking about?",
            shuffle: false,
        },
    ];
})();

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
/* global WPM */
(function($) {
    'use strict';

    var clock = new WPM.Clock();
    var typeBox = new WPM.TypeBox($('#type'), $('#stats'));
    var keyboardLayoutsRenderer = new WPM.KeyboardLayoutsRenderer($('#qwerty-layout'), $('#dvorak-layout'));
    var keyboardMapper = new WPM.KeyboardMapper();

    var controller = new WPM.Controller(clock, typeBox, keyboardLayoutsRenderer);
    new WPM.ParagraphSelector(WPM.paragraphs, $('#paragraphs'), controller);
    new WPM.Input($(document), controller, $('#map-qwerty-to-dvorak'), keyboardMapper);
})($);
