const app = require('./app');
const { sequelize } = require('./models');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database models
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');
    }

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`
=================================
Server is running on port ${PORT}
Environment: ${process.env.NODE_ENV}
Database: Connected
=================================
      `);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down gracefully...');
      
      // Close server
      server.close(() => {
        console.log('HTTP server closed.');
      });

      // Close database connection
      try {
        await sequelize.close();
        console.log('Database connection closed.');
        process.exit(0);
      } catch (error) {
        console.error('Error closing database connection:', error);
        process.exit(1);
      }
    };

    // Listen for shutdown signals
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
