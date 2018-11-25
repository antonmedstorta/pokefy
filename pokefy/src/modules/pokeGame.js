import React, { Component } from 'react';
import * as api from '../api';
import '../App.css';

// limits number to max
const clamp = (num, max) => Math.min(Math.max(num, 0), max);

// sleep for [time] milliseconds
const sleep = time =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });

const NO_MOVES = 4;

const initialState = {
  move: 0,
  player: {
    name: 'player',
    pokemon: null,
    moves: [],
    type: null,
    level: 0,
    health: 0,
  },

  computer: {
    name: 'computer',
    pokemon: null,
    moves: [],
    type: null,
    level: 0,
    health: 0,
  },
  isLoaded: false,
  winner: null,
};

class PokeGame extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  componentDidMount() {
    this.initializeGame();
  }

  static play(attackPlayer, defensePlayer, attackMove, playerAttacking) {
    var damage = (2 * attackPlayer.level) / 5 + 2;
    // Pokemon damage stat
    damage *= attackPlayer.pokemon.stats[4].base_stat;
    // Pokemon attack stat
    damage = (damage * attackMove.power) / 75 + 2;

    var modifier = Math.random() * (0.85 - 1.0) + 0.85;

    const baseHealth = defensePlayer.pokemon.stats[5].base_stat;
    damage = clamp(damage * modifier, 0.3 * baseHealth);

    if (playerAttacking == true) {
      let comHealth = document.getElementById('comHealth');
      comHealth.value -= damage; //Or whatever you want to do with it.
    } else {
      let playerHealth = document.getElementById('playerHealth');
      playerHealth.value -= damage; //Or whatever you want to do with it.
    }

    return defensePlayer.health - damage;
  }

  async toggleMove(attackMove) {
    //Player's move
    console.log(this.state.player);
    var computerDefenseHealth = PokeGame.play(
      this.state.player,
      this.state.computer,
      attackMove,
      true
    );
    if (computerDefenseHealth < 0) {
      this.setState({ winner: this.state.player });
      return;
    }

    this.setState({
      computer: {
        ...this.state.computer,
        health: computerDefenseHealth,
      },
    });

    await sleep(1000);

    // Computer's move
    attackMove = this.state.computer.moves[Math.floor(Math.random() * NO_MOVES)];
    var playerDefenseHealth = PokeGame.play(
      this.state.computer,
      this.state.player,
      attackMove,
      false
    );
    if (playerDefenseHealth < 0) {
      this.setState({ winner: this.state.computer });
      return;
    }

    // Updating game's state
    this.setState({
      player: {
        ...this.state.player,
        health: playerDefenseHealth,
      },
    });
  }

  static getPokeSprite(pokemon) {
    return pokemon.sprites.front_default;
  }

  static getPokeName(pokemon) {
      let pokemonName = pokemon.name.charAt(0).toUpperCase() + pokemon.name.slice(1);

      if (pokemonName.includes('-')) {
          pokemonName = pokemonName.substring(0, pokemonName.indexOf('-'));
      }
      return pokemonName
  }

  static async getPokeMoves(pokemon) {
      // var moves = pokemon.moves.filter(move => move.power); ONLY FOR DAMAGE MOVES
      let moves = pokemon.moves
          .map(x => ({x, r: Math.random()}))
          .sort((a, b) => a.r - b.r)
          .map(a => a.x)
          .slice(0, NO_MOVES);
      moves =  await Promise.all(moves.map(move => api.getMoveInformation(move.move.name)));
      return moves
  }

  async initializeGame() {
    console.log("INITIALIZATION");

    const playerPokemon = this.props.pokemon;
    const opponentPokemon = this.props.opponent;

    let playerSprite = PokeGame.getPokeSprite(playerPokemon);
    let opponentSprite = PokeGame.getPokeSprite(opponentPokemon);

    let playerPokeName = PokeGame.getPokeName(playerPokemon);
    let opponentPokeName = PokeGame.getPokeName(opponentPokemon);

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
        type: this.state.player.type,
        level: 0,
        health: 100,
      },
      isLoaded: true,
      winner: null,
    });
  }

  reset() {
    this.state = initialState;
  }

  render() {
    return (
      <div>
        {this.state.isLoaded && !this.state.winner && (
          <div className='player-container'>
            <div>
              <div>
                <h3>{'Player picked: ' + this.state.player.pokemon.name}</h3>
                <div>
                  <img src={this.state.player.sprite} className='player-img' />
                  <br />
                  <h3>{this.state.player.pokeName}</h3>
                </div>
              </div>
              <div>
                {this.state.player.moves.map(move => (
                  <button
                    key={'move' + move.id}
                    onClick={() => this.toggleMove(move)}
                    className='attack-button'
                  >
                    {move.name}
                  </button>
                ))}
              </div>
              <div>
                <progress id='playerHealth' value='100' max='100' />
                <h3>{'Players health: ' + this.state.player.health}</h3>
              </div>
            </div>
            <div>
              <div>
                <h3>{'Enemy picked: ' + this.state.computer.pokemon.name}</h3>
                <div>
                  <img src={this.state.computer.sprite} className='enemy-img' />
                  <br />
                  <h3>{this.state.computer.pokeName}</h3>
                </div>
              </div>
              <div>
                {this.state.computer.moves.map(move => (
                  <button
                    key={'move' + move.id}
                    onClick={() => this.toggleMove(move)}
                    className='attack-button'
                  >
                    {move.name}
                  </button>
                ))}
              </div>
              <div>
                <progress id='comHealth' value='100' max='100' />
                <h3>{'Computer health: ' + this.state.computer.health}</h3>
              </div>
            </div>
          </div>
        )}

        {this.state.isLoaded && this.state.winner && (
          <div>
            {'Winner is: ' + this.state.winner.name}
            <br />
            <button className='attack-button' onClick={this.props.action}>
              {'NEXT!'}
            </button>
          </div>
        )}
      </div>
    );
  }
}

export default PokeGame;
