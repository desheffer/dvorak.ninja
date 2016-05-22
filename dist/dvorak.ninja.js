/*! dvorak.ninja 2016-05-22 */
(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.gameModes = {
        IDLE: 'idle',
        PREGAME: 'pregame',
        PLAYING: 'playing',
        POSTGAME: 'postgame',
    };

    window.WPM.Game = function() {
        var that = this;

        var modes = window.WPM.gameModes;
        var timer;

        // Current game mode.
        var mode;

        // Start time for the current game.
        var startTime;

        // Name of the current word set.
        var wordSetName;

        // Current word list being typed, based on a word set.
        var wordsToType;

        // Text that has been correctly typed, a subset of wordsToType.
        var correctlyTyped;

        // Text that has been incorrectly typed.
        var incorrectlyTyped;

        // Text that has not yet been correctly typed, a subset of wordsToType.
        var notYetTyped;

        // Count of all letter presses for the current game.
        var totalTyped;

        // Log of all correct letter presses.
        var times;

        function currentMode() {
            var hasText = notYetTyped !== undefined && notYetTyped.length > 0;

            if (hasText && startTime === undefined) {
                return modes.PREGAME;
            } else if (hasText && startTime !== undefined) {
                return modes.PLAYING;
            } else if (!hasText && startTime !== undefined) {
                return modes.POSTGAME;
            }

            return modes.IDLE;
        }

        function tick() {
            clearInterval(timer);
            timer = undefined;

            var oldMode = mode;
            mode = currentMode();

            // Trigger the score change event when the game mode is PLAYING or
            // has just changed from PLAYING.
            if (oldMode === modes.PLAYING || mode === modes.PLAYING) {
                var seconds = ($.now() - startTime) / 1000;
                var characters = correctlyTyped.length;
                var words = correctlyTyped.length / 5;
                var wpm = words / (seconds / 60);
                var accuracy = characters / totalTyped * 100;

                $(that).trigger({
                    type: 'scorechange.wpm',
                    mode: mode,
                    seconds: seconds,
                    characters: characters,
                    words: words,
                    wpm: wpm,
                    accuracy: accuracy,
                    wordSetName: wordSetName,
                    times: times,
                });
            }

            // Trigger the mode change event.
            if (mode !== oldMode) {
                $(that).trigger({
                    type: 'modechange.wpm',
                    mode: mode,
                    oldMode: oldMode,
                });
            }

            if (mode === modes.PREGAME || oldMode === modes.PREGAME) {
                $(that).trigger({
                    type: 'textchange.wpm',
                    mode: mode,
                    correctlyTyped: correctlyTyped,
                    incorrectlyTyped: incorrectlyTyped,
                    notYetTyped: notYetTyped,
                    nextLetter: notYetTyped[0],
                    change: 0,
                });
            }

            if (mode === modes.PLAYING) {
                timer = setTimeout(tick, 100);
            }
        }

        this.init = function() {
            if (mode !== undefined) {
                return;
            }

            tick();
        };

        this.changeWordList = function(name, wordList) {
            startTime = undefined;

            wordSetName = name;
            wordsToType = notYetTyped = wordList;
            correctlyTyped = incorrectlyTyped = '';
            totalTyped = 0;
            times = [];

            tick();
        };

        this.start = function() {
            if (mode !== modes.PREGAME) {
                return;
            }

            startTime = $.now();
            tick();
        };

        this.letterTyped = function(letter) {
            if (mode === modes.PREGAME) {
                this.start();
                return;
            }

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

        var modes = window.WPM.gameModes;

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
            if (e.mode !== modes.PLAYING) {
                return;
            }

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

/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.LoginBox = function(login) {
        var that = this;

        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        function djb2(str){
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = (hash << 5) + hash + str.charCodeAt(i);
            }
            return hash;
        }

        function hashToName(str) {
            return 'Guest' + djb2(str).toString(10).substr(-5);
        }

        function updateLinks() {
            if (user) {
                login.find('.username').text(user.displayName);
            } else {
                login.find('.username').text('---------');
            }

            login.find('.links').html('');

            if (!user || user.provider === 'anonymous') {
                $('<a href="#">Log in</a>')
                    .on('click', function () {
                        firebase.authWithOAuthPopup('google', function() {});

                        return false;
                    })
                    .appendTo(login.find('.links'));
            } else {
                $('<a href="#">Log out</a>')
                    .on('click', function () {
                        firebase.unauth(function() {});
                        firebase.authAnonymously(function() {});

                        return false;
                    })
                    .appendTo(login.find('.links'));
            }
        }

        this.init = function() {
            // Delay binding until something is listening.
            firebase.onAuth(function(authData) {
                user = authData;

                if (user && user.provider === 'anonymous') {
                    user.displayName = hashToName(user.uid);
                } else if (user && user.provider === 'google') {
                    user.displayName = user.google.displayName;
                }

                updateLinks();

                $(that).trigger({
                    type: 'userchange.wpm',
                    user: user,
                });
            });

            if (!firebase.getAuth()) {
                firebase.authAnonymously(function() {});
            }
        };
    };
})($, Firebase);

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ScoreBox = function(score) {
        var modes = window.WPM.gameModes;

        function minAndMaxWpm(times) {
            var wpm = {};
            var cpsToWpm = 60 / 5;

            for (var i in times) {
                var chars = 0;
                var chars5 = 0;
                var duration = 0;

                for (var j = i; j >= 0; j--) {
                    duration += times[j].duration;

                    if (duration <= 1000) {
                        chars++;
                    }

                    if (duration <= 5000) {
                        chars5++;
                    } else {
                        break;
                    }
                }

                if (duration >= 1000) {
                    wpm.min = Math.min(wpm.min || Infinity, chars * cpsToWpm);
                    wpm.max = Math.max(wpm.max || 0, chars * cpsToWpm);
                }

                if (duration >= 5000) {
                    wpm.min5 = Math.min(wpm.min5 || Infinity, chars5 * cpsToWpm / 5);
                    wpm.max5 = Math.max(wpm.max5 || 0, chars5 * cpsToWpm / 5);
                }
            }

            return wpm;
        }

        function missedLettersByFrequency(times) {
            var letters = {};
            var letter;

            for (var i in times) {
                letter = times[i].letter;

                if (letters[letter] === undefined) {
                    letters[letter] = {
                        letter: letter,
                        count: 0,
                        duration: 0,
                        average: 0,
                    };
                }

                letters[letter].count++;
                letters[letter].duration += times[i].duration;
                letters[letter].average = letters[letter].duration / letters[letter].count;
            }

            var lettersArr = [];
            for (letter in letters) {
                lettersArr.push(letter);
            }

            lettersArr.sort(function(a, b) {
                return letters[b].average - letters[a].average;
            });

            return lettersArr;
        }

        this.modeChanged = function(e) {
            if (e.mode !== modes.POSTGAME) {
                score.css('visibility', 'hidden');
                score.find('.min .value1').text('--');
                score.find('.min .value5').text('--');
                score.find('.max .value1').text('--');
                score.find('.max .value5').text('--');
                score.find('.missed .value').text('- - - - -');
            }
        };

        this.scoreChanged = function(e) {
            if (e.mode !== modes.POSTGAME) {
                return;
            }

            var missed = missedLettersByFrequency(e.times);
            var wpm = minAndMaxWpm(e.times);

            score.find('.min .value1').text(wpm.min !== undefined ? ~~wpm.min : '??');
            score.find('.min .value5').text(wpm.min5 !== undefined ? ~~wpm.min5 : '??');
            score.find('.max .value1').text(wpm.max !== undefined ? ~~wpm.max : '??');
            score.find('.max .value5').text(wpm.max5 !== undefined ? ~~wpm.max5 : '??');
            score.find('.missed .value').text(missed.splice(0, 5).join(' '));
            score.css('visibility', 'visible');
        };
    };
})();

