import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    required: false
  },
  bio: {
    type: String,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['reader', 'author', 'admin'],
    default: 'author'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  reputationPoints: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    default: 'Reader'
  },
  gamification: {
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: {
      current: { type: Number, default: 1 },
      longest: { type: Number, default: 1 },
      lastActiveDate: { type: Date, default: Date.now }
    },
    badges: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      icon: { type: String, default: '🏆' },
      description: { type: String, default: '' },
      category: { type: String, default: 'general' },
      unlockedAt: { type: Date, default: Date.now }
    }],
    stats: {
      articlesPublished: { type: Number, default: 0 },
      articlesRead: { type: Number, default: 0 },
      commentsWritten: { type: Number, default: 0 },
      reactionsGiven: { type: Number, default: 0 },
      voiceTypingUsed: { type: Number, default: 0 }
    }
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedBlogs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  }],
  newsletterSubscribers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  subscribedCategories: [{
    type: String,
    trim: true
  }],
  hiddenTags: [{
    type: String,
    trim: true
  }],
  collections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  followedCollections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection'
  }],
  socialLinks: {
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', UserSchema);
export default User;
