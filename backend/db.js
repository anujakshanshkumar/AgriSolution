const path = require('path');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017';
const databaseName = process.env.MONGO_DB || 'AgriSolution';
const client = new MongoClient(uri);
let databasePromise;
let usersCollectionPromise;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = client.connect().then(() => client.db(databaseName)).catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

async function getUsersCollection() {
  if (!usersCollectionPromise) {
    usersCollectionPromise = getDatabase().then(async (database) => {
      const validator = {
        $jsonSchema: {
          bsonType: 'object',
          required: ['mobile', 'name', 'passwordHash', 'createdAt'],
          properties: {
            mobile: { bsonType: 'string' },
            name: { bsonType: 'string' },
            district: { bsonType: ['string', 'null'] },
            passwordHash: { bsonType: 'string' },
            createdAt: { bsonType: 'date' }
          }
        }
      };

      try {
        await database.createCollection('users', { validator });
      } catch (error) {
        if (error.code !== 48) throw error;
        await database.command({
          collMod: 'users',
          validator,
          validationLevel: 'moderate'
        });
      }

      const collection = database.collection('users');
      await collection.createIndex({ mobile: 1 }, { unique: true });
      return collection;
    }).catch((error) => {
      usersCollectionPromise = null;
      throw error;
    });
  }
  return usersCollectionPromise;
}

module.exports = { getUsersCollection };
