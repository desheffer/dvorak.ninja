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
    $(wordSetBox).on('wordsetchange.wpm', function(e) {
        game.start(e.name, e.wordSet, 3);
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

    var scoreBox = new WPM.ScoreBox($('#score-box'));
    $(game).on('modechange.wpm', scoreBox.modeChanged);
    $(game).on('scorechange.wpm', scoreBox.scoreChanged);

    var socialBox = new WPM.SocialBox($('#social-box'));
    $(game).on('scorechange.wpm', socialBox.scoreChanged);

    // Start the game loop
    game.init();

    $('#widget').show();
})(jQuery);
