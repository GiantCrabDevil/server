
var __suspects = ["Mrs. Peacock", "Mrs. Green", "Miss Scarlet", 
					"Colonel Mustard", "Professor Plum"];
var __rooms = ["Kitchen", "Study", "Living Room", "Dining Room", "Library"];
var __weapons = ["Pistol", "Knife", "Wrench", "Lead Pipe", "Candlestick"];


var userName;
var cardTypes = 3;
var userCards;
var cpuCards;
var winCards;
var numCards;
var shuffles;
var handSize;
var userGuess;
var compChoices;
var cpuGuess;
var showHistory;
var showRecord;
var choices;

function loadPageData() {
	var sus = document.getElementById('suspects');
	var rm = document.getElementById('rooms');
	var wp = document.getElementById('weapons');
	var susList = "Suspects: " + __suspects[0];
	var rmList = "Rooms: " + __rooms[0];
	var wpList = "Weapons: " + __weapons[0]; 
	for (var i = 0; i < __suspects.length; i++) {
		sus.options[sus.options.length] = new Option(__suspects[i], __suspects[i]);
		rm.options[rm.options.length] = new Option(__rooms[i], __rooms[i]);
		wp.options[wp.options.length] = new Option(__weapons[i], __weapons[i]);
		if (i > 0) {
			susList += (", " + __suspects[i]);
			rmList += (", " + __rooms[i]);
			wpList += (", " + __weapons[i]);
		}
	}
	document.getElementById('choiceList').innerHTML = (susList + "<br/>" +
		rmList + "<br/>" + wpList + "<br/>");
}
function init() {
	userName = document.getElementById("nameBox").value;
	numCards = __suspects.length;
	shuffles = numCards * numCards * 2;
	handSize = (Math.floor(numCards/2)*cardTypes);
	showHistory = false;
	choices = __suspects.length;
	if (localStorage.compWin == undefined || localStorage.compWin == "") {
		localStorage.compWin = 0;
	} 
	if (localStorage.compLoss == undefined || localStorage.compLoss == "") {
		localStorage.compLoss = 0;
	} 
	setBoard();
}
function setBoard() {
	output('');
	shuffle();
	displayUserCards();
	disableGuess(false);
	sessionStorage.userHistory = "";
	if (showHistory) displayHistory();
	document.getElementById('histBut').disabled = true;
	debug("");
}
function shuffle() {
	userCards = new Array(handSize);
	cpuCards = new Array(handSize);
	winCards = new Array(cardTypes);
	var temp;
	for (var i = 0; i < shuffles; i++) {
		swap(randomInt(0,choices), randomInt(0,choices), __suspects);
		swap(randomInt(0,choices), randomInt(0,choices), __rooms);
		swap(randomInt(0,choices), randomInt(0,choices), __weapons);
	}
	var eachType = handSize / cardTypes;
	winCards = [__suspects[0], __rooms[0], __weapons[0]];
	for (var i = 0; i < eachType; i++) {
		userCards[i] = __suspects[i * 2 + 1];
		userCards[i + eachType] = __rooms[i * 2 + 1];
		userCards[i + eachType * 2] = __weapons[i * 2 + 1];
		cpuCards[i] = __suspects[i * 2 + 2];
		cpuCards[i + eachType] = __rooms[i * 2 + 2];
		cpuCards[i + eachType * 2] = __weapons[i * 2 + 2];
	}
	compChoices = userCards.concat(winCards);
}
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}
function swap(i1, i2, array) {
	var temp = array[i1];
	array[i1] = array[i2];
	array[i2] = temp;
}
function displayUserCards() {
	var message = "Hello " + userName + ", you have the following cards: ";
	message += userCards[0];
	for (var i = 1; i < userCards.length; i++) {
		message += (", " + userCards[i]);
	}
	document.getElementById("userName").innerHTML =  message;
}
function checkGuess() {
	var win = true;
	var incorrect = new Array(0);
	userGuess = [document.getElementById('suspects').value,
					document.getElementById('rooms').value,
					document.getElementById('weapons').value];
	sessionStorage.userHistory += (userName + " Guessed: " + 
								userGuess[0] + ", " +
								userGuess[1] + ", " +
								userGuess[2] + "|");
	document.getElementById('histBut').disabled = false;
	if (showHistory) displayHistory();
	for (var i = 0; i < userGuess.length; i++) {
		if (userGuess[i] != winCards[i]) {
			win = false;
			incorrect.push(userGuess[i]);
		}
 	}
 	if (win) {
 		output("You are the Winner!!!" +
 			"<br/><input id='playAgain' type='button'" + 
 			"value='Play Again' onclick='setBoard()'/>");
 		disableGuess(true);
 		localStorage.records += (userName + " beat computer " + " on " + 
 			prettyDate() + "|");
 		localStorage.compLoss = parseInt(localStorage.compLoss) + 1;
 		document.getElementById('recBut').disabled = false;
		if (showRecord) displayRecord();	
 	} else {
 		output("You got at least one answer [" + 
 			incorrect[randomInt(0,incorrect.length)] + "] incorrect." +
 			"<br/><input type='button' value='Computer Turn' onclick='cpuTurn()'/>");
 		disableGuess(true);
 	}
}
function cpuTurn() {
	makeCpuGuess();
	cpuWin = checkCpuGuess();
	var msg = "The computer guessed: " + cpuGuess[0];
	for(var i = 1; i < cpuGuess.length; i++) {
		msg += ", " + cpuGuess[i];
	}
	msg += ", which is ";
	if (cpuWin) {
		localStorage.records += ("Computer beat " + userName + " on " + 
			prettyDate() + "|");
		document.getElementById('recBut').disabled = false;
		if (displayHistory) displayHistory();
		msg += "correct.  CPU WINS!!!" + 
			"<br/><input type='button' value='Play Again' onclick='setBoard()'/>";
		localStorage.compWin = parseInt(localStorage.compWin) + 1;
		if (showRecord) displayRecord();

	} else {
		msg += "incorrect." + 
			"<br/><input type='button' value='Next Turn' onclick='nextGuess()'/>";
	}
	output(msg);
}
function makeCpuGuess() {
	var choiceArray = [__suspects, __rooms, __weapons];
	cpuGuess = new Array(cardTypes);
	for(var i = 0; i < cardTypes; i++){
		var flag = false;
		while(!flag){
			cpuGuess[i] = choiceArray[i][randomInt(0,5)];
			flag = inArray(cpuGuess[i], compChoices);	
		}
	}
	sessionStorage.userHistory += ("Computer Guessed: " + 
								cpuGuess[0] + ", " +
								cpuGuess[1] + ", " +
								cpuGuess[2] + "|");	
	if(showHistory) displayHistory();	
}
function checkCpuGuess() {
	for(var i = 0; i < cardTypes; i ++) {
		if (cpuGuess[i] != winCards[i]) {
			compChoices.splice(compChoices.indexOf(cpuGuess[i]),1);
			return false;
		}
	}
	return true;
}
function nextGuess() {
	output("");
	disableGuess(false);
}
function disableGuess(param) {
	if(param){
		document.getElementById('guess').disabled = true;
	}else{
		document.getElementById('guess').disabled = false;
	}
}
function inArray(item, array) {
	for(var i = 0; i < array.length; i++) {
		if (item == array[i]) {
			return true;
		}
	}
	return false;
}
function toggleHistory() {
	var temp = document.getElementById('histBut');
	if(temp.value == 'Show History') {
		temp.value = 'Hide History';
		showHistory = true;
		displayHistory();
	} else {
		temp.value = 'Show History';
		showHistory = false;
		document.getElementById('history').innerHTML = "";
	}
}
function displayHistory() {
	var userHist = sessionStorage.userHistory.split("|");
	var msg = "";
	for (var i = userHist.length; i > 1; i--) {
		msg += (userHist[i-2] + "<br/>");
	}
	document.getElementById('history').innerHTML = msg;
}
function toggleRecord() {
	var temp = document.getElementById('recBut');
	if(temp.value == 'Show Record') {
		temp.value = 'Hide Record';
		showRecord = true;
		displayRecord();
	} else {
		temp.value = 'Show Record';
		showRecord = false;
		document.getElementById('record').innerHTML = "";
	}
}
function displayRecord() {
	var temp = localStorage.records.split("|");
	var msg = "";
	for (var i = temp.length; i > 1; i--) {
		msg += (temp[i-2] + "<br/>");
	}
	document.getElementById('wl').innerHTML = ("Computer's W - L record: " + 
		localStorage.compWin + " - " + localStorage.compLoss);
	document.getElementById('record').innerHTML = msg;
}
function test() {
	var m = "";
	for (var i = 0; i < winCards.length; i++){
		m += winCards[i] + ", ";
	}
	
	debug(m);
}
function prettyDate() {
	var date = new Date();
	var month = date.getMonth();
	var day = date.getDate();
	var year = date.getFullYear();
	var hour = date.getHours();
	var min = date.getMinutes();
	min = min < 10 ? '0' + min : min;
	return (month + '.' + day + '.' + year + ' (' + hour + ':' + min + ')');
}
function clearLocalHistory() {
	localStorage.records = ""
	localStorage.compLoss = "";
	localStorage.compWin = "";
}
function output(msg) {
	document.getElementById("output").innerHTML = msg;
}
function debug(msg) {
	document.getElementById("debug").innerHTML = msg;
}