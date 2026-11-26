const express = require("express");
const router = express.Router();

const {
    crearPlaylist,
    listarPlaylists,
    actualizarPlaylist,
    eliminarPlaylist,
    agregarCancionPlaylist,
    listarCancionesPlaylist,
    quitarCancionPlaylist
} = require("../controllers/playlists.controller");

router.post("/playlists", crearPlaylist);
router.get("/playlists", listarPlaylists);
router.put("/playlists/:id", actualizarPlaylist);
router.delete("/playlists/:id", eliminarPlaylist);

router.post("/playlists/:id/canciones", agregarCancionPlaylist);
router.get("/playlists/:id/canciones", listarCancionesPlaylist);
router.delete("/playlists/:id/canciones/:idCancion", quitarCancionPlaylist);

module.exports = router;