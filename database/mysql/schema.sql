
DROP DATABASE IF EXISTS proyectoBD;

-- Base de datos
Create database proyectoBD;

-- Usar base de datos
use proyectoBD;

-- Creacionde tablas
CREATE TABLE tbl_usuario(
id_usuario INT AUTO_INCREMENT PRIMARY KEY,
nombre_usu VARCHAR (50)NOT NULL UNIQUE,
correo_usu VARCHAR (100)NOT NULL UNIQUE,
contrasena_usu VARCHAR (255)NOT NULL,
fecha_registro_usu DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_artista(
id_artista INT AUTO_INCREMENT PRIMARY KEY, 
nombre_art VARCHAR (60) NOT NULL
);

CREATE TABLE tbl_genero(
id_genero INT AUTO_INCREMENT PRIMARY KEY,
nombre_gen VARCHAR (50) NOT NULL UNIQUE
);

CREATE TABLE tbl_album(
id_album INT AUTO_INCREMENT PRIMARY KEY,
titulo_alb VARCHAR (100) NOT NULL,
fecha_lanzamiento_alb DATE,
id_artista INT NOT NULL,

CONSTRAINT fk_album_artista FOREIGN KEY (id_artista)
REFERENCES tbl_artista (id_artista) ON DELETE RESTRICT
);

CREATE TABLE tbl_playlist(
id_playlist INT AUTO_INCREMENT PRIMARY KEY,
titulo_play VARCHAR (50)NOT NULL,
fecha_creacion_play DATETIME DEFAULT CURRENT_TIMESTAMP,
descripcion_play VARCHAR(120),
id_usuario INT NOT NULL,

CONSTRAINT fk_playlist FOREIGN KEY (id_usuario) 
REFERENCES tbl_usuario(id_usuario) ON DELETE CASCADE
);

CREATE TABLE tbl_etiqueta(
id_etiqueta INT AUTO_INCREMENT PRIMARY KEY,
nombre_etiq VARCHAR (50)NOT NULL UNIQUE,
descripcion_etiq VARCHAR (120),
id_usuario INT NULL, 

CONSTRAINT fk_etiqueta_usuario FOREIGN KEY (id_usuario)
REFERENCES tbl_usuario (id_usuario) ON DELETE SET NULL
);

CREATE TABLE tbl_cancion(
id_cancion INT AUTO_INCREMENT PRIMARY KEY,
id_album INT NOT NULL,
titulo_can VARCHAR (100) NOT NULL,
duracion_can TIME NOT NULL,
ruta_audio_can VARCHAR (500) NOT NULL,

CONSTRAINT fk_cancion_album FOREIGN KEY (id_album) 
REFERENCES tbl_album(id_album) ON DELETE RESTRICT
);

CREATE TABLE tbl_playlist_etiqueta(
id_playlist INT NOT NULL,
id_etiqueta INT NOT NULL,

PRIMARY KEY (id_playlist,id_etiqueta),
CONSTRAINT fk_playlist_etiq FOREIGN KEY (id_playlist) 
REFERENCES tbl_playlist(id_playlist) ON DELETE CASCADE,

CONSTRAINT fk_etiqueta_play FOREIGN KEY(id_etiqueta) 
REFERENCES tbl_etiqueta(id_etiqueta) ON DELETE CASCADE
);

CREATE TABLE tbl_artista_cancion(
id_artista INT NOT NULL,
id_cancion INT NOT NULL,
PRIMARY KEY (id_artista, id_cancion),
CONSTRAINT fk_artista_can FOREIGN KEY (id_artista)
REFERENCES tbl_artista(id_artista) ON DELETE RESTRICT,
CONSTRAINT fk_cancion_art FOREIGN KEY (id_cancion)
REFERENCES tbl_cancion(id_cancion) ON DELETE CASCADE
);

CREATE TABLE tbl_genero_cancion(
id_genero INT NOT NULL,
id_cancion INT NOT NULL,
PRIMARY KEY (id_genero, id_cancion),
CONSTRAINT fk_genero_can FOREIGN KEY (id_genero)
REFERENCES tbl_genero(id_genero) ON DELETE RESTRICT,
CONSTRAINT fk_cancion_gen FOREIGN KEY (id_cancion)
REFERENCES tbl_cancion(id_cancion) ON DELETE CASCADE
);

CREATE TABLE tbl_playlist_cancion(
id_cancion INT NOT NULL,
id_playlist INT NOT NULL,

PRIMARY KEY(id_playlist, id_cancion),

CONSTRAINT fk_cancion_play FOREIGN KEY (id_cancion)
REFERENCES tbl_cancion(id_cancion)ON DELETE CASCADE,

CONSTRAINT fk_playlist_can FOREIGN KEY (id_playlist) 
REFERENCES tbl_playlist (id_playlist)ON DELETE CASCADE
);

CREATE TABLE tbl_etiqueta_cancion(
id_etiqueta INT NOT NULL,
id_cancion INT NOT NULL,

PRIMARY KEY(id_etiqueta,id_cancion),
CONSTRAINT fk_etiqueta_can FOREIGN KEY (id_etiqueta) 
REFERENCES tbl_etiqueta(id_etiqueta),

CONSTRAINT fk_cancion_etiq FOREIGN KEY (id_cancion) 
REFERENCES tbl_cancion(id_cancion)
); 

CREATE TABLE tbl_biblioteca_usuario(
id_cancion INT NOT NULL,
id_usuario INT NOT NULL,
reaccion_bib TINYINT NULL,

PRIMARY KEY(id_usuario, id_cancion),
CONSTRAINT chk_reaccion CHECK (reaccion_bib IN (-1, 1)),
CONSTRAINT fk_usuario_usu FOREIGN KEY (id_usuario)
REFERENCES tbl_usuario(id_usuario) ON DELETE CASCADE,
CONSTRAINT fk_cancion_bib FOREIGN KEY (id_cancion)
REFERENCES tbl_cancion(id_cancion) ON DELETE CASCADE
);



-- Seed

USE proyectoBD;

-- Insertar generos
INSERT INTO tbl_genero (nombre_gen)
VALUES ('Country'),('Pop'),('Hip hop'),('Bachata'),('Pop Latino'),('Jazz');

-- Insertar artista
INSERT INTO tbl_artista (nombre_art)
VALUES ('Lana del rey'),('Nancy sinatra'),('Doja cat'),('Lady gaga'),('Coolio'),('Aventura');

-- Insertar album
INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 1
VALUES('THE FAME','2008-04-08',4);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista)  -- 2
VALUES('Born to Die','2011-09-05',1);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 3
VALUES('Hot Pink','2019-09-07',3);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 4
VALUES('Boots','1966-04-15',2);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 5
VALUES('Dangerous Minds','1995-11-07',5);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 6
VALUES('We Broke the Rules','2002-08-14',6);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 7
VALUES('FREAK','2020-08-07',3);

