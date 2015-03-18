/*! wpm 2015-03-17 */
(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.gameModes = {
        IDLE: 'idle',
        COUNTDOWN: 'countdown',
        PLAYING: 'playing',
        COMPLETE: 'complete',
    };

    window.WPM.Game = function() {
        var that = this;

        var modes = window.WPM.gameModes;

        var mode;
        var startTime;
        var timer;

        var paragraphName;
        var wordsToType;
        var correctlyTyped;
        var incorrectlyTyped;
        var notYetTyped;
        var totalTyped;

        var times;

        function currentMode() {
            var now = $.now();

            if (startTime !== undefined && now < startTime) {
                return modes.COUNTDOWN;
            } else if (startTime !== undefined && now > startTime && notYetTyped !== undefined && notYetTyped.length > 0) {
                return modes.PLAYING;
            } else if (notYetTyped === '') {
                return modes.COMPLETE;
            }

            return modes.IDLE;
        }

        function tick() {
            clearInterval(timer);
            timer = undefined;

            var oldMode = mode;
            mode = currentMode();

            if (oldMode === modes.PLAYING) {
                var seconds = ($.now() - startTime) / 1000;
                var characters = correctlyTyped.length;
                var words = correctlyTyped.length / 5;
                var wpm = words / (seconds / 60);
                var accuracy = characters / totalTyped * 100;

                $(that).trigger({
                    type: 'scorechange.wpm',
                    seconds: seconds,
                    characters: characters,
                    words: words,
                    wpm: wpm,
                    accuracy: accuracy,
                    paragraphName: paragraphName,
                    times: times,
                    complete: mode !== modes.PLAYING,
                });
            }

            if (mode !== oldMode) {
                $(that).trigger({
                    type: 'modechange.wpm',
                    mode: mode,
                    oldMode: oldMode,
                });
            }

            if (oldMode === modes.COUNTDOWN && mode === modes.PLAYING) {
                $(that).trigger({
                    type: 'textchange.wpm',
                    correctlyTyped: correctlyTyped,
                    incorrectlyTyped: incorrectlyTyped,
                    notYetTyped: notYetTyped,
                    nextLetter: notYetTyped[0],
                    change: 0,
                });
            }

            if (mode === modes.COUNTDOWN) {
                $(that).trigger({
                    type: 'countdown.wpm',
                    countdown: (startTime - $.now()) / 1000,
                });
            }

            if (mode === modes.COUNTDOWN || mode === modes.PLAYING) {
                timer = setTimeout(tick, 100);
            }
        }

        this.init = function() {
            tick();
        };

        this.start = function(name, words, timeout) {
            if (timeout === undefined) {
                timeout = 0;
            }

            mode = undefined;
            startTime = $.now() + timeout * 1000;

            paragraphName = name;
            wordsToType = notYetTyped = words;
            correctlyTyped = incorrectlyTyped = '';
            totalTyped = 0;
            times = [];

            tick();
        };

        this.letterTyped = function(letter) {
            if (mode !== modes.PLAYING) {
                return;
            }

            totalTyped++;
            var delta = 0;
            var expected = notYetTyped.substr(0, 1);

            if (incorrectlyTyped.length === 0 && letter === expected) {
                // Add a correct letter
                correctlyTyped = correctlyTyped + letter;
                notYetTyped = notYetTyped.substr(1);
                delta = 1;

                var lastLetterTime = times.length > 0 ? times[times.length - 1].time : startTime;
                var newLetterTime = $.now();
                times.push({
                    letter: letter,
                    time: newLetterTime,
                    duration: newLetterTime - lastLetterTime,
                });
            } else if (incorrectlyTyped.length <= 10) {
                // Add an incorrect letter
                incorrectlyTyped = incorrectlyTyped + letter;
            } else {
                return;
            }

            $(that).trigger({
                type: 'textchange.wpm',
                correctlyTyped: correctlyTyped,
                incorrectlyTyped: incorrectlyTyped,
                notYetTyped: notYetTyped,
                nextLetter: incorrectlyTyped ? false : notYetTyped[0],
                change: delta,
            });

            tick();
        };

        this.backspaceTyped = function() {
            if (mode !== modes.PLAYING) {
                return;
            }

            var delta = 0;

            if (incorrectlyTyped.length > 0) {
                // Remove an incorrect letter
                incorrectlyTyped = incorrectlyTyped.substr(0, incorrectlyTyped.length - 1);
            } else if (correctlyTyped.length > 0) {
                // Remove a correct letter
                notYetTyped = correctlyTyped[correctlyTyped.length - 1] + notYetTyped;
                correctlyTyped = correctlyTyped.substr(0, correctlyTyped.length - 1);
                delta = -1;

                times.pop();
            } else {
                return;
            }

            $(that).trigger({
                type: 'textchange.wpm',
                correctlyTyped: correctlyTyped,
                incorrectlyTyped: incorrectlyTyped,
                notYetTyped: notYetTyped,
                nextLetter: incorrectlyTyped ? false : notYetTyped[0],
                change: delta,
            });

            tick();
        };
    };
})(jQuery);

