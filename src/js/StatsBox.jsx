import Game from './Game';

export default class {
    constructor(stats) {
        var modes = Game.modes;

        this.modeChanged = function(e) {
            if (e.mode === modes.PREGAME || e.mode === modes.IDLE) {
                stats.find('.wpm .value').text('---');
                stats.find('.accuracy .value').text('---%');
                stats.find('.characters .value').text('---');
                stats.find('.time .value').text('-:--');
            }
        };

        this.scoreChanged = function(e) {
            var time;
            if (e.seconds !== undefined) {
                var min = ~~(e.seconds / 60);
                var sec = ~~(e.seconds - min * 60);
                time = min + ':' + ('0' + sec).substr(-2);
            }

            stats.find('.wpm .value').text(~~e.wpm);
            stats.find('.accuracy .value').text(~~e.accuracy + '%');
            stats.find('.characters .value').text(~~e.characters);
            stats.find('.time .value').text(time);
        };
    }
}
