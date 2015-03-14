/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function() {
        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        firebase.authAnonymously(function(error, authData) {
            if (!error) {
                user = authData;
                console.log('user uid:', user.uid);
            }
        });

        this.scoreChanged = function(e) {
            if (e.complete !== true) {
                return;
            }

            firebase.child(user.uid).push({
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
