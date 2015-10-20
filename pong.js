//define an empty pon object
Pong = {

  Defaults: {
    width:        640,   // logical canvas width (browser will scale to physical canvas size - which is controlled by @media css queries)
    height:       480,   // logical canvas height (ditto)
    wallWidth:    12,
    paddleWidth:  12,
    paddleHeight: 60,
    paddleSpeed:  2,     // should be able to cross court vertically   in 2 seconds
    ballSpeed:    4,     // should be able to cross court horizontally in 4 seconds, at starting speed ...
    ballAccel:    8,     // ... but accelerate as time passes
    ballRadius:   5,
    stats:        true
  },

  Colors: {
    walls: 'white',
    ball:  'white',
    score: 'white'
  },

  Images: [
    "images/press1.png",
    "images/press2.png",
    "images/winner.png"
  ],

  //-----------------------------------------------------------------------------

  initialize: function(runner, cfg) {
    Game.loadImages(Pong.Images, function(images) {
      this.cfg         = cfg;
      this.runner      = runner;
      this.width       = runner.width;
      this.height      = runner.height;
      this.images      = images;
      this.playing     = false;
      this.scores      = [0, 0];
      this.menu        = Object.construct(Pong.Menu,   this);
      this.court       = Object.construct(Pong.Court,  this);
      this.leftPaddle  = Object.construct(Pong.Paddle, this);
      this.rightPaddle = Object.construct(Pong.Paddle, this, true);
      this.ball        = Object.construct(Pong.Ball,   this);
      this.runner.start();
    }.bind(this));
  },

  startDemo:         function() { this.start(0); },
  startSinglePlayer: function() { this.start(1); },
  startDoublePlayer: function() { this.start(2); },

// since we've already dedclared the keyboard inputs, starting and stopping a game is now possible
  start: function(numPlayers) {
    if (!this.playing) {
      this.scores = [0, 0];
      this.playing = true;
      this.ball.reset();
      this.runner.hideCursor();
    }
  },

  stop: function(ask) {
    if (this.playing) {
      if (!ask || this.runner.confirm('Abandon game in progress ?')) {
        this.playing = false;
        this.runner.showCursor();
      }
    }
  },
//While the game is in progress, the update() method needs 
//to detect when goals are scored and when to declare a winner and stop the game:
  update: function(dt) {
    this.leftPaddle.update(dt, this.ball);
    this.rightPaddle.update(dt, this.ball);
    if (this.playing) {
      var dx = this.ball.dx;
      var dy = this.ball.dy;
      this.ball.update(dt, this.leftPaddle, this.rightPaddle);

      if (this.ball.left > this.width)
        this.goal(0);
      else if (this.ball.right < 0)
        this.goal(1);
    }
  },

  goal: function(playerNo) {
    this.scores[playerNo] += 1;
    if (this.scores[playerNo] == 1) {
      this.menu.declareWinner(playerNo);
      this.stop();
    }
    else {
      this.ball.reset(playerNo);
    }
  },

  update: function(dt) {
    this.leftPaddle.update(dt, this.ball);
    this.rightPaddle.update(dt, this.ball);
    if (this.playing) {
      var dx = this.ball.dx;
      var dy = this.ball.dy;
      this.ball.update(dt, this.leftPaddle, this.rightPaddle);

      if (this.ball.left > this.width)
        this.goal(0);
      else if (this.ball.right < 0)
        this.goal(1);
    }
  },

  draw: function(ctx) {
    this.court.draw(ctx);
    this.ball.draw(ctx);
  },

//create switch statement for events called upon keypress
  onkeydown: function(keyCode) {
    switch(keyCode) {
      case Game.KEY.ZERO: this.startDemo();            break;
      case Game.KEY.ONE:  this.startSinglePlayer();    break;
      case Game.KEY.TWO:  this.startDoublePlayer();    break;
      case Game.KEY.ESC:  this.stop(true);             break;
      case Game.KEY.Q:    this.leftPaddle.moveUp();    break;
      case Game.KEY.A:    this.leftPaddle.moveDown();  break;
      case Game.KEY.P:    this.rightPaddle.moveUp();   break;
      case Game.KEY.L:    this.rightPaddle.moveDown(); break;
    }
  },

  onkeyup: function(keyCode) {
    switch(keyCode) {
      case Game.KEY.Q: this.leftPaddle.stopMovingUp();    break;
      case Game.KEY.A: this.leftPaddle.stopMovingDown();  break;
      case Game.KEY.P: this.rightPaddle.stopMovingUp();   break;
      case Game.KEY.L: this.rightPaddle.stopMovingDown(); break;
    }
  },
  // The game is stopped when a winner is declared, it can also be stopped in response to the user hitting the ESC key
  stop: function(ask) {
    if (this.playing) {
      if (!ask || this.runner.confirm('Abandon game in progress ?')) {
        this.playing = false;
        this.runner.showCursor();
      }
    }
  },

  //tell pong.court object how to draw walls
  Court: {
    initialize: function(pong) {
      var w  = pong.width;
      var h  = pong.height;
      var ww = pong.cfg.wallWidth;

      this.walls = [];
      this.walls.push({x: 0,    y: 0,      width: w,  height: ww});
      this.walls.push({x: 0,    y: h - ww, width: w,  height: ww});
      this.walls.push({x: 0,    y: 0,      width: ww, height:  h});
      this.walls.push({x: w-ww, y: 0,      width: ww, height:  h});    
  },
  //Tell ball how to move and how it should be drawn
  Ball: {
    initialize: function(pong) {
      this.pong    = pong;
      this.radius  = pong.cfg.ballRadius;
      this.minX    = pong.cfg.wallWidth + this.radius;
      this.minY    = pong.cfg.wallWidth + this.radius;
      this.maxX    = pong.width  - pong.cfg.wallWidth - this.radius;
      this.maxY    = pong.height - pong.cfg.wallWidth - this.radius;
      this.x       = Game.random(this.minX, this.maxX);
      this.y       = Game.random(this.minY, this.maxY);
      this.dx      = (this.maxX - this.minX) / (Game.random(1, 10) * Game.randomChoice(1, -1));
      this.dy      = (this.maxY - this.minY) / (Game.random(1, 10) * Game.randomChoice(1, -1));
    },

    
    //this will keep on updating depending on the acceleration of the ball

    update: function(dt, leftPaddle, rightPaddle) {

      pos = Pong.Helper.accelerate(this.x, this.y, this.dx, this.dy, this.accel, dt);

      if ((pos.dy > 0) && (pos.y > this.maxY)) {
        pos.y = this.maxY;
        pos.dy = -pos.dy;
      }
      else if ((pos.dy < 0) && (pos.y < this.minY)) {
        pos.y = this.minY;
        pos.dy = -pos.dy;
      }

      var paddle = (pos.dx < 0) ? leftPaddle : rightPaddle;
      var pt     = Pong.Helper.ballIntercept(this, paddle, pos.nx, pos.ny);

      if (pt) {
        switch(pt.d) {
          case 'left':
          case 'right':
            pos.x = pt.x;
            pos.dx = -pos.dx;
            break;
          case 'top':
          case 'bottom':
            pos.y = pt.y;
            pos.dy = -pos.dy;
            break;
        }

        // add/remove spin based on paddle direction
        if (paddle.up)
          pos.dy = pos.dy * (pos.dy < 0 ? 0.5 : 1.5);
        else if (paddle.down)
          pos.dy = pos.dy * (pos.dy > 0 ? 0.5 : 1.5);
      }

      this.setpos(pos.x,  pos.y);
      this.setdir(pos.dx, pos.dy);
    },

    draw: function(ctx) {
      var w = h = this.radius * 2;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, 2*Math.PI, true);
      ctx.fill();
      ctx.closePath();
    }
    
  }

/* Helper method for acceleration which will
-calculate the new position and speed of the ball.
-detect if it bounced off the top or bottom wall (simple bounds check)
-detect if it bounced off a paddle (see next section)
-tweak the y speed to simulate spin if the ball hit a moving paddle
*/
  Helper: {
//This the update method should 
    accelerate: function(x, y, dx, dy, accel, dt) {
      var x2  = x + (dt * dx) + (accel * dt * dt * 0.5);
      var y2  = y + (dt * dy) + (accel * dt * dt * 0.5);
      var dx2 = dx + (accel * dt) * (dx > 0 ? 1 : -1);
      var dy2 = dy + (accel * dt) * (dy > 0 ? 1 : -1);
      return { nx: (x2-x), ny: (y2-y), x: x2, y: y2, dx: dx2, dy: dy2 };
    },
// line intersection
    intercept: function(x1, y1, x2, y2, x3, y3, x4, y4, d) {
      var denom = ((y4-y3) * (x2-x1)) - ((x4-x3) * (y2-y1));
      if (denom != 0) {
        var ua = (((x4-x3) * (y1-y3)) - ((y4-y3) * (x1-x3))) / denom;
        if ((ua >= 0) && (ua <= 1)) {
          var ub = (((x2-x1) * (y1-y3)) - ((y2-y1) * (x1-x3))) / denom;
          if ((ub >= 0) && (ub <= 1)) {
            var x = x1 + (ua * (x2-x1));
            var y = y1 + (ua * (y2-y1));
            return { x: x, y: y, d: d};
          }
        }
      }
      return null;
    },
//Ball and paddle intersection
    ballIntercept: function(ball, rect, nx, ny) {
      var pt;
      if (nx < 0) {
        pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                   rect.right  + ball.radius, 
                                   rect.top    - ball.radius, 
                                   rect.right  + ball.radius, 
                                   rect.bottom + ball.radius, 
                                   "right");
      }
      else if (nx > 0) {
        pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                   rect.left   - ball.radius, 
                                   rect.top    - ball.radius, 
                                   rect.left   - ball.radius, 
                                   rect.bottom + ball.radius,
                                   "left");
      }
      if (!pt) {
        if (ny < 0) {
          pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                     rect.left   - ball.radius, 
                                     rect.bottom + ball.radius, 
                                     rect.right  + ball.radius, 
                                     rect.bottom + ball.radius,
                                     "bottom");
        }
        else if (ny > 0) {
          pt = Pong.Helper.intercept(ball.x, ball.y, ball.x + nx, ball.y + ny, 
                                     rect.left   - ball.radius, 
                                     rect.top    - ball.radius, 
                                     rect.right  + ball.radius, 
                                     rect.top    - ball.radius,
                                     "top");
        }
      }
      return pt;
    }

  }