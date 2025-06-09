export default class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.tilemapTiledJSON("mapa", "public/assets/tilemap/mapa.json");
    this.load.image("tiles", "public/assets/atlas/albañil.png");
    this.load.image("star", "public/assets/atlas/star.png");
    this.load.spritesheet("pj", "./public/assets/atlas/pj.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
    this.load.image("pocion", "public/assets/atlas/pocion.jpg"); // <--- DESCOMENTA ESTA LÍNEA
  }

  create() {
    const map = this.make.tilemap({ key: "mapa" });
    const tileset = map.addTilesetImage("pared", "tiles");

    const sueloLayer = map.createLayer("suelo", tileset, 0, 0);
    const suelo2Layer = map.createLayer("suelo2", tileset, 0, 0);
    const paredesLayer = map.createLayer("paredes", tileset, 0, 0);
    paredesLayer.setCollisionByProperty({ collide: true });

    // Guardar todos los puntos de spawn
    this.spawnPoints = map.getObjectLayer("objetos").objects.filter(obj => obj.name === "pj");

    // Usar el primer spawn por defecto
    const spawnPoint = this.spawnPoints[0];

    if (!spawnPoint) {
      console.error("No se encontró el objeto 'pj' en Tiled.");
      return;
    }

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "pj");
    this.player.setScale(0.5);
    this.physics.add.collider(this.player, paredesLayer);

    paredesLayer.renderDebug(this.add.graphics(), {
      tileColor: null,
      collidingTileColor: new Phaser.Display.Color(255, 0, 0, 100),
      faceColor: new Phaser.Display.Color(0, 255, 0, 255)
    });

    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Crear grupo de pociones
    this.crearPociones(map);

    this.physics.add.overlap(
      this.player,
      this.pociones,
      this.recogerPocion,
      null,
      this
    );

    // Detectar contacto con suelo2
    this.physics.add.overlap(
      this.player,
      suelo2Layer,
      this.tocarSuelo2,
      null,
      this
    );

    this.cursors = this.input.keyboard.createCursorKeys();

    // --- EFECTO DE OSCURIDAD CON MÁSCARA ---
    this.darkness = this.add.graphics();
    this.darkness.fillStyle(0x000000, 0.95);
    this.darkness.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    this.darkness.setScrollFactor(0);

    // Crea un gráfico para la máscara
    this.visionMask = this.make.graphics({ x: 0, y: 0, add: false });
    this.visionMask.fillStyle(0xffffff);
    this.visionMask.fillCircle(0, 0, this.visionRadius);

    // Aplica la máscara
    this.darknessMask = this.visionMask.createGeometryMask();
    this.darkness.setMask(this.darknessMask);
  }

  // Función para crear pociones
  crearPociones(map) {
    if (this.pociones) this.pociones.clear(true, true);
    this.pociones = this.physics.add.group();
    map.getObjectLayer("objetos").objects.forEach((obj) => {
      if (obj.name === "pocion") {
        this.pociones
          .create(obj.x, obj.y, "pocion")
          .setOrigin(0, 1)
          .setScale(0.1); // <-- Muchísimo más pequeña
      }
    });
  }

  // Al recoger una poción
  recogerPocion(player, pocion) {
    pocion.destroy();
    if (this.pociones.countActive(true) === 0) {
      this.todasPocionesRecogidas = true;
      this.puedeTeletransportar = false; // Nueva bandera
      // Mensaje opcional
      console.log("¡Has recogido todas las pociones! Busca el suelo2 para reiniciar.");
    }
  }

  // Al tocar suelo2 después de recoger todas las pociones
  tocarSuelo2(player, tile) {
    if (this.todasPocionesRecogidas && !this.puedeTeletransportar) {
      this.puedeTeletransportar = true; // Permite teletransportar solo una vez

      // Elegir un spawn diferente al actual
      const spawnsDisponibles = this.spawnPoints.filter(spawn =>
        spawn.x !== this.player.x || spawn.y !== this.player.y
      );
      const nuevoSpawn = Phaser.Utils.Array.GetRandom(spawnsDisponibles);

      // Mover al jugador al nuevo spawn
      this.player.setPosition(nuevoSpawn.x, nuevoSpawn.y);

      // Reiniciar pociones
      this.todasPocionesRecogidas = false;
      this.crearPociones(this.make.tilemap({ key: "mapa" }));

      // Volver a registrar el overlap con las nuevas pociones
      this.physics.add.overlap(
        this.player,
        this.pociones,
        this.recogerPocion,
        null,
        this
      );

      // Opcional: mensaje
      console.log("¡Nuevo ciclo iniciado en otro spawn!");
    }
  }

  update() {
    // Movimiento del jugador
    if (!this.player) return;

    const speed = 150;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }

    // --- EFECTO DE OSCURIDAD CON MÁSCARA ---
    if (this.visionMask && this.player) {
      const cam = this.cameras.main;
      const px = this.player.x - cam.scrollX;
      const py = this.player.y - cam.scrollY;

      this.visionMask.clear();
      this.visionMask.fillStyle(0xffffff);
      this.visionMask.fillCircle(px, py, this.visionRadius);
    }
  }
}
