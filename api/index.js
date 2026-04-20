// Vercel Serverless Function Entry Point
// This proxies requests to the backend Express app

const app = require('../backend/dist/index.js');

module.exports = app;
