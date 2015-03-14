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
    var paraBox = new WPM.ParaBox(WPM.paragraphs, $('#paragraphs'), game);
    $(paraBox).on('paragraphchange.wpm', function(e) {
        game.start(e.paragraph, 3);
    });

    var typeBox = new WPM.TypeBox($('#type'));
    $(game).on('modechange.wpm', typeBox.modeChanged);
    $(game).on('countdown.wpm', typeBox.countdown);
    $(game).on('textchange.wpm', typeBox.textChanged);

    var statsBox = new WPM.StatsBox($('#stats'));
    $(game).on('modechange.wpm', statsBox.modeChanged);
    $(game).on('scorechange.wpm', statsBox.scoreChanged);

    var layoutBox = new WPM.LayoutBox($('#qwerty-layout'), $('#dvorak-layout'), $('#map-qwerty-to-dvorak'));
    $(game).on('textchange.wpm', layoutBox.textChanged);
    $(layoutBox).on('layoutchange.wpm', function (e) {
        keyboardMapper.changeMap(e.mapName);
    });

    var scoreCard = new WPM.ScoreCard();
    $(game).on('modechange.wpm', scoreCard.modeChanged);
    $(game).on('textchange.wpm', scoreCard.textChanged);
    $(game).on('scorechange.wpm', scoreCard.scoreChanged);

    // Start the game loop
    game.init();
})($);
