/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function() {
        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        firebase.authAnonymously(function(error, authData) {
            if (authData) {
                user = authData;

                var userRef = firebase.child('presence').child(user.uid);
                userRef.onDisconnect().remove();
                userRef.set(true);
            }
        });

        firebase.child('presence').on('value', function(snapshot) {
            var count = Object.keys(snapshot.val()).length;
            console.log(count + ' users online');
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
