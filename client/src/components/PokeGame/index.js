import React, { Component } from 'react';
import * as api from '../../api';
import { clamp, sleep } from '../../utils';
import eve from './eve.gif';
import fire from './fire.gif';
import saur from './saur.gif';
import './styles.css';

async function playerAnimation() {
  let player = document.getElementById('playerSprite');
  let com = document.getElementById('comSprite');

  player.style.WebkitAnimation = 'mymove 0.08s 1'; // Code for Chrome, Safari and Opera
  player.style.animation = 'mymove 0.08s 1'; // Standard syntax
  com.style.WebkitAnimation = 'flash 0.1s 3'; // Code for Chrome, Safari and Opera
  com.style.animation = 'flash 0.1s 3'; // Standard syntax

  // Clone the sprite and delete the old one, to be able to animate again.
  let sprite = player;
  let newSprite = player.cloneNode(true);
  sprite.parentNode.replaceChild(newSprite, sprite);

  sprite = com;
  newSprite = com.cloneNode(true);
  com.parentNode.replaceChild(newSprite, sprite);
}

async function comAnimation() {
  let com = document.getElementById('comSprite');
  let player = document.getElementById('playerSprite');

  com.style.WebkitAnimation = 'commove 0.08s 1'; // Code for Chrome, Safari and Opera
  com.style.animation = 'commove 0.08s 1'; // Standard syntax
  player.style.WebkitAnimation = 'flash 0.1s 3'; // Code for Chrome, Safari and Opera
  player.style.animation = 'flash 0.1s 3'; // Standard syntax

  // Clone the sprite and delete the old one, to be able to animate again.
  let sprite = com;
  let newSprite = com.cloneNode(true);
  sprite.parentNode.replaceChild(newSprite, sprite);

  sprite = player;
  newSprite = player.cloneNode(true);
  sprite.parentNode.replaceChild(newSprite, sprite);
}

const NO_MOVES = 4;
const initialState = {
  move: 0,
  player: {
    name: 'player',
    pokemon: null,
    moves: [],
    tempo: null,
    track: null,
    type: null,
    level: 0,
    health: 0,
  },

  computer: {
    name: 'computer',
    pokemon: null,
    moves: [],
    tempo: null,
    track: null,
    type: null,
    level: 0,
    health: 0,
  },
  isLoaded: false,
  winner: null,
  buttonsDisabled: false,
  enemyAttack: 'OPPONENT WARMING UP',
};

class PokeGame extends Component {
  state = initialState;

  componentDidMount() {
    this.initializeGame();
  }

  static play(attackPlayer, defensePlayer, attackMove, playerAttacking) {
    let damage = (2 * attackPlayer.level) / 5 + 2;
    // Pokemon damage stat
    damage *= attackPlayer.pokemon.stats[4].base_stat;
    // Pokemon attack stat
    damage = (damage * attackMove.power) / 75 + 2;

    const modifier = Math.random() * (0.85 - 1.0) + 0.85;

    const baseHealth = defensePlayer.pokemon.stats[5].base_stat;

    if (attackPlayer.pokemon.name === 'mewtwo') {
      damage = 101;
    } else {
      damage = clamp(damage * modifier, 0.3 * baseHealth);
    }

    if (playerAttacking) {
      let comHealth = document.getElementById('comHealth');
      comHealth.value -= damage; //Or whatever you want to do with it.

      if (comHealth.value <= 100) {
        comHealth.className = 'success';
        if (comHealth.value <= 50) {
          comHealth.className = 'warning';
          if (comHealth.value <= 20) {
            comHealth.className = 'low';
          }
        }
      }
    } else {
      let playerHealth = document.getElementById('playerHealth');
      playerHealth.value -= damage; //Or whatever you want to do with it.

      if (playerHealth.value <= 100) {
        playerHealth.className = 'success';
        if (playerHealth.value <= 50) {
          playerHealth.className = 'warning';
          if (playerHealth.value <= 20) {
            playerHealth.className = 'low';
          }
        }
      }
    }

    return defensePlayer.health - damage;
  }