(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Input = function(document, keyboardMapper) {
        var that = this;

        document.on('keydown', function(e) {
            // Ignore keyboard shortcuts
            if (e.altKey || e.ctrlKey || e.metaKey) {
                return true;
            }

            // Backspace
            if (e.keyCode === 8) {
                $(that).trigger({
                    type: 'backspacepress.wpm',
                });

                return false;
            }
        });

        document.on('keypress', function(e) {
            // Normal keys
            var letter = keyboardMapper.fromCharCode(e.charCode);
            if (letter) {
                $(that).trigger({
                    type: 'letterpress.wpm',
                    letter: letter,
                });

                return false;
            }
        });
    };
})(jQuery);

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

(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.LayoutBox = function(qwertyContainer, dvorakContainer, mapQwertyToDvorakCheckbox) {
        var that = this;

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

        function renderLayout(container, layout) {
            for (var i = 0; i < layout.length; i++) {
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

        this.modeChanged = function() {
            qwertyContainer.find('.key.next').removeClass('next');
            dvorakContainer.find('.key.next').removeClass('next');
        };

        this.textChanged = function(e) {
            qwertyContainer.find('.key.next').removeClass('next');
            dvorakContainer.find('.key.next').removeClass('next');

            if (e.nextLetter) {
                qwertyContainer.find('.key.key-' + e.nextLetter.charCodeAt()).addClass('next');
                dvorakContainer.find('.key.key-' + e.nextLetter.charCodeAt()).addClass('next');
            }
        };

        mapQwertyToDvorakCheckbox.on('change', function() {
            var mapName = $(this).is(':checked') ? 'qwertyToDvorak' : null;

            $(that).trigger({
                type: 'layoutchange.wpm',
                mapName: mapName,
            });

            $(this).blur();
            return false;
        });

        renderLayout(qwertyContainer, layouts.qwerty);
        renderLayout(dvorakContainer, layouts.dvorak);
    };
})(jQuery);

(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ParaBox = function(paragraphs, container) {
        var that = this;

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
                .data('limit', paragraphs[i].limit)
                .appendTo(li);
            li.appendTo(container);
        }

        container.find('a.paragraph').on('click', function() {
            var paragraph = $(this).data('paragraph');

            if ($(this).data('shuffle') === true) {
                paragraph = shuffle(paragraph.split(' ')).join(' ');
            }

            var limit = $(this).data('limit');
            if (limit > 0) {
                paragraph = paragraph.split(' ').slice(0, limit).join(' ');
            }

            $(that).trigger({
                type: 'paragraphchange.wpm',
                name: $(this).text(),
                paragraph: paragraph,
            });

            container.find('li a.active').removeClass('active');
            $(this).addClass('active').blur();
            return false;
        });
    };
})(jQuery);

