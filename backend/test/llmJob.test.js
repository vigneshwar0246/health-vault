const mongoose = require('mongoose');
const LLMJob = require('../models/LLMJob');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthhub_test');
});

afterAll(async () => {
  await LLMJob.deleteMany({});
  await mongoose.disconnect();
});

test('create and save llm job', async () => {
  const job = new LLMJob({ reportId: new mongoose.Types.ObjectId(), userId: new mongoose.Types.ObjectId() });
  await job.save();
  expect(job.status).toBe('pending');
  await LLMJob.findByIdAndDelete(job._id);
});
