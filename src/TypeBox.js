/* global Chartist: false */
/* global vex: false */
(function($, Chartist, vex) {
    'use strict';

    window.WPM = window.WPM || {};

    window.WPM.TypeBox = function(type, stats) {
        function renderTextAndStats(correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
            var remaining = notYetTyped.substr(incorrectlyTyped.length);
            type.find('.correct').text(correctlyTyped);
            type.find('.incorrect').text(incorrectlyTyped);
            type.find('.remaining').text(remaining);

            var characters = correctlyTyped.length;
            var words = correctlyTyped.length / 5;
            var wpm = words / (seconds / 60);

            renderStats(
                wpm ? ~~wpm : 0,
                characters,
                ~~words,
                seconds
            );
        }

        function renderStats(wpm, characters, words, seconds) {
            var time;
            if (seconds !== undefined) {
                var min = ~~(seconds / 60);
                var sec = ~~(seconds - min * 60);
                time = min + ':' + (sec < 10 ? '0' + sec : sec);
            }

            stats.find('.wpm .value').text(wpm !== undefined ? wpm : '--');
            stats.find('.wpm-meter meter').val(isFinite(wpm) ? wpm : 0);
            stats.find('.characters .value').text(characters !== undefined ? characters : '--');
            stats.find('.words .value').text(words !== undefined ? words : '--');
            stats.find('.time .value').text(time !== undefined ? time : '-:--');
        }

        this.renderInitial = function () {
            if (type.data('mode') !== 'initial') {
                type.data('mode', 'initial');
                type.html('<div class="overlay">Select a paragraph from above</div>');
                type.removeClass('completed');
            }

            renderStats();
        };

        this.renderCountdown = function (seconds) {
            if (type.data('mode') !== 'countdown') {
                type.data('mode', 'countdown');
                type.html('<div class="overlay"></div>');
                type.removeClass('completed');
            }

            type.find('.overlay').text('- ' + Math.ceil(seconds) + ' -');

            renderTextAndStats('', '', '', 0);
        };

        this.renderProgress = function(correctlyTyped, incorrectlyTyped, notYetTyped, seconds) {
            if (type.data('mode') !== 'progress') {
                type.data('mode', 'progress');
                type.html(
                    '<span class="correct"></span>' +
                    '<span class="incorrect"></span>' +
                    '<span class="cursor"></span>' +
                    '<span class="remaining"></span>'
                );
                type.removeClass('completed');
            }

            renderTextAndStats(correctlyTyped, incorrectlyTyped, notYetTyped, seconds);
        };

        this.renderCompleted = function(correctlyTyped, seconds, histogram, incorrect) {
            if (type.data('mode') !== 'completed') {
                type.data('mode', 'completed');
                type.html('<span class="correct"></span>');
                type.addClass('completed');
            }

            renderTextAndStats(correctlyTyped, '', '', seconds);

            var score = vex.open({});

            $('<h2>').text('Score card').appendTo(score);

            var chart = $('<div class="ct-chart">').appendTo(score);

            new Chartist.Line(chart.get(0), {
                labels: Object.keys(histogram),
                series: [histogram],
            }, {
                showArea: true,
                showPoint: false,
                fullWidth: true,
                axisX: {
                    showLabel: false,
                    showGrid: false,
                },
            });

            var accuracy = correctlyTyped.length / (correctlyTyped.length + incorrect) * 100;
            var wpm = (correctlyTyped.length / 5) / (seconds / 60);

            var max = 0;
            for (var val in histogram) {
                max = Math.max(max, histogram[val]);
            }

            var dl = $('<dl class="dl-horizontal">').appendTo(score);
            $('<dt>').text('Accuracy:').appendTo(dl);
            $('<dd>').text(~~accuracy + '%').appendTo(dl);
            $('<dt>').text('Average WPM:').appendTo(dl);
            $('<dd>').text(~~wpm).appendTo(dl);
            $('<dt>').text('Maximum WPM:').appendTo(dl);
            $('<dd>').text(~~max).appendTo(dl);
        };
    };

    vex.defaultOptions.className = 'vex-theme-default';
})($, Chartist, vex);