/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function(social) {
        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        function djb2(str){
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
            }
            return hash;
        }

        function userToColor(str) {
            var hash = djb2(str);
            var r = (hash & 0xFF0000) >> 16;
            var g = (hash & 0x00FF00) >> 8;
            var b = hash & 0x0000FF;
            return '#' + ('0' + r.toString(16)).substr(-2) + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
        }

        function userToName(str) {
            return 'Guest' + djb2(str).toString(10).substr(-5);
        }

        firebase.authAnonymously(function(error, authData) {
            if (authData) {
                user = authData;

                var userRef = firebase.child('presence').child(user.uid);
                userRef.onDisconnect().remove();
                userRef.set(true);

                social.find('.me .avatar').css('background-color', userToColor(user.uid));
                social.find('.me .name').text(userToName(user.uid));
            }
        });

        firebase.child('presence').on('value', function(snapshot) {
            var count = Object.keys(snapshot.val()).length;
            social.find('.user-count .value').text(count);
        });

        this.scoreChanged = function(e) {
            if (e.complete !== true) {
                return;
            }

            firebase.child('score').child(user.uid).push({
                timeStamp: e.timeStamp,
                paragraphName: e.paragraphName,
                score: {
                    seconds: e.seconds,
                    words: e.words,
                    wpm: e.wpm,
                    accuracy: e.accuracy,
                },
            });
        };
    };
})($, Firebase);

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.StatsBox = function(stats) {
        var modes = window.WPM.gameModes;

        this.modeChanged = function(e) {
            if (e.mode === modes.COUNTDOWN || e.mode === modes.IDLE) {
                stats.find('.wpm .value').text('---');
                stats.find('.wpm-meter meter').val(0);
                stats.find('.accuracy .value').text('---%');
                stats.find('.characters .value').text('---');
                stats.find('.time .value').text('-:--');
            }
        };

        this.scoreChanged = function(e) {
            var time;
            if (e.seconds !== undefined) {
                var min = ~~(e.seconds / 60);
                var sec = ~~(e.seconds - min * 60);
                time = min + ':' + ('0' + sec).substr(-2);
            }

            stats.find('.wpm .value').text(~~e.wpm);
            stats.find('.wpm-meter meter').val(isFinite(e.wpm) ? e.wpm : 0);
            stats.find('.accuracy .value').text(~~e.accuracy + '%');
            stats.find('.characters .value').text(~~e.characters);
            stats.find('.time .value').text(time);
        };
    };
})();

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type) {
        var modes = window.WPM.gameModes;

        this.modeChanged = function(e) {
            if (e.mode === modes.IDLE) {
                type.html('<div class="overlay">Select a paragraph from above</div>');
            } else if (e.mode === modes.COUNTDOWN) {
                type.html('<div class="overlay"></div>');
            } else if (e.mode === modes.PLAYING) {
                type.html(
                    '<span class="correct"></span>' +
                    '<span class="incorrect"></span>' +
                    '<span class="cursor"></span>' +
                    '<span class="remaining"></span>'
                );
            }

            type.toggleClass('completed', e.mode === modes.COMPLETE);
        };

        this.countdown = function(e) {
            type.find('.overlay').text('- ' + Math.ceil(e.countdown) + ' -');
        };

        this.textChanged = function(e) {
            var remaining = e.notYetTyped.substr(e.incorrectlyTyped.length);
            type.find('.correct').text(e.correctlyTyped);
            type.find('.incorrect').text(e.incorrectlyTyped);
            type.find('.remaining').text(remaining);
        };

        this.scoreChanged = function(e) {
            if (!e.complete) {
                return;
            }

            type.html('<span class="results"></span>');
            var results = type.find('.results');

            var min, max;
            min = max = e.times[0].duration;

            for (var time in e.times) {
                min = Math.min(min, e.times[time].duration);
                max = Math.max(max, e.times[time].duration);
            }

            for (time in e.times) {
                var percent = (e.times[time].duration - min) / (max - min);
                $('<span class="letter">')
                    .text(e.times[time].letter)
                    .css('background-color', 'rgba(217, 83, 79, ' + percent + ')')
                    .appendTo(results);
            }
        };
    };
})();

