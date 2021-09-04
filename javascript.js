/* based on tutorial from https://phaser.io/tutorials/making-your-first-phaser-3-game/part1
September 2021 Mark Lagana */

var config = {
  players: 5,
  player_textures: 4,
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  block_width: 32,
  block_height: 48,

  physics: {
    default: 'arcade',
    arcade: {
        gravity: { y: 300 },
        debug: false
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  key_binds: { // left, right, jump
    // player_0 is arrow keys
    1: ['A', 'D', 'W'], 
    2: ['F', 'H', 'T'],
    3: ['J', 'L', 'I'],
    4: ['NUMPAD_FOUR', 'NUMPAD_SIX', 'NUMPAD_EIGHT'],
  }
};

let Player = class
{
  constructor(player_number, sprites)
  {
    this.player_number = player_number
    this.score = 0;
    if(player_number >= config.player_textures)
    {
      sprites.load.spritesheet('player' + player_number, 'assets/player0.png', { frameWidth: config.block_width, frameHeight: config.block_height });
    }
    else
    {
      sprites.load.spritesheet('player' + player_number, 'assets/player' + this.player_number + '.png', { frameWidth: config.block_width, frameHeight: config.block_height });
    }
  }

  setup(phaser_context)
  {
    this.player = phaser_context.physics.add.sprite( Math.floor(Math.random() * config.width), // randomise spawn points
                                                    Math.floor(Math.random() * (config.height - 200)),
                                                    'player' + this.player_number);
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(true);
    this.player.name = this.player_number // identifies player in callbacks

    this.player.anims.create({ // animation keyframes left
        key: 'left',
        frames: this.player.anims.generateFrameNumbers('player' + this.player_number, { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.player.anims.create({ // animation keyframes turn
        key: 'turn',
        frames: [ { key: 'player' + this.player_number, frame: 4 } ],
        frameRate: 20
    });

    this.player.anims.create({ // animation keyframes right
        key: 'right',
        frames: this.player.anims.generateFrameNumbers('player' + this.player_number, { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    let textCol = (config.width/config.players) * this.player_number;

    if (this.player_number > 0 && this.player_number < (Object.keys(config.key_binds).length + 1))
    {
      this.left = phaser_context.input.keyboard.addKey( eval( "Phaser.Input.Keyboard.KeyCodes." + config.key_binds[this.player_number][0] ) );
      this.right = phaser_context.input.keyboard.addKey( eval( "Phaser.Input.Keyboard.KeyCodes." + config.key_binds[this.player_number][1] ) );
      this.up = phaser_context.input.keyboard.addKey( eval( "Phaser.Input.Keyboard.KeyCodes." + config.key_binds[this.player_number][2] ) );
      this.scoreText = phaser_context.add.text(10 + textCol, 16, this.player_number + ':0', { fontSize: '32px', fill: '#000' });
    }
    else
    {
      cursors = phaser_context.input.keyboard.createCursorKeys();
      this.left = cursors.left
      this.right = cursors.right
      this.up = cursors.up
      this.scoreText = phaser_context.add.text(10 + textCol, 16, this.player_number + ':0', { fontSize: '32px', fill: '#000' });
    }
  
  }

  setText()
  {
    this.scoreText.setText(this.player_number + ':' +  this.score);
  }

  go_left()
  {
    this.player.setVelocityX(-160);
    this.player.anims.play('left', true);
  }

  go_right()
  {
    this.player.setVelocityX(160);
    this.player.anims.play('right', true);
  }

  turn()
  {
    this.player.setVelocityX(0);
    this.player.anims.play('turn');
  }

  jump()
  {
    this.player.setVelocityY(-330);
  }

};

var stars;
var bombs;
var platforms;
var cursors;
var gameOver = false;
var players = []
var game = new Phaser.Game(config);

function preload ()
{

  for (let player_no = 0; player_no < config.players; player_no++)
  {
    players.push(new Player(player_no, this))
  }

  this.load.image('sky', 'assets/sky.png');
  this.load.image('ground', 'assets/platform.png');
  this.load.image('star', 'assets/star.png');
  this.load.image('bomb', 'assets/bomb.png');
}

function create ()
{
  this.add.image(400, 300, 'sky');  //  A simple background for our game
  platforms = this.physics.add.staticGroup();
  platforms.create(400, 568, 'ground').setScale(2).refreshBody(); // ground
  platforms.create(600, 400, 'ground'); //ledges
  platforms.create(50, 250, 'ground');
  platforms.create(750, 220, 'ground');

  for (let player_no = 0; player_no < config.players; player_no++)
  {
    players[player_no].setup(this);
  }

  stars = this.physics.add.group({key: 'star', repeat: 11, setXY: { x: 12, y: 0, stepX: 70 }});
  stars.children.iterate(function (child) {child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));});

  bombs = this.physics.add.group();

  for (let player_no = 0; player_no < config.players; player_no++)  // collisions
  {
    this.physics.add.collider(players[player_no].player, platforms);
    this.physics.add.overlap(players[player_no].player, stars, collectStar, null, this);
    this.physics.add.collider(players[player_no].player, bombs, hitBomb, null, this);

    for (let player_no_2 = 0; player_no_2 < config.players; player_no_2++) // player collisions with eachother
    {
      if (player_no != players[player_no_2].player.player_number) 
      {
        this.physics.add.collider(players[player_no].player, players[player_no_2].player);
      }
    }
  }

  this.physics.add.collider(stars, platforms);    
  this.physics.add.collider(bombs, platforms);

}

function update ()
{
  if (gameOver)
  {
      return;
  }

  for (let player_no = 0; player_no < config.players; player_no++)
  {
    if (players[player_no].left.isDown)
    {
      players[player_no].go_left()
    }
    else if (players[player_no].right.isDown)
    {
      players[player_no].go_right()
    }
    else
    {
      players[player_no].turn()
    }
    
    if (players[player_no].up.isDown  && players[player_no].player.body.touching.down)
    {
      players[player_no].jump()
    }
  }
}
  
function hitBomb(player, bomb)
{
    this.physics.pause();
    players[player.name].player.setTint(0xff0000);
    players[player.name].player.anims.play('turn');

    tmp_score = 0
    winner = 0
    for (let player_no = 0; player_no < config.players; player_no++)
    {
      if (players[player_no].score > tmp_score)
      {
        winner = player_no
        tmp_score = players[player_no].score
      }
    }

    this.add.text(config.width/2 - 150, config.height/2, 'player ' + winner + " wins!", { fontSize: '32px', fill: '#000' });
    gameOver = true;
}

function collectStar(player, star)
{
  star.disableBody(true, true);

  players[player.name].score += 10
  players[player.name].setText()

  if (stars.countActive(true) === 0)
  {
    stars.children.iterate(function (child)
    { //  A new batch of stars to collect
      child.enableBody(true, child.x, 0, true, true);
    });

    var x = (players[player.name].player.x < 400) ? Phaser.Math.Between(400, 800) : Phaser.Math.Between(0, 400);

    if(config.players <= 16)
    {
      var bomb = bombs.create(29, 16, 'bomb');
      bomb.setBounce(1);
      bomb.setCollideWorldBounds(true);
      bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
      bomb.allowGravity = false;
    }
  }
}