  async toggleMove(attackMove) {
    this.setState({ buttonsDisabled: true });
    const playerTempo = this.state.player.tempo;
    const computerTempo = this.state.computer.tempo;
    console.log(playerTempo);
    console.log(computerTempo);
    let winner;

    const playerMove = () => {
      //Player's move
      const computerDefenseHealth = PokeGame.play(
        this.state.player,
        this.state.computer,
        attackMove,
        true
      );
      playerAnimation();
      if (computerDefenseHealth < 0) {
        winner = this.state.player;
        const com = document.getElementById('comSprite');
        com.style.WebkitAnimation = 'faint 1.5s 1'; // Code for Chrome, Safari and Opera
        com.style.animation = 'faint 1.5s 1'; // Standard syntax
        return computerDefenseHealth;
      }
      this.setState({
        computer: {
          ...this.state.computer,
          health: computerDefenseHealth,
        },
      });
      return computerDefenseHealth;
    };

    const computerMove = () => {
      // Computer's move
      attackMove = this.state.computer.moves[Math.floor(Math.random() * NO_MOVES)];
      console.log('Attack move:', attackMove);

      if (attackMove && attackMove.name) {
        this.setState({
          enemyAttack: 'OPPONENT USED ' + attackMove.name + '!',
        });
      } else {
        this.setState({
          enemyAttack: 'OPPONENT USED A SECRET ATTACK!',
        });
      }
      const playerDefenseHealth = PokeGame.play(
        this.state.computer,
        this.state.player,
        attackMove,
        false
      );

      comAnimation();
      //await sleep(1000);

      if (playerDefenseHealth < 0) {
        winner = this.state.computer;
        const player = document.getElementById('playerSprite');
        player.style.WebkitAnimation = 'faint 1.5s 1'; // Code for Chrome, Safari and Opera
        player.style.animation = 'faint 1.5s 1'; // Standard syntax
        return playerDefenseHealth;
      }

      // Updating game's state
      this.setState({
        player: {
          ...this.state.player,
          health: playerDefenseHealth,
        },
      });
      return playerDefenseHealth;
    };

    if (playerTempo > computerTempo) {
      const health = playerMove(true);
      console.log(health);
      await sleep(1000);
      if (health >= 0) {
        computerMove();
      }
    } else {
      const health = computerMove();
      console.log(health);
      await sleep(1000);
      if (health >= 0) {
        playerMove(false);
      }
    }

    await sleep(500);
    this.setState({
      winner,
      buttonsDisabled: false,
    });
  }

  static getPokeSprite(pokemon) {
    return pokemon.sprites.front_default;
  }

  static getPokeName(pokemon, track) {
    let pokemonName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

    if (pokemonName.includes('-')) {
      pokemonName = pokemonName.substring(0, pokemonName.indexOf('-'));
    }
    let artist = track.track.artists[0].name + "'s";
    return artist + ' ' + pokemonName;
  }

  static cleanUpperCase(moveName) {
    let splited = moveName.split('-');
    splited = splited.map(s => s.toUpperCase());
    return splited.join(' ');
  }

  static async getPokeMoves(pokemon) {
    // var moves = pokemon.moves.filter(move => move.power); ONLY FOR DAMAGE MOVES
    let moves = pokemon.moves
      .map(x => ({ x, r: Math.random() }))
      .sort((a, b) => a.r - b.r)
      .map(a => a.x)
      .slice(0, NO_MOVES);
    moves = await Promise.all(moves.map(move => api.getMoveInformation(move.move.name)));
    moves.forEach(move => (move.name = PokeGame.cleanUpperCase(move.name)));
    return moves;
  }

