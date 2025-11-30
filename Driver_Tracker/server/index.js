const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

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
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/vans', require('./routes/vans'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/driver-profiles', require('./routes/driverProfiles'));
app.use('/api/assignments', require('./routes/assignments'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
