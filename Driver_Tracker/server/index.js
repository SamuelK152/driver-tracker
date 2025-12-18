const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/vans', require('./routes/vans'));
app.use('/api/phones', require('./routes/phones'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/routes', require('./routes/dailyRoutes'));
app.use('/api/metrics', require('./routes/metrics'));
app.use('/api/service-types', require('./routes/serviceTypes'));
app.use('/api/preferences', require('./routes/preferences'));
app.use('/api/config', require('./routes/config'));

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
