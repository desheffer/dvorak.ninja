/* global firebase */
(function($, firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.LoginBox = function(login) {
        var that = this;

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

        function updateLinks() {
            if (user && user._displayName) {
                login.find('.username').text(user._displayName);
            } else {
                login.find('.username').text('---------');
            }

            login.find('.links').html('');

            if (!user || user.isAnonymous) {
                $('<a href="#">Log in</a>')
                    .on('click', function () {
                        var provider = new firebase.auth.GoogleAuthProvider();
                        firebase.auth().signInWithPopup(provider);

                        return false;
                    })
                    .appendTo(login.find('.links'));
            } else {
                $('<a href="#">Log out</a>')
                    .on('click', function () {
                        firebase.auth().signOut();

                        return false;
                    })
                    .appendTo(login.find('.links'));
            }
        }

        this.init = function() {
            // Delay binding until something is listening.
            firebase.auth().onAuthStateChanged(function(newUser) {
                user = newUser;

                if (!user) {
                    firebase.auth().signInAnonymously();
                } else if (user.isAnonymous) {
                    user._displayName = hashToName(user.uid);
                } else {
                    user._displayName = user.providerData[0].displayName;
                }

                updateLinks();

                $(that).trigger({
                    type: 'userchange.wpm',
                    user: user,
                });
            });
        };
    };
})($, firebase);
