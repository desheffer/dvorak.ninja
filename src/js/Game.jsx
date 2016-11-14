import React from 'react';

import GameModes from './GameModes';
import StatsBox from './components/StatsBox';
import TypeBox from './components/TypeBox';

class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mode: GameModes.IDLE,
            wpm: 0,
            accuracy: 0,
            characters: 0,
            seconds: 0,
        };

        this.timer = undefined;

        // Current game mode.
        this.mode = undefined;

        // Start time for the current game.
        this.startTime = undefined;

        // Name of the current word set.
        this.wordSetName = undefined;

        // Text this has been correctly typed.
        this.correctlyTyped = undefined;

        // Text this has been incorrectly typed.
        this.incorrectlyTyped = undefined;

        // Text this has not yet been correctly typed.
        this.notYetTyped = undefined;

        // Count of all letter presses for the current game.
        this.totalTyped = undefined;

        // Log of all correct letter presses.
        this.times = undefined;
    }

    init() {
        if (this.mode !== undefined) {
            return;
        }

        this.tick();
    }

    currentMode() {
        var hasText = this.notYetTyped !== undefined && this.notYetTyped.length > 0;

        if (hasText && this.startTime === undefined) {
            return GameModes.PREGAME;
        } else if (hasText && this.startTime !== undefined) {
            return GameModes.PLAYING;
        } else if (!hasText && this.startTime !== undefined) {
            return GameModes.POSTGAME;
        }

        return GameModes.IDLE;
    }

    tick() {
        clearInterval(this.timer);
        this.timer = undefined;

        var oldMode = this.mode;
        this.mode = this.currentMode();

        // Trigger the score change event when the game mode is PLAYING or
        // has just changed from PLAYING.
        if (oldMode === GameModes.PLAYING || this.mode === GameModes.PLAYING) {
            var seconds = ($.now() - this.startTime) / 1000;
            var characters = this.correctlyTyped.length;
            var words = this.correctlyTyped.length / 5;
            var wpm = words / (seconds / 60);
            var accuracy = characters / this.totalTyped * 100;

            $(this).trigger({
                type: 'scorechange.wpm',
                mode: this.mode,
                seconds: seconds,
                characters: characters,
                words: words,
                wpm: wpm,
                accuracy: accuracy,
                wordSetName: this.wordSetName,
                times: this.times,
            });

            this.setState({
                wpm: wpm,
                accuracy: accuracy,
                characters: characters,
                seconds: seconds,
            });
        }

        // Trigger the mode change event.
        if (this.mode !== oldMode) {
            $(this).trigger({
                type: 'modechange.wpm',
                mode: this.mode,
                oldMode: oldMode,
            });

            this.setState({
                mode: this.mode,
            });
        }

        if (this.mode === GameModes.PREGAME || oldMode === GameModes.PREGAME) {
            $(this).trigger({
                type: 'textchange.wpm',
                mode: this.mode,
                correctlyTyped: this.correctlyTyped,
                incorrectlyTyped: this.incorrectlyTyped,
                notYetTyped: this.notYetTyped,
                nextLetter: this.notYetTyped[0],
                change: 0,
            });

            this.setState({
                correctlyTyped: this.correctlyTyped,
                incorrectlyTyped: this.incorrectlyTyped,
                notYetTyped: this.notYetTyped,
            });
        }

        if (this.mode === GameModes.PLAYING) {
            this.timer = setTimeout(this.tick.bind(this), 100);
        }
    }

    changeWordList(name, wordList) {
        this.startTime = undefined;

        this.wordSetName = name;
        this.notYetTyped = wordList;
        this.correctlyTyped = this.incorrectlyTyped = '';
        this.totalTyped = 0;
        this.times = [];

        this.tick();
    }

    start() {
        if (this.mode !== GameModes.PREGAME) {
            return;
        }

        this.startTime = $.now();
        this.tick();
    }

    letterTyped(letter) {
        if (this.mode === GameModes.PREGAME) {
            this.start();
            return;
        }

        if (this.mode !== GameModes.PLAYING) {
            return;
        }

        this.totalTyped++;
        var delta = 0;
        var expected = this.notYetTyped.substr(0, 1);

        if (this.incorrectlyTyped.length === 0 && letter === expected) {
            // Add a correct letter
            this.correctlyTyped = this.correctlyTyped + letter;
            this.notYetTyped = this.notYetTyped.substr(1);
            delta = 1;

            var lastLetterTime = this.times.length > 0 ? this.times[this.times.length - 1].time : this.startTime;
            var newLetterTime = $.now();
            this.times.push({
                letter: letter,
                time: newLetterTime,
                duration: newLetterTime - lastLetterTime,
            });
        } else if (this.incorrectlyTyped.length <= 10) {
            // Add an incorrect letter
            this.incorrectlyTyped = this.incorrectlyTyped + letter;
        } else {
            return;
        }

        $(this).trigger({
            type: 'textchange.wpm',
            mode: this.mode,
            correctlyTyped: this.correctlyTyped,
            incorrectlyTyped: this.incorrectlyTyped,
            notYetTyped: this.notYetTyped,
            nextLetter: this.incorrectlyTyped ? false : this.notYetTyped[0],
            change: delta,
        });

        this.setState({
            correctlyTyped: this.correctlyTyped,
            incorrectlyTyped: this.incorrectlyTyped,
            notYetTyped: this.notYetTyped,
        });

        this.tick();
    }

    backspaceTyped() {
        if (this.mode !== GameModes.PLAYING) {
            return;
        }

        var delta = 0;

        if (this.incorrectlyTyped.length > 0) {
            // Remove an incorrect letter
            this.incorrectlyTyped = this.incorrectlyTyped.substr(0, this.incorrectlyTyped.length - 1);
        } else if (this.correctlyTyped.length > 0) {
            // Remove a correct letter
            this.notYetTyped = this.correctlyTyped[this.correctlyTyped.length - 1] + this.notYetTyped;
            this.correctlyTyped = this.correctlyTyped.substr(0, this.correctlyTyped.length - 1);
            delta = -1;

            this.times.pop();
        } else {
            return;
        }

        $(this).trigger({
            type: 'textchange.wpm',
            mode: this.mode,
            correctlyTyped: this.correctlyTyped,
            incorrectlyTyped: this.incorrectlyTyped,
            notYetTyped: this.notYetTyped,
            nextLetter: this.incorrectlyTyped ? false : this.notYetTyped[0],
            change: delta,
        });

        this.setState({
            correctlyTyped: this.correctlyTyped,
            incorrectlyTyped: this.incorrectlyTyped,
            notYetTyped: this.notYetTyped,
        });

        this.tick();
    }

    render() {
        return (
            <div>
                <TypeBox gameMode={this.state.mode} onLetterTyped={this.letterTyped} onBackspaceTyped={this.onBackspaceTyped} correctlyTyped={this.state.correctlyTyped} incorrectlyTyped={this.state.incorrectlyTyped} notYetTyped={this.state.notYetTyped} />
                <StatsBox gameMode={this.state.mode} wpm={this.state.wpm} accuracy={this.state.accuracy} characters={this.state.characters} seconds={this.state.seconds} />
            </div>
        );
    }
}

export default Game;
