(function() {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.Clock = function() {
        this.time = function() {
            return new Date().getTime() / 1000;
        };
    };
})();
