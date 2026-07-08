import mongoose from 'mongoose';

const TranslationSchema = new mongoose.Schema({
  language: {
    type: String,
    enum: ['en', 'hi', 'gu'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  }
}, { _id: false });

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: {
    thumbsUp: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    heart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    clap: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    laugh: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  views: {
    type: Number,
    default: 0
  },
  bounces: {
    type: Number,
    default: 0
  },
  completions: {
    type: Number,
    default: 0
  },
  totalReadTime: {
    type: Number,
    default: 0
  },
  reports: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  summary: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }],
  translations: [TranslationSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Blog = mongoose.model('Blog', BlogSchema);
export default Blog;
