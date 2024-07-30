const express = require("express");
const app = express();

const { connectToMongoDB, disconnectToMongoDB } = require("./src/mongodb");

app.use(express.json());

app.use((req, res, next) => {
  res.header("Content-Type", "application/json; charset=utf-8");
  next();
});

// Rutas
app.get("/", (req, res) => {
  res.status(200).end("Hola");
});

//Obtener todos los productos

app.get("/api/productos", async (req, res) => {
  const client = await connectToMongoDB();
  if (!client) {
    res.status(500).send("Error client");
    return;
  }

  const db = client.db("test");
  const productos = await db.collection("products").find().toArray();

  await disconnectToMongoDB();

  res.json(productos);
});

//Obtener un solo producto

app.get("/api/productos/:id", async (req, res) => {
  const productoId = parseInt(req.params.id) || 0;

  const client = await connectToMongoDB();
  if (!client) {
    res.status(500).send("Error client");
    return;
  }

  const db = client.db("test");
  const producto = await db
    .collection("products")
    .findOne({ codigo: productoId });

  await disconnectToMongoDB();

  !producto
    ? res.status(404).send("No existe ese producto")
    : res.json(producto);
});

//filtrar productos por nombre

app.get("/api/productos/filtrar/:nombre", async (req, res) => {
  const nombre = req.params.nombre;

  const client = await connectToMongoDB();
  if (!client) {
    res.status(500).send("Error client");
    return;
  }

  const db = client.db("test");
  const productos = await db
    .collection("products")
    .find({ nombre: { $regex: nombre, $options: "i" } })
    .toArray();

  await disconnectToMongoDB();

  res.json(productos);
});

// Crear un nuevo producto

app.post("/api/productos", async (req, res) => {
  const nuevoProducto = req.body;
  nuevoProducto.codigo = parseInt(Math.random() * 1000);

  if (Object.keys(nuevoProducto).length === 0) {
    res.status(422).send("Error en el formato de los datos");
  }
  const client = await connectToMongoDB();
  if (!client) {
    res.status(500).send("Error client");
    return;
  }
  const db = client.db("test");
  const resultado = await db.collection("products").insertOne(nuevoProducto);
  await disconnectToMongoDB();
  res.status(201).json(nuevoProducto);
});
// Actualizar el precio de un producto usando patch

app.patch("/api/productos/:id", async (req, res) => {
  const productoId = parseInt(req.params.id) || 0;
  const nuevoPrecio = req.body.precio;
  console.log(nuevoPrecio);
  console.log(req.params.id);

  if (!req.params.id || !nuevoPrecio) {
    res.status(422).send("Error en el formato de los datos");
    return;
  }

  const client = await connectToMongoDB();
  if (!client) {
    res.status(500).send("Error client");
    return;
  }

  const db = client.db("test");
  const producto = await db
    .collection("products")
    .findOneAndUpdate(
      { codigo: productoId },
      { $set: { precio: nuevoPrecio } },
      { returnOriginal: false }
    );

  await disconnectToMongoDB();
  console.log(producto);

  !producto
    ? res.status(404).send("No existe ese producto")
    : res.json(producto);
});

// Eliminar un producto

app.delete("/api/productos/:id", async (req, res) => {
  const productoId = parseInt(req.params.id) || 0;
  if (!req.params.id) {
    res.status(422).send("Error en el formato de los datos");
    return;
  }

  const client = await connectToMongoDB();
  if (!client) {
    res.status(500).send("Error client");
    return;
  }

  const db = client.db("test");
  const producto = await db
    .collection("products")
    .findOneAndDelete({ codigo: productoId });

  await disconnectToMongoDB();
  !producto
    ? res.status(404).send("No existe ese producto")
    : res.json(producto);
});

//manejar rutas no encontradas

app.use((req, res, next) => {
  res.status(404).send("Ruta no encontrada " + req.url);
});

// Iniciar servidor

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
