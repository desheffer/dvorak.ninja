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
