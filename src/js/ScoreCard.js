/* global vex: false */
/* global Chartist: false */
(function($, vex, Chartist) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.ScoreCard = function() {
        var modes = window.WPM.gameModes;

        var startTime;
        var cpsLog;
        var wpmLog;

        var wpmAverage;
        var wpmMax;
        var accuracy;

        function showScoreCard() {
            var score = vex.open({});

            $('<h2>').text('Score card').appendTo(score);

            var chart = $('<div class="ct-chart">').appendTo(score);

            var times = [];
            var cpsHistogram = [];
            var wpmHistogram = [];

            var endTime = ~~($.now() / 1000);
            for (var time = ~~(startTime / 1000); time < endTime; time++) {
                times.push(time);
                cpsHistogram.push(cpsLog[time] || 0);
                wpmHistogram.push(wpmLog[time] || 0);
            }

            new Chartist.Line(chart.get(0), {
                labels: times,
                series: [cpsHistogram, wpmHistogram],
            }, {
                showArea: true,
                showPoint: false,
                fullWidth: true,
                axisX: {
                    showLabel: false,
                    showGrid: false,
                },
            });

            var dl = $('<dl class="dl-horizontal">').appendTo(score);
            $('<dt>').text('Average WPM:').appendTo(dl);
            $('<dd>').text(~~wpmAverage).appendTo(dl);
            $('<dt>').text('Maximum WPM:').appendTo(dl);
            $('<dd>').text(~~wpmMax).appendTo(dl);
            $('<dt>').text('Accuracy:').appendTo(dl);
            $('<dd>').text(~~accuracy + '%').appendTo(dl);
        }

        this.modeChanged = function(e) {
            if (e.mode === modes.PLAYING) {
                startTime = $.now();
                cpsLog = {};
                wpmLog = {};
                wpmAverage = wpmMax = accuracy = 0;
            }
        };

        this.textChanged = function(e) {
            var now = ~~(e.timeStamp / 1000);
            var wpm = e.change * 60 / 5;
            cpsLog[now] = (cpsLog[now] || 0) + wpm;
        };

        this.scoreChanged = function(e) {
            var now = ~~(e.timeStamp / 1000);
            wpmLog[now] = e.wpm;
            wpmAverage = e.wpm;
            wpmMax = Math.max(wpmMax, e.wpm);
            accuracy = e.accuracy;

            if (e.complete) {
                showScoreCard();
            }
        };
    };
})($, vex, Chartist);
