const cors = require('cors');
const express = require('express');
const path = require('path');

const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const listingRoutes = require('./routes/listingRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { errorHandler } = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

  app.use('/api/admin', adminRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/listings', listingRoutes);
  app.use('/api/stats', statsRoutes);
  app.get('/api/config', (_req, res) => {
    res.json({
      tawkTo: {
        propertyId: process.env.TAWK_TO_PROPERTY_ID || '',
        widgetId: process.env.TAWK_TO_WIDGET_ID || ''
      }
    });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
