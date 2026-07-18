import mongoose from 'mongoose';

const CollectionItemSchema = new mongoose.Schema({
  blog: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  order: { type: Number, default: 0 },
  note: { type: String, default: '', maxlength: 500 },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const CollectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { type: String, required: true, unique: true, lowercase: true, index: true },
  description: { type: String, default: '', maxlength: 2000 },
  coverImage: { type: String, default: '' },
  
  curator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  visibility: { 
    type: String, 
    enum: ['public', 'unlisted', 'private'], 
    default: 'private',
    index: true 
  },
  
  items: [CollectionItemSchema],
  itemsCount: { type: Number, default: 0 },
  
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followersCount: { type: Number, default: 0 },
  
  tags: [{ type: String, trim: true, lowercase: true }],
  category: { type: String, trim: true },
  
  // SEO
  metaTitle: { type: String, maxlength: 60 },
  metaDescription: { type: String, maxlength: 160 },
  
  // Stats
  viewsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes
CollectionSchema.index({ curator: 1, createdAt: -1 });
CollectionSchema.index({ visibility: 1, createdAt: -1 });
CollectionSchema.index({ followers: 1 });
CollectionSchema.index({ tags: 1 });
CollectionSchema.index({ 'items.blog': 1 });

// Auto-update counts
CollectionSchema.pre('save', function(next) {
  this.itemsCount = this.items.length;
  this.followersCount = this.followers.length;
  this.updatedAt = new Date();
  next();
});

// Generate slug from title
CollectionSchema.pre('validate', async function(next) {
  if (this.isNew || this.isModified('title')) {
    let baseSlug = this.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80);
    
    let slug = baseSlug;
    let counter = 1;
    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    this.slug = slug;
  }
  next();
});

export default mongoose.model('Collection', CollectionSchema);
