const { GraphQLClient, gql  } = require('graphql-request')
const Discord = require('discord.js');
//var auth = require('./auth.json');
var conf = require('./conf.json');
var gamelist = require('./games.json');
const bot = new Discord.Client();
var fs = require('fs');
var match={};
var autorace=false;
var update=false;
var dataGS={ darkQualif: [] };
var games =[215,216,217,218,219,220,221,222,223,224];
var PBtosend=["roger"];

const graphqlclient=new GraphQLClient("https://dev.ultimedecathlon.com/graphql")
const queryGS = gql`query firstGame ($gameId: Int!) {
  ChampionshipGameResults (game: $gameId, season: 9) {
    user {
      username
      alias
    }
    submittedTime {
      stringTime
      score
    }
  }
}
`

const requestHeaders = {
  "authorization": "Basic " + Buffer.from(("udadm" + ":" + "Just1Shittypassword"), 'binary').toString('base64')
};


	
function graphqlGS(){
	games.forEach(function(game){
	var variables = {
		"gameId": game,
	}
	graphqlclient.request(queryGS, variables,requestHeaders).then(function(dataresult){dataGS=dataresult;
		if(dataGS.ChampionshipGameResults[0]!=null){
			if(toupdate(game,dataGS.ChampionshipGameResults[0])){
				PBtosend.push(gamenametostring(game)+" - " +dataGS.ChampionshipGameResults[0].submittedTime.stringTime + "("+dataGS.ChampionshipGameResults[0].submittedTime.score+")- " + dataGS.ChampionshipGameResults[0].user.username);
				writegame(game,dataGS.ChampionshipGameResults[0]);
			}
		}
		} 
		);
	}
);}

setInterval(graphqlGS, 300000);

function printRoger(){
	PBtosend.forEach(truc=>console.log(truc));
	PBtosend=[];
}

setInterval(printRoger, 300);

function gamenametostring(id){
	switch(id){
				case 215 : 
		return "Hollow Knight";
		break;
				case 216 : 
		return "Steamworld Dig 2";
		break;
				case 217 : 
		return "Mintroid";
		break;
				case 218 : 
		return "Ghouls'n Ghosts";
		break;
				case 219 : 
		return "Unworthy";
		break;
				case 220 : 
		return "Hamsterball";
		break;
				case 221 : 
		return "Kururin Squash!";
		break;
				case 222 : 
		return "Super Monkey Ball Adventures";
		break;
				case 223 : 
		return "Trials Fusion";
		break;
		case 224 : 
		return "Vectronom";
		break;
	}
}
//cas 1; null
function toupdate(id,ChampionshipGameResults0){
	let currentMatch = JSON.parse(fs.readFileSync('./'+id+'.json'));
	if(ChampionshipGameResults0.submittedTime.stringTime!=currentMatch.submittedTime.stringTime){
	 return true;
	}
	return false;
}

function writegame(id,ChampionshipGameResults0){
	fs.writeFile('./'+id+'.json', JSON.stringify(ChampionshipGameResults0), function (err) {
		if (err) return console.log(err);
	});
}