/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function(social) {
        var modes = window.WPM.gameModes;

        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        firebase.child('presence')
            .on('value', function(snapshot) {
                var count = Object.keys(snapshot.val()).length;
                social.find('.user-count .value').text(count);
            });

        firebase.child('score')
            .orderByChild('timestamp')
            .limitToLast(5)
            .on('child_added', function(snapshot) {
                var table = social.find('table');
                var tbody = table.find('tbody');
                if (tbody.length === 0) {
                    tbody = $('<tbody>').appendTo(table);
                }

                var val = snapshot.val();

                var time;
                var min = ~~(val.score.seconds / 60);
                var sec = ~~(val.score.seconds - min * 60);
                time = min + ':' + ('0' + sec).substr(-2);

                var date = new Date(val.timestamp);

                var tr = $('<tr>');
                $('<td>').text(val.user.displayName).appendTo(tr);
                $('<td>').text(~~val.score.wpm).appendTo(tr);
                $('<td>').text(~~val.score.accuracy + '%').appendTo(tr);
                $('<td>').text(~~val.score.characters).appendTo(tr);
                $('<td>').text(time).appendTo(tr);
                $('<td>').text(val.wordSet.name).appendTo(tr);
                $('<td>').text(date.toLocaleString()).appendTo(tr);
                tr.prependTo(tbody);

                tbody.children().slice(5).remove();
            });

        this.userChanged = function(newUser) {
            // Remove presence for old session.
            if (user) {
                firebase.child('presence').child(user.uid).remove();
            }

            user = newUser;

            // Add presence for new session.
            if (user) {
                var userRef = firebase.child('presence').child(user.uid);
                userRef.onDisconnect().remove();
                userRef.set(true);
            }

        };

        this.scoreChanged = function(e) {
            if (e.mode !== modes.POSTGAME) {
                return;
            }

            firebase.child('score').push({
                user: {
                    displayName: user.displayName,
                },
                timestamp: e.timeStamp,
                wordSet: {
                    name: e.wordSetName,
                },
                score: {
                    seconds: e.seconds,
                    characters: e.characters,
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
            if (e.mode === modes.PREGAME || e.mode === modes.IDLE) {
                stats.find('.wpm .value').text('---');
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
            stats.find('.accuracy .value').text(~~e.accuracy + '%');
            stats.find('.characters .value').text(~~e.characters);
            stats.find('.time .value').text(time);
        };
    };
})();

(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type, overlay) {
        var modes = window.WPM.gameModes;

        function htmlEscape(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\s/g, '&nbsp;');
        }

        this.modeChanged = function(e) {
            if (e.mode === modes.IDLE) {
                overlay.html('&mdash; Select a word set from above &mdash;').show();
                type.html('');
            } else if (e.mode === modes.PREGAME) {
                overlay.html('&mdash; Press any key to begin &mdash;').show();
                type.html('<span class="remaining"></span>');
            } else if (e.mode === modes.PLAYING) {
                overlay.html('').hide();
                type.html(
                    '<span class="correct"></span>' +
                    '<span class="incorrect"></span>' +
                    '<span class="cursor"></span>' +
                    '<span class="remaining"></span>'
                );
            }

            type.toggleClass('completed', e.mode === modes.POSTGAME);
        };

        this.textChanged = function(e) {
            var i;

            // Correct text is everything that has been typed correctly.  Line
            // breaks are added after spaces.
            var correct = '';
            for (i = 0; i < e.correctlyTyped.length; i++) {
                correct += htmlEscape(e.correctlyTyped[i]);
                if (e.correctlyTyped[i] === ' ') {
                    correct += '<wbr>';
                }
            }

            // Incorrect text is anything that has been typed incorrectly.
            // Line breaks are transposed from the spaces in the intended word
            // list.
            var incorrect = '';
            for (i = 0; i < e.incorrectlyTyped.length; i++) {
                incorrect += htmlEscape(e.incorrectlyTyped[i]);
                if (i >= e.notYetTyped.length || e.notYetTyped[i] === ' ') {
                    incorrect += '<wbr>';
                }
            }

            // Remaining text is anything left to be typed minus errors.  Line
            // breaks are added after spaces.
            var remaining = '';
            for (i = e.incorrectlyTyped.length; i < e.notYetTyped.length; i++) {
                remaining += htmlEscape(e.notYetTyped[i]);
                if (e.notYetTyped[i] === ' ') {
                    remaining += '<wbr>';
                }
            }

            type.find('.correct').html(correct);
            type.find('.incorrect').html(incorrect);
            type.find('.remaining').html(remaining);
        };

        this.scoreChanged = function(e) {
            if (e.mode !== modes.POSTGAME) {
                return;
            }

            var min = Infinity;
            var max = 500;

            for (var i in e.times) {
                min = Math.min(min, e.times[i].duration);
                max = Math.max(max, e.times[i].duration);
            }

            type.html('<span class="results"></span>');
            var results = type.find('.results');

            for (i in e.times) {
                var percent = (e.times[i].duration - min) / (max - min);

                var letter = htmlEscape(e.times[i].letter);
                if (e.times[i].letter === ' ') {
                    letter += '<wbr>';
                }

                $('<span class="letter">')
                    .html(letter)
                    .css('background-color', 'rgba(217, 83, 79, ' + percent + ')')
                    .appendTo(results);
            }
        };
    };
})();