(function() {
    "use strict";

    window.WPM = window.WPM || {};

    window.WPM.firebaseURL = "http://wpm.firebaseio.com/";

    window.WPM.paragraphs = [
        {
            name: "Dvorak 1 [aeouhtns]",
            text: "eats unset seats noses onto asset sane note oath nests shut hates shush tans sate hues tune oats shoot shoe auto shot autos totes antes tenet huts nest ethos host shoos tonne tan sooth stone net nose stuns anus east shout too shuts souse sheet one tenon son hose snots ton sent toes tees out senna nun tutus tease tunes sees tots that tho the state eases shoo aeon noon noose hath taste nosh hat hens tost hoes eons tutu teen neon hue ten anon nth tones neat tush anons sues ones set heats none teeth sea stun aunt stout",
            shuffle: true,
            limit: 50,
        },
        {
            name: "Dvorak 2 [id]",
            text: "dissents thinness assassination annotates statehouse disuse tidiest shoeshines headset anoint ashiest atone undies seasoned settees nosiness untested sedatest intensest shone shoots insets detention sinus distention sustain sententious tided anaesthesia heaths tenses assassinate stains editions eased stash shunned nudes stoniest enthusiast dunned dietitian toniest neatness season suntan easiest heisted annotate untainted denuded oaths donuts shoddiness shooed hunts sassed densities headstone audited insinuation dudes hostess dietitians seasides siesta undated sonnet sainthood enthusiasts audits noses doted institution hoods assisted sheen hotheadedness inset shush dosed tattooists dandiest antidotes outdone insistent atones notations ensued tannin haunted dustiest tides stationed dense eddied outed deadest shodden sundaes",
            shuffle: true,
            limit: 50,
        },
        {
            name: "Dvorak 3 [cfklmprv]",
            text: "partitions inked visit months scammed hoorahs epics internship fondu milks carousals honorific ducts stilled concretes avatars speller enslave moderns pictured preponderate freeholders smirks missions litter tradesmen printer turned radius antihistamine forth patches transcendentalist interlink ruffs admiration satisfaction financial pauses ecstasies moochers sheller pioneered maidenheads accommodate refresh counterpoints platformed riddle aortas purloin occult merchantmen complainers patchier penlites clasps recoup continue rookie stuffed dipsomania footloose muralists unloved trickiest savvied minefields mainland coifed attempt uniform seventeens roasted technicians corsair stalemate terraria impulses scuds preparation tinier cattail limpet overeaten niter trammelled investiture administrators interstates carpets officious aseptic illusive mentored upend repeater commandoes middle reverenced",
            shuffle: true,
            limit: 50,
        },
        {
            name: "Dvorak 4 [bgjqwxyz]",
            text: "banqueting squishes bisque antiquated bonging zoned batting hobbyist jawed awash swath showbiz soybean aqueous whitings subduing outsizes oxygenated headwinds downy seabeds bandits thawed anaesthetizing adjoin absenting wends signings highs joists dinginess doggonedest budge anaesthetize downsizes inundating indebted waysides busyness gauziest ghosting antique dogged satiny twinning swathing signets subjugating hogshead aweigh antiquates instigates bogeys seized gabbing ghettoes dousing bingeing beads adequate sandhogs dizziest agitations dozing gowned toxins swagged botany sexist bagging aquas debase baths shebangs adobes budged hubbies nightgown gunshot budgets headbands hogging guest beatings snobbishness nabbing snowy equation sowing washtub twinned washout yeast dotage hiding banjoist quanta beaded owning dyeing",
            shuffle: true,
            limit: 50,
        },
        {
            name: "Dvorak 5 [a-z]",
            text: "charmed limns headgear sanserif coinciding bottling commentaries normal intervene hippest restatements draftier grubbiest empire crystallizes kinglier embracing hybrid spins washtubs upkeep sweetheart chateaus ethics brands parting hospitalize heaping perspired retorting alternated prettified islets moneybag straightens boogieing steed directional annoyingly typewrite routinize interact comparatively glorious forego contingency neurotically simplicity geegaws implausibly corpora journalists conscientious disgustingly appeases proportionate feasible dropping counteracts terrorize northerners vehemently opined meets portioning ammonia aesthetes usage legatees suspicious chaster equipment hangings sandbagging laundresses mortality underacted districts incoherence nibbles refrigerating wallet footing backings register grits fleeced amongst spake sponger shareholder dorkier superman excited pommel rhinoceroses whaler piddling hydrae prerecords",
            shuffle: true,
            limit: 50,
        },
        {
            name: "Dvorak 6 [A-Z]",
            text: "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG THE WIZARD QUICKLY JINXED THE GNOMES BEFORE THEY VAPORIZED",
        },
        {
            name: "Quote 1",
            text: "Let me tell you why you're here. You're here because you know something. What you know you can't explain, but you feel it. You've felt it your entire life, that there's something wrong with the world. You don't know what it is, but it's there, like a splinter in your mind, driving you mad. It is this feeling that has brought you to me. Do you know what I'm talking about?",
        },
    ];
})();

/* global WPM */
(function($) {
    'use strict';

    // Game
    var game = new WPM.Game();

    // Input
    var keyboardMapper = new WPM.KeyboardMapper();

    var input = new WPM.Input($(document), keyboardMapper);
    $(input).on('letterpress.wpm', function(e) {
        game.letterTyped(e.letter);
    });
    $(input).on('backspacepress.wpm', function() {
        game.backspaceTyped();
    });

    // Views
    var paraBox = new WPM.ParaBox(WPM.paragraphs, $('#para-box'));
    $(paraBox).on('paragraphchange.wpm', function(e) {
        game.start(e.name, e.paragraph, 3);
    });

    var typeBox = new WPM.TypeBox($('#type-box'));
    $(game).on('modechange.wpm', typeBox.modeChanged);
    $(game).on('countdown.wpm', typeBox.countdown);
    $(game).on('textchange.wpm', typeBox.textChanged);
    $(game).on('scorechange.wpm', typeBox.scoreChanged);

    var statsBox = new WPM.StatsBox($('#stats-box'));
    $(game).on('modechange.wpm', statsBox.modeChanged);
    $(game).on('scorechange.wpm', statsBox.scoreChanged);

    var layoutBox = new WPM.LayoutBox($('#qwerty-layout'), $('#dvorak-layout'), $('#map-qwerty-to-dvorak'));
    $(game).on('modechange.wpm', layoutBox.modeChanged);
    $(game).on('textchange.wpm', layoutBox.textChanged);
    $(layoutBox).on('layoutchange.wpm', function (e) {
        keyboardMapper.changeMap(e.mapName);
    });

    var socialBox = new WPM.SocialBox($('#social-box'));
    $(game).on('scorechange.wpm', socialBox.scoreChanged);

    // Start the game loop
    game.init();
})(jQuery);