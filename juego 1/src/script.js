var config = {
    type: Phaser.AUTO, // Tipo de renderizado: Phaser.AUTO elige automáticamente entre WebGL y Canvas
    width: 800, // Ancho del juego en píxeles
    height: 600, // Alto del juego en píxeles
    physics: {
        default: 'arcade', // Motor de físicas predeterminado: 'arcade'
        arcade: {
            gravity: { y: 300 }, // Gravedad aplicada al juego (eje Y)
            debug: false // Modo de depuración de físicas desactivado
        }
    },
    scene: {
        preload: preload, // Función de precarga de recursos
        create: create, // Función de creación de objetos al inicio
        update: update // Función de actualización en cada frame
    }
};

var game = new Phaser.Game(config); // Creación del juego con la configuración definida arriba

var score = 0; // Puntaje inicial del jugador
var scoreText; // Texto para mostrar el puntaje en pantalla
var player; // Jugador controlado por el usuario
var cursors; // Objeto para detectar entrada del teclado
var cafe; // Grupo de tazas de café que el jugador debe recolectar
var bombs; // Grupo de bombas que pueden dañar al jugador
var gameOver = false; // Estado del juego: true si el juego ha terminado
var totalCafe = 12; // Total de tazas/café a recolectar

function preload() {
    // Función de precarga de recursos
    this.load.image('sky', 'assets/sky.png'); // Precarga del fondo del juego
    this.load.image('ground', 'assets/platform.png'); // Precarga de las plataformas estáticas
    this.load.image('cafe', 'assets/cafe.png'); // Precarga de la imagen de las tazas de café
    this.load.image('bomb', 'assets/bomb.png'); // Precarga de la imagen de las bombas
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 }); // Precarga del spritesheet del jugador con dimensiones específicas
    this.load.image('restartButton', 'assets/restart_button.png'); // Precarga del botón de reinicio
}

function create() {
    // Función de creación de objetos al inicio del juego

    this.add.image(400, 300, 'sky'); // Agrega el fondo del juego en la posición especificada

    // Creación de plataformas estáticas
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 568, 'ground').setScale(2).refreshBody();
    platforms.create(600, 400, 'ground');
    platforms.create(50, 250, 'ground');
    platforms.create(750, 220, 'ground');

    // Creación del jugador
    player = this.physics.add.sprite(100, 450, 'dude');
    player.setCollideWorldBounds(true); // Limita al jugador dentro de los límites del juego
    player.setBounce(0.2); // Configura el rebote del jugador

    // Animaciones del jugador
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'turn',
        frames: [{ key: 'dude', frame: 4 }],
        frameRate: 20,
    });
    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    this.physics.add.collider(player, platforms); // Colisión del jugador con las plataformas

    cursors = this.input.keyboard.createCursorKeys(); // Captura de teclas de dirección del teclado

    // Grupo de tazas de café
    cafe = this.physics.add.group({
        key: 'cafe',
        repeat: 11,
        setXY: { x: 12, y: 0, stepX: 70 } // Distribución horizontal de las tazas de café
    });
    cafe.children.iterate(function(child) {
        child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8)); // Configuración del rebote vertical de cada taza de café
    });
    this.physics.add.collider(cafe, platforms); // Colisión de las tazas de café con las plataformas

    // Detector de colisión entre el jugador y las tazas de café
    this.physics.add.overlap(player, cafe, collectCafe, null, this);

    // Grupo de bombas
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, platforms); // Colisión de las bombas con las plataformas
    this.physics.add.collider(player, bombs, hitBomb, null, this); // Detector de colisión entre el jugador y las bombas

    // Texto para mostrar el puntaje en pantalla
    scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });

    // Botón de reinicio
    var restartButton = this.add.image(750, 30, 'restartButton').setInteractive();
    restartButton.on('pointerdown', function() {
        // Recargar la página actual para reiniciar el juego
        location.reload();
    });
}
function update() {
    // Función de actualización en cada frame
    if (gameOver) {
        return; // Si el juego ha terminado, no se realiza la actualización
    }
    // Movimiento del jugador según las teclas presionadas
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }
    // Salto del jugador si está tocando el suelo y se presiona la tecla hacia arriba
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-330);
    }
}

function collectCafe(player, cafeItem) {
    // Función para recolectar tazas de café

    cafeItem.disableBody(true, true); // Desactiva la física de la taza de café recolectada

    score += 10; // Aumenta el puntaje del jugador
    scoreText.setText('Score: ' + score); // Actualiza el texto del puntaje en pantalla

    // Si todas las tazas de café han sido recolectadas, se reactivan y se crea una nueva bomba
    if (cafe.countActive(true) === 0) {
        cafe.children.iterate(function(child) {
            child.enableBody(true, child.x, 0, true, true);
        });

        createBomb();
    }
}

function createBomb() {
    // Función para crear una bomba

    var x = Phaser.Math.Between(100, 700); // Posición X aleatoria para la bomba
    var y = Phaser.Math.Between(100, 300); // Posición Y aleatoria para la bomba

    var bomb = bombs.create(x, y, 'bomb'); // Crea la bomba en la posición aleatoria
    bomb.setBounce(1); // Configura el rebote de la bomba
    bomb.setCollideWorldBounds(true); // Limita la bomba dentro de los límites del mundo
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20); // Velocidad aleatoria de la bomba

    bomb.setInteractive(); // Hace que la bomba sea interactiva para detectar colisiones

    bomb.on('pointerover', function() {
        // Evento cuando el mouse pasa sobre la bomba
        this.setTint(0xff0000); // Cambia el color a rojo
    });

    bomb.on('pointerout', function() {
        // Evento cuando el mouse sale de la bomba
        this.clearTint(); // Elimina el tint rojo
    });

    bomb.on('pointerdown', function() {
        // Evento cuando se hace clic en la bomba
        this.setTint(0xffff00); // Cambia el color a amarillo
    });
}

function hitBomb(player, bomb) {
    // Función para manejar el impacto del jugador con una bomba

    this.physics.pause(); // Pausa el motor de físicas
    player.setTint(0xff0000); // Pone el jugador de color rojo
    player.anims.play('turn'); // Ejecuta la animación de estar quieto
    gameOver = true; // Establece el estado del juego como terminado
}
