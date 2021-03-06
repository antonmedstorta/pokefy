import React, { Component } from 'react';
import * as api from '../../api';
import './styles.css';

class GridItem extends Component {
  handleClick = () => {
    if (this.props.readyForGame === false) {
      this.setState({
        clicked: true,
      });
    }
    api.playSong(this.props.track.track.id);
    this.props.moveToGame(this.props.track);
  };

  render() {
    const image = this.props.track.track.album.images[0].url;
    const index = this.props.animationIndex;

    return (
      <div className='grid-item' style={{ '--i': index }}>
        <img src={image} alt='' className='grid-img' onClick={this.handleClick} />
        <h3>{this.props.track.track.name}</h3>
      </div>
    );
  }
}

export default GridItem;
