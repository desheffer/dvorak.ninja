/* global ga */

import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom'

import { WordSets } from './Config';
import Game from './Game';
import KeyboardMapper from './KeyboardMapper';
import Input from './Input';
import WordSetBox from './WordSetBox';
import LayoutBox from './LayoutBox';

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

var layoutBox = new LayoutBox($('#qwerty-layout'), $('#dvorak-layout'), $('#map-qwerty-to-dvorak'));
$(game).on('modechange.wpm', layoutBox.modeChanged);
$(game).on('textchange.wpm', layoutBox.textChanged);
$(layoutBox).on('layoutchange.wpm', function(e) {
    keyboardMapper.changeMap(e.mapName);
});

// Start the game loop
game.init();

$('#widget').show();