INSERT INTO tbl_album(titulo_alb,fecha_lanzamiento_alb ,id_artista) -- 8
VALUES('Grand Theft Auto VI: The Album','2026-11-20',1);

-- Insertar  etiqueta
INSERT INTO tbl_etiqueta (nombre_etiq, descripcion_etiq,id_usuario)
VALUES ('Estudiar', 'Música para concentrarse',NULL),('Gymrata', 'Música para entrenar', NULL),('Chill', 'Música para parcharse', NULL), ('Despecho', 'Lo mas duro del despecho',NULL),('Romantico','Lo mas dulce', NULL);

-- Insertar cancion
INSERT INTO tbl_cancion
    (id_album,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (1,'Just Dance', '00:04:06', 'audio/Lady Gaga - Just Dance (Official Music Video) ft. Colby ODonis.mp3'); -- 1
    
INSERT INTO tbl_cancion
    (id_album,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (5,'Gangstas Paradise','00:04:17', 'audio/Coolio - Gangstas Paradise (feat. L.V.) [Official Music Video].mp3'); -- 2
    
INSERT INTO tbl_cancion
    (id_album,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (2,'Video Games', '00:04:40' , 'audio/[ Lana del Rey ] - Video Games Traducción al español.mp3'); -- 3
    
INSERT INTO tbl_cancion
    ( id_album ,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (4, 'These Boots Are Made For Walkin', '00:02:49' , 'audio/Nancy Sinatra - These Boots Are Made For Walkin (Official Music Video).mp3'); -- 4
    
INSERT INTO tbl_cancion
    (id_album,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (6,'Obsesión','00:04:16', 'audio/Aventura - Obsesión (ft. Judy Santos).mp3'); -- 5
    
INSERT INTO tbl_cancion
    (id_album,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (3 ,'Juicy', '00:03:18', 'audio/Doja Cat, Tyga - Juicy (Official Video).mp3'); -- 6
    
INSERT INTO tbl_cancion
    (id_album, titulo_can, duracion_can, ruta_audio_can)
VALUES
    (7,'Freak', '00:04:46', 'audio/Doja Cat - Freak (Audio).mp3'); -- 7
    
    INSERT INTO tbl_cancion
    (id_album,titulo_can, duracion_can, ruta_audio_can)
VALUES
    (8,'Crazy For You', '00:03:42', 'audio/Crazy For You.mp3'); -- 8
    
-- INSERT INTO tbl_artista_cancion VALUES (1, 1), (2, 1);

-- Generos 
INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (2, 1);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (3, 2);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (1, 3), (2,3);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (1, 4);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (4, 5),(5, 5);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (3, 6),(2,6);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (3, 7),(2,7);

INSERT INTO tbl_genero_cancion (id_genero, id_cancion)
VALUES (2, 8),(1,8);

-- Insertar  etiquetas para una cancion
INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (2, 1);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (2, 2);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (3, 2);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (3, 3);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (5, 3);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (3, 4);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (4, 5);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (2, 6);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (3, 6);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (3, 7);

INSERT INTO tbl_etiqueta_cancion (id_etiqueta, id_cancion)
VALUES (5, 8);

-- Usuario de prueba
INSERT INTO tbl_usuario (nombre_usu, correo_usu, contrasena_usu)
VALUES ('prueba', 'prueba@correo.com', 'relleno');

INSERT INTO tbl_playlist (titulo_play, id_usuario) VALUES ('Playlist de prueba', 1);
INSERT INTO tbl_playlist_cancion (id_playlist, id_cancion) VALUES (1, 1);
INSERT INTO tbl_biblioteca_usuario (id_usuario, id_cancion, reaccion_bib) VALUES (1, 2, 1);

-- Consulta

SELECT c.titulo_can, al.titulo_alb, a.nombre_art, g.nombre_gen
FROM tbl_cancion c
JOIN tbl_album al ON al.id_album = c.id_album
JOIN tbl_artista a ON a.id_artista = al.id_artista
JOIN tbl_genero_cancion gc ON gc.id_cancion = c.id_cancion
JOIN tbl_genero g ON g.id_genero = gc.id_genero
ORDER BY c.id_cancion;

-- Pruebas
DELETE FROM tbl_artista WHERE id_artista = 5;
DELETE FROM tbl_genero WHERE id_genero = 1;
DELETE FROM tbl_genero WHERE nombre_gen = 'Jazz';
INSERT INTO tbl_biblioteca_usuario VALUES (3, 1, 5);
DELETE FROM tbl_usuario WHERE id_usuario = 1;

SELECT * FROM tbl_playlist;
SELECT * FROM tbl_playlist_cancion;
SELECT * FROM tbl_biblioteca_usuario;

