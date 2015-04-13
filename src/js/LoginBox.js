/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.LoginBox = function(login) {
        var that = this;

        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        function djb2(str){
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = (hash << 5) + hash + str.charCodeAt(i);
            }
            return hash;
        }

        function hashToName(str) {
            return 'Guest' + djb2(str).toString(10).substr(-5);
        }

        firebase.onAuth(function(authData) {
            user = authData;

            if (user && user.provider === 'anonymous') {
                user.displayName = hashToName(user.uid);
            } else if (user && user.provider === 'google') {
                user.displayName = user.google.displayName;
            }

            updateLinks();

            $(that).trigger({
                type: 'userchange.wpm',
                user: user,
            });
        });

        function updateLinks() {
            if (user) {
                login.find('.status').text(user.displayName);
            } else {
                login.find('.status').text('');
            }

            login.find('.links').html('');

            if (!user || user.provider === 'anonymous') {
                $('<a href="#">Log in</a>')
                    .on('click', function () {
                        firebase.authWithOAuthPopup('google', function() {});

                        return false;
                    })
                    .appendTo(login.find('.links'));
            } else {
                $('<a href="#">Log out</a>')
                    .on('click', function () {
                        firebase.unauth(function() {});
                        firebase.authAnonymously(function() {});

                        return false;
                    })
                    .appendTo(login.find('.links'));
            }
        }

        if (!firebase.getAuth()) {
            firebase.authAnonymously(function() {});
        }
    };
})($, Firebase);