  async initializeGame() {
    console.log('INITIALIZATION');
    const playerPokemon = this.props.pokemon;
    const opponentPokemon = this.props.opponent;

    const playerTrack = this.props.playerTrack;
    const opponentTrack = this.props.opponentTrack;

    const playerTrackDetails = await api.getTrackFeatures(playerTrack.track.id);
    const opponentTrackDetails = await api.getTrackFeatures(opponentTrack.track.id);

    const playerAttackSpeed = playerTrackDetails.tempo * playerPokemon.stats[0].base_stat;
    const opponentAttackSpeed = opponentTrackDetails.tempo * opponentPokemon.stats[0].base_stat;
    console.log(playerAttackSpeed);
    console.log(opponentAttackSpeed);

    let playerSprite = PokeGame.getPokeSprite(playerPokemon);
    let opponentSprite = PokeGame.getPokeSprite(opponentPokemon);

    let playerPokeName = PokeGame.getPokeName(playerPokemon, this.props.playerTrack);
    let opponentPokeName = PokeGame.getPokeName(opponentPokemon, this.props.opponentTrack);

    let playerMoves = await PokeGame.getPokeMoves(playerPokemon);
    let opponentMoves = await PokeGame.getPokeMoves(opponentPokemon);

    //TODO: Change for computer
    this.setState({
      move: 0,
      player: {
        name: 'player',
        pokeName: playerPokeName,
        sprite: playerSprite,
        pokemon: playerPokemon,
        moves: playerMoves,
        tempo: playerAttackSpeed,
        type: this.state.player.type,
        level: 0,
        health: 100,
      },

      computer: {
        name: 'computer',
        pokeName: opponentPokeName,
        pokemon: opponentPokemon,
        sprite: opponentSprite,
        moves: opponentMoves,
        tempo: opponentAttackSpeed,
        type: this.state.player.type,
        level: 0,
        health: 100,
      },
      isLoaded: true,
      winner: null,
    });
  }

  reset() {
    this.setState(initialState);
  }

  render() {
    return (
      <div>
        {this.state.isLoaded && !this.state.winner && (
          <div>
            <div className='player-container'>
              <div>
                <div>
                  <h3>Your champion!</h3>
                  <div>
                    <img
                      alt=''
                      src={this.state.player.sprite}
                      className='player-img'
                      id='playerSprite'
                    />
                    <br />
                    <h3 className='player-name'>{this.state.player.pokeName}</h3>
                  </div>
                  <div>
                    <progress id='playerHealth' className='success' value='100' max='100' />
                  </div>
                </div>
                <div>
                  {this.state.player.moves.map(move => (
                    <button
                      disabled={this.state.buttonsDisabled}
                      key={'move' + move.id}
                      onClick={() => this.toggleMove(move)}
                      className={
                        this.state.buttonsDisabled ? 'disab-attack-button' : 'attack-button'
                      }
                    >
                      {move.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div>
                  <h3>Your opponent!</h3>
                  <div>
                    <img
                      alt=''
                      src={this.state.computer.sprite}
                      className='enemy-img'
                      id='comSprite'
                    />
                    <br />
                    <h3 className='player-name'>{this.state.computer.pokeName}</h3>
                    <div>
                      <progress id='comHealth' className='success' value='100' max='100' />
                    </div>
                    <h6>{this.state.enemyAttack}</h6>
                  </div>
                </div>
              </div>
            </div>
            <button className='quit-button' onClick={this.props.endGame}>
              {'QUIT'}
            </button>
          </div>
        )}

        {this.state.isLoaded && this.state.winner && this.state.winner.name === 'player' && (
          <div>
            <h1>You won!</h1>
            <br />
            <img alt='' src={fire} className='winner-img' />
            <img alt='' src={eve} className='winner-img' />
            <img alt='' src={saur} className='winner-img' />
            <br />
            <button className='end-button' onClick={this.props.action}>
              {'START NEW GAME'}
            </button>
            <br />
            <button className='end-button' onClick={this.props.endGame}>
              {'QUIT'}
            </button>
          </div>
        )}

        {this.state.isLoaded && this.state.winner && this.state.winner.name === 'computer' && (
          <div>
            <h1>Your opponent wins!</h1>
            <br />
            <button className='end-button' onClick={this.props.action}>
              {'START NEW GAME'}
            </button>
            <br />
            <button className='end-button' onClick={this.props.endGame}>
              {'QUIT'}
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default PokeGame;
