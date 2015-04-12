/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function(social) {
        var modes = window.WPM.gameModes;

        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

        function djb2(str){
            var hash = 5381;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
            }
            return hash;
        }

        // function hashToColor(str) {
        //     var hash = djb2(str);
        //     var r = (hash & 0xFF0000) >> 16;
        //     var g = (hash & 0x00FF00) >> 8;
        //     var b = hash & 0x0000FF;
        //     return '#' + ('0' + r.toString(16)).substr(-2) + ('0' + g.toString(16)).substr(-2) + ('0' + b.toString(16)).substr(-2);
        // }

        function hashToName(str) {
            return 'Guest' + djb2(str).toString(10).substr(-5);
        }

        firebase.onAuth(function(authData) {
            user = authData;

            if (user.displayName === undefined) {
                user.displayName = hashToName(user.uid);
            }

            var userRef = firebase.child('presence').child(user.uid);
            userRef.onDisconnect().remove();
            userRef.set(true);
        });

        firebase.offAuth(function() {
            var userRef = firebase.child('presence').child(user.uid);
            userRef.remove();
        });

        // All users are automatically authenticated anonymously.
        if (!firebase.getAuth()) {
            firebase.authAnonymously(function() {
            });
        }

        // Users can choose to authenticate with Google.
        $('<a href="#">Login with Google</a>')
            .on('click', function () {
                firebase.authWithOAuthPopup('google', function() {
                });

                return false;
            })
            .appendTo(social);

        firebase.child('presence')
            .on('value', function(snapshot) {
                var count = Object.keys(snapshot.val()).length;
                social.find('.user-count .value').text(count);
            });

        firebase.child('score')
            .orderByChild('timestamp')
            .limitToLast(5)
            .on('child_added', function(snapshot) {
                var table = social.find('table');
                var tbody = table.find('tbody');
                if (tbody.length === 0) {
                    tbody = $('<tbody>').appendTo(table);
                }

                var val = snapshot.val();

                var time;
                var min = ~~(val.score.seconds / 60);
                var sec = ~~(val.score.seconds - min * 60);
                time = min + ':' + ('0' + sec).substr(-2);

                var date = new Date(val.timestamp);

                var tr = $('<tr>');
                $('<td>').text(val.user.name).appendTo(tr);
                $('<td>').text(~~val.score.wpm).appendTo(tr);
                $('<td>').text(~~val.score.accuracy + '%').appendTo(tr);
                $('<td>').text(~~val.score.characters).appendTo(tr);
                $('<td>').text(time).appendTo(tr);
                $('<td>').text(val.wordSet.name).appendTo(tr);
                $('<td>').text(date.toLocaleString()).appendTo(tr);
                tr.prependTo(tbody);

                tbody.children().slice(5).remove();
            });

        this.scoreChanged = function(e) {
            if (e.mode !== modes.POSTGAME) {
                return;
            }

            firebase.child('score').push({
                user: {
                    name: user.displayName, // TODO: Remove at some point.
                    displayName: user.displayName,
                },
                timestamp: e.timeStamp,
                wordSet: {
                    name: e.wordSetName,
                },
                score: {
                    seconds: e.seconds,
                    characters: e.characters,
                    wpm: e.wpm,
                    accuracy: e.accuracy,
                },
            });
        };
    };
})($, Firebase);
