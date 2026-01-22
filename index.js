'use strict';

// This is the single entry point for the application.
const { startApp } = require('./src/app');

/**
 * Attaching global error handlers is a good practice for Node.js applications.
 * This ensures that any unexpected errors are logged and the process exits gracefully.
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Application specific logging, throwing an error, or other logic here
  process.exit(1);
});

// Start the application
startApp();
