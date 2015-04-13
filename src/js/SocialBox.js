/* global Firebase: false */
(function($, Firebase) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.SocialBox = function(social) {
        var modes = window.WPM.gameModes;

        var firebase = new Firebase(window.WPM.firebaseURL);
        var user;

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

        this.userChanged = function(newUser) {
            // Remove presence for old session.
            if (user) {
                firebase.child('presence').child(user.uid).remove();
            }

            user = newUser;

            // Add presence for new session.
            if (user) {
                var userRef = firebase.child('presence').child(user.uid);
                userRef.onDisconnect().remove();
                userRef.set(true);
            }

        };

        this.scoreChanged = function(e) {
            if (e.mode !== modes.POSTGAME) {
                return;
            }

            firebase.child('score').push({
                user: {
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
