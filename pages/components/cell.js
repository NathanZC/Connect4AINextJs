import React from 'react';


class Cell extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      id: this.props.id,
      spot: this.props.spot,
      colIndex: this.props.colIndex,
      hovered: false, // Add a new state for hover
    };
  }

  handleHover = () => {
    this.setState({ hovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ hovered: false });
  };

  render() {
    const { hovered } = this.state;
    const { colIndex } = this.props;

    let cellClassName = '';
    if (this.props.spot === 0) {
      cellClassName = `emptyCell column-${colIndex}`;
    } else if (this.props.spot === 1) {
      cellClassName = 'playerOneCell';
    } else {
      cellClassName = 'playerTwoCell';
    }

    // Conditionally add 'hovered' class based on state
    if (hovered) {
      cellClassName += ' hovered';
    }

    return (
      <div
        onClick={() => {
          this.props.clicked(this.props.colIndex);
        }}
        className={cellClassName}
        id={this.state.id}
        onMouseEnter={this.handleHover}
        onMouseLeave={this.handleMouseLeave}
      />
    );
  }
}

export default Cell;