(function($) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.WordSetBox = function(wordSets, container) {
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

        for (var i in wordSets) {
            var li = $('<li>');
            $('<a class="word-set" href="#">')
                .text(wordSets[i].name)
                .data('word-set', wordSets[i].text)
                .data('shuffle', wordSets[i].shuffle === true)
                .data('limit', wordSets[i].limit)
                .appendTo(li);
            li.appendTo(container);
        }

        container.find('a.word-set').on('click', function() {
            var wordList = $(this).data('word-set');

            if ($(this).data('shuffle') === true) {
                wordList = shuffle(wordList.split(' ')).join(' ');
            }

            var limit = $(this).data('limit');
            if (limit > 0) {
                wordList = wordList.split(' ').slice(0, limit).join(' ');
            }

            $(that).trigger({
                type: 'wordlistchange.wpm',
                name: $(this).text(),
                wordList: wordList,
            });

            container.find('li a.active').removeClass('active');
            $(this).addClass('active').blur();
            return false;
        });
    };
})(jQuery);

(function() {
    "use strict";

    window.WPM = window.WPM || {};

    window.WPM.firebaseURL = "http://dvorak-ninja.firebaseio.com/";

    window.WPM.wordSets = [
        {
            name: "Dvorak 1 [aeouhtns]",
            text: "eats unset seats noses onto asset sane note oath nests shut hates shush tans sate hues tune oats shoot shoe auto shot autos totes antes tenet huts nest ethos host shoos tonne tan sooth stone net nose stuns test east shout too shuts souse sheet one tenon son hose snots ton sent toes tees out senna nun tutus tease tunes sees tots that tho the state eases shoo aeon noon noose hath taste nosh hat hens tost hoes eons tutu teen neon hue ten anon nth tones neat tush anons sues ones set heats none teeth sea stun aunt stout",
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
            name: "Quote 1",
            text: "Let me tell you why you're here.  You're here because you know something.  What you know you can't explain, but you feel it.  You've felt it your entire life, that there's something wrong with the world.  You don't know what it is, but it's there, like a splinter in your mind, driving you mad.  It is this feeling that has brought you to me.  Do you know what I'm talking about?",
        },
        {
            name: "Quote 2",
            text: "The path of the righteous man is beset on all sides by the iniquities of the selfish and the tyranny of evil men.  Blessed is he who, in the name of charity and good will, shepherds the weak through the valley of darkness, for he is truly his brother's keeper and the finder of lost children.  And I will strike down upon thee with great vengeance and furious anger those who attempt to poison and destroy my brothers.  And you will know my name is the Lord when I lay my vengeance upon thee.",
        },
    ];
})();

