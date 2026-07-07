import mongoose from 'mongoose';

const RestrictedWordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const RestrictedWord = mongoose.model('RestrictedWord', RestrictedWordSchema);
export default RestrictedWord;
