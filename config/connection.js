const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  host: process.env.HOST,
  port: process.env.PG_PORT || 5432,
  user: process.env.USERNAME,
  password: process.env.PASSWORD,
  database: process.env.DATABASE
});

const connectPromise = new Promise((resolve, reject) => {
  client.connect((err) => {
    if (err) {
      console.error('Unable to connect to PostgreSQL: ' + err.message);
      reject(err);
    } else {
      console.log('Successfully connected to PostgreSQL.');
      resolve(client);
    }
  });
});

module.exports = client;
