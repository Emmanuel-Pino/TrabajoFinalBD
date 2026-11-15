# 🎵 SoundCircle

Red social musical que integra **MySQL** (modelo relacional) y **MongoDB** (modelo NoSQL) en una sola aplicación. Los usuarios crean playlists, gestionan sus canciones y reciben recomendaciones de foros afines a sus gustos musicales.

> Proyecto final de la asignatura **Bases de Datos II**
> Institución Universitaria Pascual Bravo · Docente: Maira Liseth Pérez Díaz · Semestre 2026-2

---

## 👥 Integrantes

| Nombre | Rol principal | GitHub |
|---|---|---|
| _Integrante 1_ | MySQL y modelo entidad-relación | @usuario1 |
| _Integrante 2_ | MongoDB y colecciones | @usuario2 |
| _Integrante 3_ | Interfaz e integración | @usuario3 |

> Todos los integrantes deben conocer y poder explicar todo el sistema en la sustentación.

---

## 📌 Descripción del problema

Quienes escuchan música suelen tener sus playlists en una plataforma y sus conversaciones en otra, y les cuesta encontrar comunidades afines a sus gustos. SoundCircle unifica ambas cosas: permite organizar la música en playlists y participar en foros donde otros usuarios publican canciones similares a lo que cada persona escucha.

## 🎯 Objetivo general

Diseñar e implementar un sistema de información que integre un modelo de base de datos relacional (MySQL) y uno no relacional (MongoDB), aplicando conceptos de almacenamiento, estructuración, relaciones y consultas para resolver la necesidad de gestionar música y comunidades de usuarios.

## ⚙️ Funcionalidades principales

1. **Registro e inicio de sesión** de usuarios.
2. **Gestión de playlists:** crear, editar y eliminar playlists; añadir y quitar canciones; mover canciones entre playlists.
3. **Reproducción de canciones** (enlace externo o reproducción simulada con registro del evento).
4. **Foros:** crear foros, publicar canciones o temas, comentar y dar "me gusta".
5. **Recomendación de foros** según los géneros más frecuentes en las playlists del usuario.

---

## 🗄️ Distribución de la información

### MySQL (datos estructurados y relaciones fuertes)

| Tabla | Descripción |
|---|---|
| `usuario` | Datos de cuenta del usuario |
| `artista` | Artistas musicales |
| `genero` | Géneros musicales |
| `cancion` | Canciones, con FK a `artista` y `genero` |
| `playlist` | Playlists, con FK a `usuario` |
| `playlist_cancion` | Tabla intermedia (relación N:M entre playlists y canciones) |

**Por qué MySQL:** la información de usuarios, canciones y playlists es estructurada, tiene relaciones claras (uno a muchos y muchos a muchos) y requiere integridad referencial.

### MongoDB (datos flexibles y anidados)

| Colección | Descripción |
|---|---|
| `foros` | Nombre, descripción, géneros (arreglo), creador, miembros |
| `publicaciones` | Publicaciones de un foro, con comentarios y likes embebidos |

Ejemplo de documento en `publicaciones`:

```json
{
  "id_foro": "ObjectId(...)",
  "id_usuario": 12,
  "id_cancion": 345,
  "titulo": "Esta canción me recordó a Arctic Monkeys",
  "contenido": "Escúchenla, no se arrepentirán",
  "tags": ["indie", "rock"],
  "likes": [7, 15, 22],
  "comentarios": [
    { "id_usuario": 7, "texto": "Buenísima", "fecha": "2026-11-12" }
  ],
  "fecha": "2026-11-11"
}
```

**Por qué MongoDB:** los comentarios, likes y etiquetas son datos de tamaño variable que crecen rápido y se consultan junto con la publicación. Embebidos en un solo documento evitan múltiples JOINs y permiten que cada publicación tenga campos distintos sin migrar el esquema.

---

## 🔗 Integración de ambos modelos

Los dos gestores se conectan mediante identificadores (`id_usuario`, `id_cancion`) que las publicaciones de MongoDB guardan como referencia a los registros de MySQL.

**Flujo del recomendador de foros:**

1. **MySQL** calcula los géneros favoritos del usuario a partir de sus playlists:
   ```sql
   SELECT g.nombre, COUNT(*) AS total
   FROM playlist p
   JOIN playlist_cancion pc ON pc.id_playlist = p.id
   JOIN cancion c ON c.id = pc.id_cancion
   JOIN genero g ON g.id = c.id_genero
   WHERE p.id_usuario = %s
   GROUP BY g.nombre
   ORDER BY total DESC
   LIMIT 3;
   ```
