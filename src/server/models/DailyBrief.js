import mongoose from 'mongoose';

const DailyBriefSchema = new mongoose.Schema({
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
    unique: true
  },
  blogsCount: {
    type: Number,
    required: true,
    default: 0
  },
  summary: {
    type: String,
    default: ''
  },
  keyThemes: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const DailyBrief = mongoose.model('DailyBrief', DailyBriefSchema);
export default DailyBrief;
