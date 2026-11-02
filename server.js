const express = require('express');

const clienteRoutes = require('./src/modules/cliente/routes/cliente.routes');
const pizzaRoutes = require('./src/modules/pizza/routes/pizza.routes');
const ingredienteRoutes = require('./src/modules/ingrediente/routes/ingrediente.routes');
const pedidoRoutes = require('./src/modules/pedido/routes/pedido.routes');
const pagoRoutes = require('./src/modules/pago/routes/pago.routes');
const recomendacionIARoutes = require('./src/modules/recomendacionIA/routes/recomendacionIA.routes');
const app = express();
require('./src/database/initDatabase');
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/v1/clientes', clienteRoutes);
app.use('/api/v1/pizzas', pizzaRoutes);
app.use('/api/v1/ingredientes', ingredienteRoutes);
app.use('/api/v1/pedidos', pedidoRoutes);
app.use('/api/v1/pagos', pagoRoutes);
app.use('/api/v1/recomendacionesIA', require('./src/modules/recomendacionIA/routes/recomendacionIA.routes'));

app.get('/', (req, res) => {
  res.json({
    message: 'PIZIA API funcionando correctamente'
  });
});

app.listen(PORT, () => {
  console.log(`Servidor PIZIA ejecutándose en el puerto ${PORT}`);
});

module.exports = app;