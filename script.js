var board;
var boardElements = [];
var heroWidth = 50;
var hero;
var step = 5;
var slippage = 0.9;
var start;
var gameStarted = false;
var timer;

function init() {
	board = $("#board")[0];
	boardElements = [];

	createEnemies(5, "asteroid");
	createHero();
	drawElements();
	setHighScore();
	start = new Date().getTime();
	//requestAnimationFrame(tick);

	timer = setInterval(tick, 35);
}

function tick() {
	for (i=0; i<boardElements.length; i++) {
		boardElements[i].move();

		if (boardElements[i].y > board.height || boardElements[i].x > board.width || boardElements[i].x+boardElements[i].width < 0) {
			var type = chooseEnemyType();

			boardElements.splice(i, 1);
			var luck = Math.random();
			if (luck < 0.5)
				createEnemies(1, type);
			else if (luck < 0.8)
				createEnemies(2, type);
			else if (boardElements.length <= 1)
				createEnemies(2, type);
		}
	}
	drawElements();
	detectCollision();

	if (Math.abs(hero.v.x) != step)
		hero.v.x *= slippage;
	if (Math.abs(hero.v.y) != step)
		hero.v.y *= slippage;

	updateScore();
	//requestAnimationFrame(tick);
}

function chooseEnemyType() {
	var actual = parseInt($("#actual").text().split(" ")[1]);
	if (actual < 400)
		return "asteroid";
	if (actual < 800)
		return "grey_asteroid";
	if (actual < 1000)
		return "stone";
	if (actual < 1200)
		return "asteroid_holes";
	if (actual < 1400)
		return "cookieroid";
	if (actual < 1600)
		return "earth";
	if (actual < 1800)
		return "invader";
	return "asteroid_plain";
}

function setHighScore() {
	var best = $.cookie("highScore");
	if (best == undefined)
		best = 0;
	$("#best").text("best: " + best);
}

function updateScore() {
	var gameTime = new Date().getTime() - start;
	gameTime = parseInt(gameTime / 100);

	$("#actual").text("actual: " + gameTime);
}

function detectCollision() {
	var eps = 7;
	for (i=0; i<boardElements.length; i++) {
		if (boardElements[i].type == "hero")
			continue;
		var enemy = boardElements[i];

		var hcx = hero.x + hero.width/2;
		var hcy = hero.y + hero.width/2;
		var ecx = enemy.x + enemy.width/2;
		var ecy = enemy.y + enemy.width/2;
		var dist = Math.sqrt((hcx-ecx)*(hcx-ecx) + (hcy-ecy)*(hcy-ecy));

		if (dist+eps < enemy.width/2 + hero.width/2) {
			// save score
			var actual = parseInt($("#actual").text().split(" ")[1]);
			var best = parseInt($("#best").text().split(" ")[1]);
			if (actual > best)
				$.cookie("highScore", actual);
			// display screen
			displayGameOverScreen();
			// stop game
			clearInterval(timer);
			gameStarted = false;
		}
	}
}

function displayGameOverScreen() {
	$("#startScreen").css("display", "table");
	var actual = parseInt($("#actual").text().split(" ")[1]);
	var best = parseInt($("#best").text().split(" ")[1]);

	var info = "<strong>GAME OVER</strong> <br /><br />" +
		"Your score: " + actual;
	if (actual > best)
		info += " (new high score, congratulations!)";
	info += "<br />Press space to play again";

	$("#gameInfo").text("");
	$("#gameInfo").html(info);
}

// moving hero
$(document).on("keydown", function(e) {
	if (!gameStarted) {
		if (e.keyCode >= 37 && e.keyCode <= 40)
			return;

		gameStarted = true;
		$("#startScreen").css("display", "none");
		init();
		return;
	}

	// left
	if (e.keyCode == 37) {
		hero.v.x = -step;
	}
	// up
	else if (e.keyCode == 38) {
		hero.v.y = -step;
	}
	// right
	else if (e.keyCode == 39) {
		hero.v.x = step;
	}	
	// down
	else if (e.keyCode == 40) {
		hero.v.y = step;
	}
});
$(document).on("keyup", function(e) {
	// left
	if (e.keyCode == 37 && hero.v.x < 0) {
		hero.v.x *= slippage;
	}
	// up
	else if (e.keyCode == 38 && hero.v.y < 0) {
		hero.v.y *= slippage;
	}
	// right
	else if (e.keyCode == 39 && hero.v.x > 0) {
		hero.v.x *= slippage;
	}	
	// down
	else if (e.keyCode == 40 && hero.v.y > 0) {
		hero.v.y *= slippage;
}
});

function drawElements() {
	var ctx = board.getContext("2d");
	ctx.clearRect(0, 0, board.width, board.height);
	for (i=0; i<boardElements.length; i++) {
		boardElements[i].draw();
	}
}
function createHero() {
	var x = (board.width - heroWidth) / 2;
	var y = board.height - heroWidth;
	hero = createElement(x, y, heroWidth, "hero");
}
function createEnemies(count, type) {
	for (i=0; i<count; i++) {
		var width = 2 * (Math.random() * heroWidth) + 0.1*heroWidth;
		var boardWidth = board.width - width;
		x = Math.random() * boardWidth;
		y = -width;
		var el = createElement(x, y, width, type);
		var Vx = Math.random() * 2 * step - step;
		var Vy = Math.random() * step/2 + step/2;
		el.v = new Vector(Vx, Vy);
	}
}
function createElement(x, y, width, type) {
	var el = new Element(x, y, width, type);
	boardElements.push(el);
	return el;
}


//////////////
// CLASSES	//
//////////////
function Element(x, y, width, type) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.type = type;
		this.v = new Vector(0,0);
		this.draw = function() {
			var ctx = board.getContext("2d");
			if (this.type == "hero") {
				img = $("#hero")[0];
				ctx.drawImage(img, this.x, this.y);
			}
			else {
				img = $("#"+this.type)[0];
				ctx.drawImage(img, this.x, this.y, this.width, this.width);
			}
		}
		this.move = function() {
			this.x += this.v.x;
			this.y += this.v.y;

			if (type == "hero") {
				if (this.x < 0)
					this.x = 0;
				if (this.y < 0)
					this.y = 0;
				if (this.x+this.width > board.width)
					this.x = board.width - this.width;
				if (this.y+this.width > board.height)
					this.y = board.height - this.width;
			}
		}
}

function Vector(x, y) {
	this.x = x;
	this.y = y;
}