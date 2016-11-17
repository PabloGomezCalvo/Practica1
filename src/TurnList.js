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


var turn = {};
this.turnNumber ++;
turn.number = this.turnNumber;
this._turnIndex = (this._turnIndex + 1) % this.list.length;
this.activeCharacterId = this.list[this._turnIndex];
turn.activeCharacterId = this.activeCharacterId;

var aux = 0;
//dividimos en 2 el comentario por el lintern
//console.log ("--- "+turn.activeCharacterId+
//"---"+JSON.stringify(this._charactersById[turn.activeCharacterId]));
while(aux < this.list.length && 
  this._charactersById[turn.activeCharacterId].isDead()){
//console.log(this._charactersById[turn.activeCharacterId].isDead);
//console.log (turn.activeCharacterId);
    this.activeCharacterId = this.list[this._turnIndex];
    turn.activeCharacterId = this.activeCharacterId;
    this._turnIndex = (this._turnIndex + 1) % this.list.length;
    aux ++;
  
}
this.activeCharacterId = turn.activeCharacterId;
turn.party = this._charactersById[turn.activeCharacterId].party;
return turn;


  };

  



  // Haz que calcule el siguiente turno y devuelva el resultado
  // según la especificación. Recuerda que debe saltar los personajes
  // muertos.


TurnList.prototype._sortByInitiative = function () {
var listcharacters = [];
var listinitiative = [];
for(var name in this._charactersById){
  listcharacters.push(
    {
      name:name,
      initiative: this._charactersById[name].initiative
    });
}
  listcharacters.sort(function (a,b){
    if(a && b){
    if(a.initiative > b.initiative)
      return -1;
    else if (a.initiative < b.initiative)
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
