/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function(social) {
        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        function djb2(str){
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
            }
            return hash;
        }

        function userToColor(str) {
            var hash = djb2(str);
            var r = (hash & 0xFF0000) >> 16;
            var g = (hash & 0x00FF00) >> 8;
            var b = hash & 0x0000FF;
            return '#' + ('0' + r.toString(16)).substr(-2) + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
        }

        function userToName(str) {
            return 'Guest' + djb2(str).toString(10).substr(-5);
        }

        firebase.authAnonymously(function(error, authData) {
            if (authData) {
                user = authData;

                var userRef = firebase.child('presence').child(user.uid);
                userRef.onDisconnect().remove();
                userRef.set(true);

                social.find('.me .avatar').css('background-color', userToColor(user.uid));
                social.find('.me .name').text(userToName(user.uid));
            }
        });

        firebase.child('presence').on('value', function(snapshot) {
            var count = Object.keys(snapshot.val()).length;
            social.find('.user-count .value').text(count);
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
