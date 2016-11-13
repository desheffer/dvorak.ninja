import React, { PropTypes } from 'react';
import GameModes from '../GameModes';

class StatsBox extends React.Component {
    render() {
        let wpm = '---';
        let accuracy = '---%';
        let characters = '---';
        let time = '-:--';

        if (this.props.gameMode !== GameModes.IDLE && this.props.gameMode !== GameModes.PREGAME) {
            if (this.props.seconds !== undefined) {
                let min = ~~(this.props.seconds / 60);
                let sec = ~~(this.props.seconds - min * 60);
                time = min + ':' + ('0' + sec).substr(-2);
            }

            wpm = ~~this.props.wpm;
            accuracy = ~~this.props.accuracy + '%';
            characters = ~~this.props.characters;
        }

        return (
            <div className="stats">
                <div className="container">
                    <div className="row">
                        <div className="col-sm-2 col-xs-6 wpm">
                            <div className="value">{wpm}</div>
                            <div className="stat">WPM</div>
                        </div>
                        <div className="col-sm-offset-4 col-sm-2 col-xs-6 accuracy">
                            <div className="value">{accuracy}</div>
                            <div className="stat">Accuracy</div>
                        </div>
                        <div className="col-sm-2 col-xs-6 characters">
                            <div className="value">{characters}</div>
                            <div className="stat">Characters</div>
                        </div>
                        <div className="col-sm-2 col-xs-6 time">
                            <div className="value">{time}</div>
                            <div className="stat">Time</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

StatsBox.propTypes = {
    gameMode: PropTypes.string.isRequired,
    wpm: PropTypes.number.isRequired,
    accuracy: PropTypes.number.isRequired,
    characters: PropTypes.number.isRequired,
    seconds: PropTypes.number.isRequired,
};

export default StatsBox;
