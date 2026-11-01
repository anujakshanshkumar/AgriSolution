const { ObjectId } = require('mongodb');
const { getDatabase } = require('./user-repository');
const AppError = require('../errors/app-error');

function parseId(id) {
  if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id)) throw new AppError(400, 'Invalid analysis identifier.');
  return new ObjectId(id);
}
function publicRecord(record) {
  if (!record) return null;
  return { id: record._id.toHexString(), createdAt: record.createdAt, selectedCrop: record.selectedCrop, result: record.result };
}
function createAnalysisRepository(getDb = getDatabase) {
  let ready;
  async function collection() {
    const database = await getDb();
    const records = database.collection('plantAnalyses');
    if (!ready) ready = records.createIndex({ userId: 1, _id: -1 }).catch((error) => { ready = null; throw error; });
    await ready;
    return records;
  }
  return {
    async save(userId, { selectedCrop, result }) {
      const record = { _id: new ObjectId(), userId, selectedCrop: selectedCrop || null, result, createdAt: new Date() };
      await (await collection()).insertOne(record);
      return publicRecord(record);
    },
    async list(userId, { limit = 20, before } = {}) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw new AppError(400, 'History limit must be an integer between 1 and 50.');
      const query = { userId };
      if (before) query._id = { $lt: parseId(before) };
      const records = await (await collection()).find(query).sort({ _id: -1 }).limit(limit + 1).toArray();
      const more = records.length > limit;
      const analyses = records.slice(0, limit).map(publicRecord);
      return { analyses, nextBefore: more ? analyses.at(-1).id : null };
    },
    async get(userId, id) {
      return publicRecord(await (await collection()).findOne({ _id: parseId(id), userId }));
    },
    async saveCare(userId, id, careGuidance) {
      return publicRecord(await (await collection()).findOneAndUpdate(
        { _id: parseId(id), userId }, { $set: { 'result.careGuidance': careGuidance } }, { returnDocument: 'after' }
      ));
    },
    async remove(userId, id) {
      const result = await (await collection()).deleteOne({ _id: parseId(id), userId });
      return result.deletedCount === 1;
    },
  };
}

module.exports = { createAnalysisRepository, parseId };
