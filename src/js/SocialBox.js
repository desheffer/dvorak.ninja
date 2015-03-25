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

        firebase.authAnonymously(function(error, authData) {
            if (authData) {
                user = authData;

                var userRef = firebase.child('presence').child(user.uid);
                userRef.onDisconnect().remove();
                userRef.set(true);

                // social.find('.me .avatar').css('background-color', hashToColor(user.uid));
                // social.find('.me .name').text(hashToName(user.uid));
            }
        });

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
            if (e.complete !== true) {
                return;
            }

            firebase.child('score').push({
                user: {
                    name: hashToName(user.uid),
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
