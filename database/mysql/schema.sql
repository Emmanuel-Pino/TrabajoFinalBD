
Create database proyectoBD;
use proyectoBD;

CREATE TABLE tbl_usuario(
id_usuario INT AUTO_INCREMENT PRIMARY KEY,
nombre_usu VARCHAR (50)NOT NULL,
correo_usu VARCHAR (100)NOT NULL UNIQUE,
Contrasena_usu VARCHAR (255)NOT NULL,
fecha_registro_usu DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tbl_playlist(
id_playlist INT AUTO_INCREMENT PRIMARY KEY,
titulo_play VARCHAR (50)NOT NULL,
fecha_creacion_play DATETIME DEFAULT CURRENT_TIMESTAMP,
descripcion_play VARCHAR(120),
id_usuario INT NOT NULL,

CONSTRAINT fk_playlist FOREIGN KEY (id_usuario) 
REFERENCES tbl_usuario(id_usuario)
);

CREATE TABLE tbl_artista(
id_artista INT AUTO_INCREMENT PRIMARY KEY, 
nombre_art VARCHAR (60) NOT NULL
);

CREATE TABLE tbl_genero(
id_genero INT AUTO_INCREMENT PRIMARY KEY,
nombre_gen VARCHAR (50) NOT NULL UNIQUE
);

CREATE TABLE tbl_etiqueta(
id_etiqueta INT AUTO_INCREMENT PRIMARY KEY,
nombre_etiq VARCHAR (50)NOT NULL UNIQUE,
descripcion_etiq VARCHAR (120)
);

CREATE TABLE tbl_playlist_etiqueta(
id_playlist INT NOT NULL,
id_etiqueta INT NOT NULL,

PRIMARY KEY (id_playlist,id_etiqueta),
CONSTRAINT fk_playlist_etiq FOREIGN KEY (id_playlist) 
REFERENCES tbl_playlist(id_playlist),

CONSTRAINT fk_etiqueta_play FOREIGN KEY(id_etiqueta) 
REFERENCES tbl_etiqueta(id_etiqueta)
);

CREATE TABLE tbl_cancion(
id_cancion INT AUTO_INCREMENT PRIMARY KEY,
id_genero INT NOT NULL,
id_artista INT NOT NULL,
titulo_can VARCHAR (100) NOT NULL,
fecha_publicacion_can DATE,
duracion_can INT NOT NULL,
ruta_audio_can VARCHAR (500) NOT NULL,

CONSTRAINT fk_genero FOREIGN KEY (id_genero) 
REFERENCES tbl_genero(id_genero),

CONSTRAINT fk_artista FOREIGN KEY (id_artista) 
REFERENCES tbl_artista (id_artista)
);

CREATE TABLE tbl_playlist_cancion(
id_cancion INT NOT NULL,
id_playlist INT NOT NULL,

PRIMARY KEY(id_playlist, id_cancion),

CONSTRAINT fk_cancion_play FOREIGN KEY (id_cancion)
REFERENCES tbl_cancion(id_cancion),

CONSTRAINT fk_playlist_can FOREIGN KEY (id_playlist) 
REFERENCES tbl_playlist (id_playlist)
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
CONSTRAINT fk_bib_usuario FOREIGN KEY (id_usuario)
REFERENCES tbl_usuario(id_usuario) ON DELETE CASCADE,
CONSTRAINT fk_bib_cancion FOREIGN KEY (id_cancion)
REFERENCES tbl_cancion(id_cancion) ON DELETE CASCADE
);

show CREATE TABLE tbl_cancion