/* global ga */
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
    var wordSetBox = new WPM.WordSetBox(WPM.wordSets, $('#word-set-box'));
    $(wordSetBox).on('wordlistchange.wpm', function(e) {
        game.changeWordList(e.name, e.wordList);
        ga('send', 'event', 'WordList', 'change', e.name);
    });

    var typeBox = new WPM.TypeBox($('#type-box'), $('#overlay-box'));
    $(game).on('modechange.wpm', typeBox.modeChanged);
    $(game).on('textchange.wpm', typeBox.textChanged);
    $(game).on('scorechange.wpm', typeBox.scoreChanged);

    var statsBox = new WPM.StatsBox($('#stats-box'));
    $(game).on('modechange.wpm', statsBox.modeChanged);
    $(game).on('scorechange.wpm', statsBox.scoreChanged);

    var layoutBox = new WPM.LayoutBox($('#qwerty-layout'), $('#dvorak-layout'), $('#map-qwerty-to-dvorak'));
    $(game).on('modechange.wpm', layoutBox.modeChanged);
    $(game).on('textchange.wpm', layoutBox.textChanged);
    $(layoutBox).on('layoutchange.wpm', function(e) {
        keyboardMapper.changeMap(e.mapName);
    });

    var scoreBox = new WPM.ScoreBox($('#score-box'));
    $(game).on('modechange.wpm', scoreBox.modeChanged);
    $(game).on('scorechange.wpm', scoreBox.scoreChanged);

    var socialBox = new WPM.SocialBox($('#social-box'));
    $(game).on('scorechange.wpm', socialBox.scoreChanged);

    var loginBox = new WPM.LoginBox($('#login-box'));
    $(loginBox).on('userchange.wpm', function(e) {
        socialBox.userChanged(e.user);
    });
    loginBox.init();

    // Start the game loop
    game.init();

    $('#widget').show();
})(jQuery);
