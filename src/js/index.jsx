/* global ga */
/* global firebase */

import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom'

import { Firebase, WordSets } from './Config';
import Game from './Game';
import GameModes from './GameModes';
import KeyboardMapper from './KeyboardMapper';
import Input from './Input';
import WordSetBox from './WordSetBox';
import TypeBox from './TypeBox';
import LayoutBox from './LayoutBox';
import ScoreBox from './ScoreBox';
import SocialBox from './SocialBox';
import LoginBox from './LoginBox';

firebase.initializeApp(Firebase);

var game = render(
    <Game />,
    document.getElementById('root')
);

// Input
var keyboardMapper = new KeyboardMapper();

var input = new Input($(document), keyboardMapper);
$(input).on('letterpress.wpm', function(e) {
    game.letterTyped(e.letter);
});
$(input).on('backspacepress.wpm', function() {
    game.backspaceTyped();
});

// Views
var wordSetBox = new WordSetBox(WordSets, $('#word-set-box'));
$(wordSetBox).on('wordlistchange.wpm', function(e) {
    game.changeWordList(e.name, e.wordList);
    ga('send', 'event', 'WordList', 'change', e.name);
});

var typeBox = new TypeBox($('#type-box'), $('#overlay-box'));
$(game).on('modechange.wpm', typeBox.modeChanged);
$(game).on('textchange.wpm', typeBox.textChanged);
$(game).on('scorechange.wpm', typeBox.scoreChanged);

var layoutBox = new LayoutBox($('#qwerty-layout'), $('#dvorak-layout'), $('#map-qwerty-to-dvorak'));
$(game).on('modechange.wpm', layoutBox.modeChanged);
$(game).on('textchange.wpm', layoutBox.textChanged);
$(layoutBox).on('layoutchange.wpm', function(e) {
    keyboardMapper.changeMap(e.mapName);
});

var scoreBox = new ScoreBox($('#score-box'));
$(game).on('modechange.wpm', scoreBox.modeChanged);
$(game).on('scorechange.wpm', scoreBox.scoreChanged);

var socialBox = new SocialBox($('#social-box'));
$(game).on('scorechange.wpm', socialBox.scoreChanged);

var loginBox = new LoginBox($('#login-box'));
$(loginBox).on('userchange.wpm', function(e) {
    socialBox.userChanged(e.user);
});
loginBox.init();

// Start the game loop
game.init();

$('#widget').show();
