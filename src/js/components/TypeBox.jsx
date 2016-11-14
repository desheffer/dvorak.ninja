import React, { PropTypes } from 'react';

import GameModes from '../GameModes';

class TypeBox extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            gameMode: GameModes.IDLE,
            correctlyTyped: '',
            incorrectlyTyped: '',
            notYetTyped: '',
        };
    }

    render() {
        let correctlyTyped = this.props.correctlyTyped || '';
        let incorrectlyTyped = this.props.incorrectlyTyped || '';
        let notYetTyped = this.props.notYetTyped || '';

        notYetTyped = notYetTyped.slice(incorrectlyTyped.length);

        return (
            <div className="type">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <div className="page-overlay">
                                {this.props.gameMode === GameModes.IDLE &&
                                    <div className="overlay-area">
                                        &mdash; Select a word set from above &mdash;
                                    </div>
                                }
                                {this.props.gameMode === GameModes.PREGAME &&
                                    <div className="overlay-area">
                                        &mdash; Press any key to begin &mdash;
                                    </div>
                                }
                                {this.props.gameMode !== GameModes.POSTGAME &&
                                    <div className="type-area">
                                        <span className="correct">{correctlyTyped}</span>
                                        <span className="incorrect">{incorrectlyTyped}</span>
                                        {this.props.gameMode === GameModes.PLAYING &&
                                            <span className="cursor"></span>
                                        }
                                        <span className="remaining">{notYetTyped}</span>
                                    </div>
                                }
                                {this.props.gameMode === GameModes.POSTGAME &&
                                    <div className="type-area">
                                        <span className="correct">{correctlyTyped}</span>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

TypeBox.propTypes = {
    gameMode: PropTypes.string.isRequired,
    onLetterTyped: PropTypes.func,
    onBackspaceTyped: PropTypes.func,
    correctlyTyped: PropTypes.string,
    incorrectlyTyped: PropTypes.string,
    notYetTyped: PropTypes.string,
};

export default TypeBox;
