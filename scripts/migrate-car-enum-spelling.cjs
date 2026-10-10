// One-time development-data spelling correction. Dry-run unless --apply is supplied.
// Raw collection updates deliberately preserve counters, timestamps and unrelated fields.
const fs = require('fs');
const path = require('path');
const os = require('os');
const mongoose = require('mongoose');
// Match the API bootstrap's DNS configuration for MongoDB SRV discovery.
require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
async function main() {
 if (process.env.NODE_ENV === 'production') throw new Error('This migration is restricted to the development database.');
 if (!process.env.MONGO_DEV) throw new Error('MONGO_DEV is required.');
 await mongoose.connect(process.env.MONGO_DEV, { serverSelectionTimeoutMS: 15000 });
 try {
  const cars = mongoose.connection.db.collection('cars');
  const filter = { $or: [{ carTransmission: 'AVTOMATIC' }, { carLocation: 'DAEJON' }] };
  const records = await cars.find(filter, { projection: { _id: 1, carTransmission: 1, carLocation: 1 } }).toArray();
  const before = { transmission: records.filter(car => car.carTransmission === 'AVTOMATIC').length,
   location: records.filter(car => car.carLocation === 'DAEJON').length };
  console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run', cars: records.length, before }));
  if (!process.argv.includes('--apply') || !records.length) return;
  const backup = path.join(os.tmpdir(), `anorcar-car-enum-spelling-${Date.now()}.json`);
  fs.writeFileSync(backup, JSON.stringify({ database: mongoose.connection.name, records }, null, 2), { flag: 'wx' });
  console.log('Previous enum values saved to ' + backup);
  const results = await cars.bulkWrite(records.map(car => {
   const old = { _id: car._id }, next = {};
   if (car.carTransmission === 'AVTOMATIC') { old.carTransmission = 'AVTOMATIC'; next.carTransmission = 'AUTOMATIC'; }
   if (car.carLocation === 'DAEJON') { old.carLocation = 'DAEJON'; next.carLocation = 'DAEJEON'; }
   return { updateOne: { filter: old, update: { $set: next } } };
  }), { ordered: true });
  const remaining = await cars.countDocuments(filter);
  console.log(JSON.stringify({ matched: results.matchedCount, modified: results.modifiedCount, remaining }));
  if (remaining) throw new Error('Legacy values remain; rerun the migration before using the corrected enum schema.');
 } finally { await mongoose.disconnect(); }
}
main().catch(error => { console.error(error.name + ' (' + (error.code ?? 'configuration') + '): enum migration failed; verify configuration/connectivity.'); process.exitCode = 1; });