2. **MongoDB** busca los foros afines a esos géneros:
   ```python
   foros.find({"generos": {"$in": generos_top}})
   ```
3. La aplicación une ambos resultados y muestra los foros recomendados.

> Al no existir llaves foráneas entre gestores, la aplicación valida que los `id_usuario` e `id_cancion` existan en MySQL antes de insertarlos en MongoDB.

---

## 🧰 Tecnologías

- **Lenguaje:** Python 3.10+
- **Relacional:** MySQL 8
- **NoSQL:** MongoDB (local o Atlas)
- **Librerías:** `mysql-connector-python`, `pymongo`, `python-dotenv`, `streamlit`
- **Herramientas:** MySQL Workbench, MongoDB Compass, Git y GitHub

---

## 📁 Estructura del repositorio

```
soundcircle/
├── README.md
├── requirements.txt
├── .gitignore
├── .env.example          # plantilla de credenciales (sin datos reales)
├── docs/                 # planteamiento, modelo ER, estructura de Mongo
├── mysql/
│   ├── schema.sql        # creación de tablas
│   └── seed.sql          # datos de ejemplo
├── mongo/
│   └── seed.js           # colecciones y documentos de ejemplo
├── app/
│   ├── main.py           # interfaz de usuario
│   ├── db_mysql.py       # conexión y consultas MySQL
│   ├── db_mongo.py       # conexión y consultas MongoDB
│   └── recomendador.py   # integración de ambos modelos
└── evidencias/           # capturas de CRUD y consultas
```

---

## 🚀 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/soundcircle.git
cd soundcircle
```

### 2. Crear el entorno virtual e instalar dependencias

```bash
python -m venv venv

# Windows
venv\Scripts\activate
# Mac / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar las credenciales

Copia la plantilla y completa con tus datos:

```bash
cp .env.example .env
```

Contenido de `.env`:

```
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=tu_contraseña
MYSQL_DATABASE=soundcircle
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=soundcircle
```

> ⚠️ El archivo `.env` **nunca** se sube al repositorio.

### 4. Crear las bases de datos

**MySQL:**
```bash
mysql -u root -p < mysql/schema.sql
mysql -u root -p soundcircle < mysql/seed.sql
```

**MongoDB:**
```bash
mongosh < mongo/seed.js
```

### 5. Ejecutar la aplicación

```bash
streamlit run app/main.py
```

---

## 🌿 Flujo de trabajo en Git

- `main`: solo contiene código que funciona.
- Cada integrante trabaja en su propia rama (`mysql-nombre`, `mongo-nombre`, `app-nombre`).
- Los cambios llegan a `main` mediante **Pull Request**, revisado por otro integrante.

**Rutina diaria:**

```bash
git checkout main && git pull origin main     # traer cambios
git checkout mi-rama && git merge main        # actualizar mi rama
# ... trabajar ...
git add .
git commit -m "feat: descripción clara del cambio"
git push origin mi-rama
```

**Prefijos de commit:** `feat:` funcionalidad nueva · `fix:` corrección · `docs:` documentación · `db:` cambios de esquema o datos.

---

## ✅ Estado del proyecto

- [ ] Planteamiento entregado (10 nov)
- [ ] Modelo entidad-relación
- [ ] `schema.sql` y `seed.sql` (MySQL)
- [ ] Colecciones y `seed.js` (MongoDB)
- [ ] CRUD completo en MySQL
- [ ] CRUD completo en MongoDB
- [ ] Interfaz con formularios y visualización
- [ ] Conexión funcional con ambos gestores
- [ ] Recomendador de foros
- [ ] Documento de análisis y diseño
- [ ] Evidencias (capturas de CRUD y consultas)
- [ ] Sustentación (24 y 26 nov)

---

## 📅 Fechas clave

| Fecha | Evento |
|---|---|
| 10 de noviembre de 2026 | Entrega del planteamiento |
| 24 y 26 de noviembre de 2026 | Sustentación final y demostración funcional |

---

## 📚 Diferencias relacional vs. NoSQL (para la sustentación)

| Aspecto | MySQL (relacional) | MongoDB (NoSQL) |
|---|---|---|
| Estructura | Tablas con esquema fijo | Documentos JSON con esquema flexible |
| Relaciones | Llaves foráneas y JOINs | Referencias o documentos embebidos |
| Integridad | Fuerte (restricciones, transacciones ACID) | Más flexible, validada desde la aplicación |
| Ideal para | Datos estructurados y muy relacionados | Datos anidados, variables y de rápido crecimiento |
| En SoundCircle | Usuarios, canciones y playlists | Foros, publicaciones y comentarios |
