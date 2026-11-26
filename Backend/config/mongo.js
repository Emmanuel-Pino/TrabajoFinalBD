require("dotenv").config();

const { MongoClient } = require("mongodb");

const cliente = new MongoClient(process.env.MONGO_URI);

let db;

async function conectarMongo() {

    if (db) return db;

    await cliente.connect();

    db = cliente.db(process.env.MONGO_DB);

    await db.command({ ping: 1 });

    console.log("MongoDB conectado correctamente");

    return db;
}

function obtenerMongo() {

    if (!db) {
        throw new Error("MongoDB no está conectado");
    }

    return db;
}

module.exports = {
    conectarMongo,
    obtenerMongo
};