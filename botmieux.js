const { GraphQLClient, gql  } = require('graphql-request')
const Discord = require('discord.js');
var auth = require('./auth.json');
var conf = require('./conf.json');
var gamelist = require('./games.json');
const bot = new Discord.Client();
var fs = require('fs');
var match={};
var autorace=false;
var update=false;
var data={ darkQualif: [] };
var games =[215,216,217,218,219,220,221,222,223,224];
var PBtosend=[];
var pbupdated = false;


const graphqlclient=new GraphQLClient("https://www.ultimedecathlon.com/graphql")
const query = gql`query qualified ($episode: Int!, $after: DateTime) {
  darkQualif (episode: $episode, after: $after) {
    user {
      username
      alias
    }
    date
  }
}`

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
}`


function graphqlrequestdarkqualif(){
	d=new Date();
	d.setMinutes(d.getMinutes() - 5);
var variables = {
  "episode": 45,
  "after": d.toISOString().replace(/T/, ' ').replace(/\..+/, '')
}
//console.log(new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
graphqlclient.request(query, variables).then(dataresult => data=dataresult);
update = true;
}

function graphqlGS(){
	games.forEach(function(game){
	var variables = {
		"gameId": game,
	}
	graphqlclient.request(queryGS, variables).then(function(dataresult){dataGS=dataresult;
		if(dataGS.ChampionshipGameResults[0]!=null){
			if(toupdate(game,dataGS.ChampionshipGameResults[0])){
				PBtosend.push(gamenametostring(game)+" - " +dataGS.ChampionshipGameResults[0].submittedTime.stringTime + "("+dataGS.ChampionshipGameResults[0].submittedTime.score+")- " + dataGS.ChampionshipGameResults[0].user.username);
				console.log(gamenametostring(game)+" - " +dataGS.ChampionshipGameResults[0].submittedTime.stringTime + "("+dataGS.ChampionshipGameResults[0].submittedTime.score+")- " + dataGS.ChampionshipGameResults[0].user.username);
				writegame(game,dataGS.ChampionshipGameResults[0]);
			}
		}
		} 
		);
	}
);}

setInterval(graphqlrequestdarkqualif, 300000);
setInterval(graphqlGS, 300000);

bot.on('message', msg => {
	if(update){
		update=false;
		channeltosend=msg.guild.channels.cache.find(channel => channel.name === 'hall-of-fame');
		data.darkQualif.forEach(function(qualifie){
			channeltosend.send( qualifie.date+" - "+qualifie.user.username,{code:true});
		});
	}
	PBtosend.forEach(function(pb){
		channeltosend=msg.guild.channels.cache.find(channel => channel.name === 'guerre-de-succession');
		channeltosend.send(pb,{code:true});
	});
	var args=msg.content.split(' ');
	if (args[0]=="!newrace"||args[0]=="!new"||args[0]=="!race"||args[0]=="!start"){
		if(msg.channel.name!="races"){
			return
		}
		start(msg, msg.content.substring(args[0].length+1));
	}
	if (args[0]=="!enter"||args[0]=="!entrer"||args[0]=="!join"){
		enter(msg);
	}
	if(args[0]=="!entrants"){
		entrants(msg);
	}
	//reasy
	if (args[0]=="!ready"){
		ready(msg);
	}
	if (args[0]=="!unready"){
		unready(msg);
	}
	if (args[0]=="!go"){
		go(msg);
	}
	if (args[0]=="!done"){
		done(msg, args[1]);
	}
	if (args[0]=="!undone"){
		undone(msg, args[1]);
	}
	//dead ded rip
	if (args[0]=="!forfeit"){
		forfeit(msg);
	}
	//MODO ONLY
	if (args[0]=="!forceclose"){
		if(!msg.member.roles.cache.some(r=>[conf.adminRoleName].includes(r.name)) ){
					msg.reply("Sorry, you don't have permissions to use this!");
					return '';
				}
		forceclose(msg);
	}
	if (args[0]=="!superforceclose"){
		if(!msg.member.roles.cache.some(r=>[conf.adminRoleName].includes(r.name)) ){
					msg.reply("Sorry, you don't have permissions to use this!");
					return '';
				}
		superforceclose(msg);
	}
	if (args[0]=="!forcego"){
		if(!msg.member.roles.cache.some(r=>[conf.adminRoleName].includes(r.name)) ){
					msg.reply("Sorry, you don't have permissions to use this!");
					return '';
				}
		forcego(msg);
	}
	if (args[0]=="!restart"){
		if(!msg.member.roles.cache.some(r=>[conf.adminRoleName].includes(r.name)) ){
					msg.reply("Sorry, you don't have permissions to use this!");
					return '';
				}
		restart(msg);
	}
	if (args[0]=="!notify"){
		if(!msg.member.roles.cache.some(r=>[conf.adminRoleName].includes(r.name)) ){
					msg.reply("Sorry, you don't have permissions to use this!");
					return '';
				}
		notify(msg);
	}
	//AIDZ
	if (args[0]=="!help"){
				if(msg.channel.name!="races"){
			return;
		}
		//TODO : verif qu'on est dans un chan autorisé
		help(msg);
	}
	if (args[0]=="!result"){
		//TODO : verif qu'on est dans un chan autorisé
		result(msg);
	}
	if(args[0]=="!games"){
				if(msg.channel.name!="races"){
			return;
		}
		//TODO : verif qu'on est dans un chan autorisé
		games(msg);
	}
	if(args[0]=="PGLLCRGKKJ"){
		msg.reply("Something strange happened...");
		for(var i=1; i<11;i++){
			role(msg,i+"");
		}
	}
	if(args[0]=="!role"){
				if(msg.channel.name!="races"){
			return;
		}
		role(msg,msg.content.substring(args[0].length+1));
	}
});

	
function newmatch(){
	var new_match=JSON.parse(fs.readFileSync('./new_match.json'));
	return new_match;
}

function newplayer(id, name, ready){
	var player=JSON.parse(fs.readFileSync('./new_player.json'));
	player.id=id;
	player.name=name;
	player.ready=ready;
	return player;
	
}

function start(msg,name){	
	if (name=="random"){
		name=Math.ceil(Math.random()*10)+"";
	}
	var jeu = getGameName(name);
	var nom = channelGenerateName(jeu);
	msg.guild.channels.create((nom), 'text').then(function(result){
		channel_id = result.id;
		let category = msg.guild.channels.cache.find(c => c.name == "LIVE-RACES");
		if (!category) throw new Error("Category channel does not exist");
		result.setParent(category.id);
		msg.reply("Match démarré dans le salon "+result.toString());
		match[channel_id]=newmatch();
		msg.guild.channels.cache.find(channel => channel.id === channel_id).send("Race créée par : " + msg.member.toString());
		currentMatch=match[channel_id];
		currentMatch.players.push(newplayer(msg.author.id,msg.author.tag,false));
		currentMatch.jeu=jeu;
	});
}

function notify(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		allEntrants="PING\n"; 
		var promises=[];
		currentMatch.players.forEach(function(joueur){
			promises.push(bot.users.fetch(joueur.id).then(user=>{return user.toString()}));
		});
		Promise.all(promises).then(function(values){
			values.forEach(function(user){
				allEntrants=allEntrants+user+"\n";
			});
			msg.channel.send(allEntrants);
		});		
	}
}

function undone(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		currentMatch.players.forEach(function(joueur){
			if(joueur.id==msg.author.id){
				joueur.status="AWATING";
				msg.reply("you're not done yet!");
				joueur.result=0;
			}
		});
	}
}

function enter(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null&&currentMatch.startTime==0){
		var idiot=false;
		currentMatch.players.forEach(function(joueur){
			if(joueur.id==msg.author.id){
				idiot=true;
			}
		}); 
		if(idiot)return;
		currentMatch.players.push(newplayer(msg.author.id,msg.author.tag,false));
		msg.channel.send(msg.member.toString()+" "+"enters the race !");
	}
}

function entrants(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		listjoueurs="Joueurs dans la race :\n";
		currentMatch.players.forEach(function(joueur){
			listjoueurs=listjoueurs+joueur.status+isReady(joueur)+" - "+joueur.name+" \n";
		}); 
		msg.channel.send(listjoueurs,{code:true});
	}
}

function isReady(joueur){
	if(joueur.ready){
		return " (ready)";
	}else return"";
}

function ready(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		if(currentMatch.status!=""){
			return;
		}
		currentMatch.players.forEach(function(joueur){
			if(joueur.id==msg.author.id){
				joueur.ready=true;
				msg.reply("ready!");
			}
		});
		if(autorace){
			var tostart=true;
			currentMatch.players.forEach(function(joueur){
				tostart=joueur.ready&&tostart;
			});
			if(tostart){
				startMatch(msg);
			}
		}
	}
}

function unready(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		if(currentMatch.status!=""){
			return;
		}
		currentMatch.players.forEach(function(joueur){
			if(joueur.id==msg.author.id){
				joueur.ready=false;
				msg.reply("not ready.");
			}
		});
	}
}

function role(msg, jeu){
	if(msg.member.roles.cache.some(r=>[getGameName(jeu)].includes(r.name)) ){
					msg.member.roles.remove(msg.guild.roles.cache.find(r=>r.name==getGameName(jeu)));
					return ;
	}
	 else if(msg.guild.roles.cache.find(r=>r.name==getGameName(jeu))!=undefined){
		 msg.member.roles.add(msg.guild.roles.cache.find(r=>r.name==getGameName(jeu)));
	 }
}

function forcego(msg){
	startMatch(msg);
}

function restart(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		currentMatch.players.forEach(function(joueur){
			joueur.ready=false;
			joueur.status="AWAITING";
			joueur.result=0;
		});
		currentMatch.startTime=0;
		currentMatch.status="";
		msg.reply("Match redémarré !");
		result(msg);
	}
}

function go(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		if(currentMatch.status!=""){
			return;
		}
		var tostart=true;
		currentMatch.players.forEach(function(joueur){
			tostart=joueur.ready&&tostart;
		});
		if(tostart){
			startMatch(msg);
		}else {
			//list des joueurs non ready
			var nonready="Des joueurs ne sont pas prêt :\n";
			currentMatch.players.forEach(function(joueur){
				if(!joueur.ready){
					nonready=nonready+joueur.name+"\n"
				}
			});
			nonready=nonready+"N'oubliez pas de faire !ready";
			msg.channel.send(nonready,{code:true});
		}
	}
}

function startMatch(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		currentMatch.status="GO";
		//3 2 1 stock start time as ms.
		msg.channel.send("Race is starting in 10 seconds !");
        var i = 10;
        var interval = setInterval(function(){
        if (i==3){
			msg.channel.send("3...");
        }
        else if (i==2){
            msg.channel.send(2);
        }
        else if (i==1){
			msg.channel.send(1);
        }
        else if (i==0){
			msg.channel.send("GO!");
			var startdatetime = Date.now();
            currentMatch.startTime=startdatetime;
			clearInterval(this);
		}
		i--;
        }, 1000);
	}
}

function done(msg, time){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		if(currentMatch.startTime!=0){
			if(time!=""&&time!=undefined){
				var IGT = parseTimeManuel(time,msg);
				if(IGT==false||IGT==0){
					return;
				}
			}
			currentMatch.players.forEach(function(joueur){
				if(joueur.id==msg.author.id){
					joueur.status="DONE";
					var finish=Date.now();
					var RTAinMS=finish-currentMatch.startTime;
					if(IGT==""||IGT==null){
						msg.channel.send(joueur.name+" is done in "+msToTime(RTAinMS));
						joueur.result=RTAinMS;
					}
					else{
						msg.channel.send(joueur.name+" is done in "+msToTime(RTAinMS)+" - Submitted time : "+msToTime(IGT));
						joueur.result=IGT;
					}
				}
			});
			var toclose=true;
			currentMatch.players.forEach(function(joueur){
				toclose=joueur.status=="DONE"&&toclose;
			});
			if(toclose){
			setTimeout(function(){
			var toclose=true;
			currentMatch.players.forEach(function(joueur){
				toclose=joueur.status=="DONE"&&toclose;
			});
			if(toclose){
				closeMatch(msg);
			}
			},120000);
			}
		}
	}
}

function forceclose(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		msg.channel.send("forceclosing...");
		var toclose=true;
		currentMatch.players.forEach(function(joueur){
			toclose=joueur.status!="DONE"&&toclose;
		});
		if(toclose){
			closeMatch(msg);
		}
	}
}

function superforceclose(msg){
	closeMatch(msg);
}

function parseTimeManuel(time,msg){
	var timeasms=0;
	try{
	temps=time.split(":");
		timeasms+=temps[temps.length-1].replace(/\D/g,'')*1000;
		if(temps.length>1){
				timeasms+=temps[temps.length-2].replace(/\D/g,'')*60*1000
				if(temps.length>2){
					timeasms+=temps[temps.length-3].replace(/\D/g,'')*60*60*1000
				}
			}
			timeasms=parseInt(timeasms);
	if(timeasms!=undefined&&timeasms!=0){
		msg.reply("IGT : "+msToTime(timeasms));
		return timeasms;
	}else{
		msg.reply("please submit time as h:mm:ss or mm:ss");
		return false;
	}
	} catch (error){
		msg.reply("please submit time as h:mm:ss or mm:ss");
		return false;
	}
}

function forfeit(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		if(currentMatch.startTime!=0){
			currentMatch.players.forEach(function(joueur){
				if(joueur.id==msg.author.id){
					joueur.status="DONE";
					joueur.result=0;
					msg.channel.send(joueur.name+" forfeit");
					}
				}
			);
			var toclose=true;
			currentMatch.players.forEach(function(joueur){
				toclose=joueur.status=="DONE"&&toclose;
			});
			if(toclose){
			setTimeout(function(){
			var toclose=true;
			currentMatch.players.forEach(function(joueur){
				toclose=joueur.status=="DONE"&&toclose;
			});
			if(toclose){
				closeMatch(msg);
			}
			},120000);
			}
		}
	}
}

function closeMatch(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		//résumé dans race_result
		var race_results=printResult(msg,currentMatch);
		if(race_results!=""){
			channeltosend=msg.guild.channels.cache.find(channel => channel.name === 'race_results');
			channeltosend.send(""+race_results);
		}
		// var promises=[];
		// currentMatch.players.forEach(function(joueur){
			// promises.push(msg.guild.members.fetch(joueur.id).then(user=>{return user}));
		// });
		// Promise.all(promises).then(function(values){
			// values.forEach(function(user){
				// user.voice.setChannel(channeltosend);
			// });
		msg.channel.delete();
		// });
		//cloture du channel dans 2 minutes
		//suppression du match de la liste de matchs
		delete match[msg.channel.id];
	}
}

function games(msg){
	msg.channel.send(
	"1  - Hollow Knight          - HK\n"+
	"2  - Steamworld Dig 2       - SWD\n"+
	"3  - Mintroid               - M\n"+
	"4  - Ghouls'n Ghosts        - GnG    - G\n"+
	"5  - Unworthy               - U\n"+
	"6  - Hamsterball Gold       - Hamsterball - H\n"+
	"7  - Trials Fusion          - Trials - TF - T\n"+
	"8  - Kururin Squash         - KS     - K\n"+
	"9  - Monkey Ball Adventures - SMBA   - SMB\n"+
    "10 - Vectronom              - V\n"+
	"random",
	{code:true});
}


function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  if(mins<10)mins="0"+mins;
  if(secs<10)secs="0"+secs;
  return hrs + ':' + mins + ':' + secs;
}

function getGameName(name){
	return gamelist[name.toLowerCase().replace(/\s/g, '')+""];
}

function channelGenerateName(jeu){
	yourNumber=Math.random()*1000000000;
	hexString = yourNumber.toString(16);
	if(jeu!=undefined){
		return jeu+"-"+hexString.substring(0,2);
	}
	return "race-"+hexString.substring(0,4);
}

function result(msg){
	var currentMatch = match[msg.channel.id];
	if (currentMatch!=null){
		var race_results=printResult(msg,currentMatch);
		if(race_results!=null&&race_results!=""){
			msg.channel.send(""+race_results);
		}
	}
}


function printResult(msg,match){
	if(match.jeu!=undefined){
	var toReturn=match.jeu+"\n```";
	}
	else{
		var toReturn="```"
	}
	//POS - temps - joueur
	toSort = match.players;
	toSort.sort(function (joueura, joueurb){
		return (joueura.result-joueurb.result);
	});
	var i=0;
	toSort.forEach(function(joueur){
		if(joueur.result!=0){
		i++;
		toReturn=toReturn+""+i+". "+msToTime(joueur.result)+" --- "+joueur.name+"\n";
		}
	});
	if(i==0){
		toReturn="";
	}
	else{
		toReturn=toReturn+"```"
	}
	return toReturn;
}

function help(msg){
	msg.reply("!newrace       : starts a race - démarrer une race\n"+
			  "!enter         : join the race - rejoindre la race\n"+
			  "!ready         : you're ready to start ! - vous êtes prêt à partir\n"+
			  "!entrants      : player list - liste des joueurs\n"+
			  "!go            : starts the race (if everybody's ready)\n"+
			  "!done <time>   : you're done - Vous avez fini\n"+
			  "!undone        : if you've done/forfeit by accident\n"+
			  "!forfeit       : you quit the race - vous abandonnez la race\n"+
			  "!result        : display the current results - affiche les résultats du match\n"+
			  "!role <game>   : gives you the game role\n"+
			  "---- race_mods only ----\n"+
			  "!forcego\n"+
			  "!restart\n"+
			  "!notify  : notify all entrants - ping tous les runners\n"+
			  "!forceclose"
	,{code:true});
}

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

bot.on("error", (e) => console.error(e));
bot.on("warn", (e) => console.warn(e));
bot.on("debug", (e) => console.info(e));
  
bot.login(auth.token);
