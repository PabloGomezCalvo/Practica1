'use strict';

var EventEmitter = require('events').EventEmitter;
var CharactersView = require('./CharactersView');
var OptionsStack = require('./OptionsStack');
var TurnList = require('./TurnList');
var Effect = require('./items').Effect;

var utils = require('./utils');
var listToMap = utils.listToMap;
var mapValues = utils.mapValues;

function Battle() {
  EventEmitter.call(this);
  this._grimoires = {};
  this._charactersById = {};
  this._turns = new TurnList();

  this.options = new OptionsStack();
  this.characters = new CharactersView();
}
Battle.prototype = Object.create(EventEmitter.prototype);
Battle.prototype.constructor = Battle;

Object.defineProperty(Battle.prototype, 'turnList', {
  get: function () {
    return this._turns ? this._turns.list : null;
  }
});

Battle.prototype.setup = function (parties) {
  this._grimoires = this._extractGrimoiresByParty(parties);
  this._charactersById = this._extractCharactersById(parties);
  this._states = this._resetStates(this._charactersById);
  this._turns.reset(this._charactersById);

  this.characters.set(this._charactersById);
  this.options.clear();
};

Battle.prototype.start = function () {
  this._inProgressAction = null;
  this._stopped = false;
  this.emit('start', this._getCharIdsByParty());
  this._nextTurn();
};

Battle.prototype.stop = function () {
  this._stopped = true;
};

Object.defineProperty(Battle.prototype, '_activeCharacter', {
  get: function () {
    return this._charactersById[this._turns.activeCharacterId];
  }
});

Battle.prototype._extractGrimoiresByParty = function (parties) {
  var grimoires = {};
  var partyIds = Object.keys(parties);
  partyIds.forEach(function (partyId) {
    var partyGrimoire = parties[partyId].grimoire || [];
    grimoires[partyId] = listToMap(partyGrimoire, useName);
  });
  return grimoires;

  function useName(scroll) {
    return scroll.name;
  }
};

Battle.prototype._extractCharactersById = function (parties) {
  var idCounters = {};
  var characters = [];
  var partyIds = Object.keys(parties);
  partyIds.forEach(function (partyId) {
    var members = parties[partyId].members;
    assignParty(members, partyId);
    characters = characters.concat(members);
  });
  return listToMap(characters, useUniqueName);

  function assignParty(characters, party) {
//Para cada personaje, cogemos su party y les asignamos la que entra.
      characters.forEach(function(character){

        character.party = party;
      });
    
  }

  function useUniqueName(character) {

if(!idCounters.hasOwnProperty(character.name)){
  idCounters[character.name] = 1; 
  return character.name;
}
else {
  idCounters[character.name]++;
 return character.name + ' ' + (idCounters[character.name]);
}
  }
};

Battle.prototype._resetStates = function (charactersById) {
  return Object.keys(charactersById).reduce(function (map, charId) {
    map[charId] = {};
    return map;
  }, {});
};

Battle.prototype._getCharIdsByParty = function () {
  var charIdsByParty = {};
  var charactersById = this._charactersById;
  Object.keys(charactersById).forEach(function (charId) {
    var party = charactersById[charId].party;
    if (!charIdsByParty[party]) {
      charIdsByParty[party] = [];
    }
    charIdsByParty[party].push(charId);
  });
  return charIdsByParty;
};

Battle.prototype._nextTurn = function () {
  if (this._stopped) { return; }
  setTimeout(function () {
    var endOfBattle = this._checkEndOfBattle();
    if (endOfBattle) {
      this.emit('end', endOfBattle);
    } else {
      var turn = this._turns.next();
      this._showActions();
      this.emit('turn', turn);
    }
  }.bind(this), 0);
};

Battle.prototype._checkEndOfBattle = function () {
  var allCharacters = mapValues(this._charactersById);
  var aliveCharacters = allCharacters.filter(isAlive);
  var commonParty = getCommonParty(aliveCharacters);
  return commonParty ? { winner: commonParty } : null;


  function isAlive(character) {
    if(character.hp > 0)
      return true;
    else return false;
    // Devuelve true si el personaje está vivo.
  }

  function getCommonParty(characters) {
    var flag = true;
    var first = characters[0].party;
    var i = 0;
    while(i < characters.length && flag){
        if( characters[i].party !== first)
          flag = false;
      i++;
    }
    if(flag === true)
      return first;
    else return null;
    // Devuelve la party que todos los personajes tienen en común o null en caso
    // de que no haya común.
  }
};

