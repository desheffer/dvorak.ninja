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
