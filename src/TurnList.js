'use strict';

function TurnList() {}

TurnList.prototype.reset = function (charactersById) {
  this._charactersById = charactersById;
  this._turnIndex = -1;
  this.turnNumber = 0;
  this.activeCharacterId = null;
  this.list = this._sortByInitiative();
};

TurnList.prototype.next = function () {
this._turnIndex=0;
var turn= {};
turn.list = this.list;
this.activeCharacterId = this.list[this._turnIndex];
turn.activeCharacterId = this.activeCharacterId;


while(this._turnIndex < this.list.length && this._charactersById[turn.activeCharacterId].isDead()){
    this.activeCharacterId = this.list[this._turnIndex];
  turn.activeCharacterId = this.activeCharacterId;

  this._turnIndex++;
  
}
turn.activeCharacterId = this.activeCharacterId;
turn.party = this._charactersById[turn.activeCharacterId].party;
this.turnNumber++;
turn.number = this.turnNumber;
return turn;


  };



  // Haz que calcule el siguiente turno y devuelva el resultado
  // según la especificación. Recuerda que debe saltar los personajes
  // muertos.


TurnList.prototype._sortByInitiative = function () {
var listcharacters = [];
var listinitiative =[];
for(var name in this._charactersById){
  listcharacters.push(
    {
      name:name,
      initiative: this._charactersById[name].initiative
    });
};
  listcharacters.sort(function (a,b){
    if(a && b){
    if(a.initiative > b.initiative)
      return -1;
    else if(a.initiative <b.initiative)
      return 1;
    else return 0;
}
  })


  for(var nombre in listcharacters){
    listinitiative.push(listcharacters[nombre].name);
  }




return listinitiative;
};

module.exports = TurnList;