Battle.prototype._showActions = function () {
  this.options.current = {
    'attack': true,
    'defend': true,
    'cast': true
  };
  this.options.current.on('chose', this._onAction.bind(this));
};

Battle.prototype._onAction = function (action) {
  this._action = {
    action: action,
    activeCharacterId: this._turns.activeCharacterId
  };
  if(this._action.action === 'defend'){
    this._defend();
  }
  else if(this._action.action === 'attack'){
    this._attack();
  }
  if(this._action.action === 'cast'){
    this._cast();
  }

};

Battle.prototype._defend = function () {
  var activeCharacterId = this._action.activeCharacterId;
  var newDefense = this._improveDefense(activeCharacterId);
  this._action.targetId = this._action.activeCharacterId;
  this._action.newDefense = newDefense;
  this._executeAction();
};

Battle.prototype._improveDefense = function (targetId) {
   this._states[targetId].defense = this._charactersById[targetId].defense;
   this._charactersById[targetId]._defense = 
   Math.ceil(this._charactersById[targetId]._defense * 1.1);
   return this._charactersById[targetId]._defense;
  // Implementa la mejora de la defensa del personaje.
};

Battle.prototype._restoreDefense = function (targetId) {
  this._charactersById[targetId].defense = this._states[targetId].defense;
  // Restaura la defensa del personaje a cómo estaba antes de mejorarla.
  // Puedes utilizar el atributo this._states[targetId] para llevar tracking
  // de las defensas originales.
};

Battle.prototype._attack = function () {
  var self = this;
  self._showTargets(function onTarget(targetId) {
    //trackeamos el weapon haciendo el console.log de self y vamos entrando
    //cada vez más donde queremos llegar.
    //console.log(self._charactersById[targetId].weapon.effect);
 
      self._action.targetId = targetId;
    self._action.effect = self._charactersById[self._action.activeCharacterId].weapon.effect;


    // Implementa lo que pasa cuando se ha seleccionado el objetivo.
    self._executeAction();
    self._restoreDefense(targetId);
  });
};

Battle.prototype._cast = function () {
  var self = this;
  self._showScrolls(function onScroll(scrollId, scroll) {
    self._showTargets(function onTarget(targetId) {
   //inicializamos todos como en el método anterior
   self._action.targetId = targetId;
    self._action.scrollName = scrollId;
    self._action.effect = scroll.effect
    //trakeamos
    //console.log(self._charactersById);
    self._charactersById[self._action.activeCharacterId].mp -= scroll.cost;
    //copiamos como en el método de arriba
    self._executeAction();
    self._restoreDefense(targetId);
  });
    // Implementa lo que pasa cuando se ha seleccionado el hechizo.
  });
};

Battle.prototype._executeAction = function () {
  var action = this._action;
  var effect = this._action.effect || new Effect({});
  var activeCharacter = this._charactersById[action.activeCharacterId];
  var targetCharacter = this._charactersById[action.targetId];
  var areAllies = activeCharacter.party === targetCharacter.party;

  var wasSuccessful = targetCharacter.applyEffect(effect, areAllies);
  this._action.success = wasSuccessful;

  this._informAction();
  this._nextTurn();
};

Battle.prototype._informAction = function () {
  this.emit('info', this._action);
};

Battle.prototype._showTargets = function (onSelection) {
  this.options.current = {};

  for(var char in this._charactersById){

    if(this._charactersById[char].hp > 0)
      var personaje = this._charactersById[char].name;
    this.options.current._group[personaje] = true;
  }


  this.options.current.on('chose', onSelection);
};

Battle.prototype._showScrolls = function (onSelection) {
  // Toma ejemplo de la función anterior para mostrar los hechizos. Estudia
  // bien qué parámetros se envían a los listener del evento chose.

};

module.exports = Battle;