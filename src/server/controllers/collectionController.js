import Collection from '../models/Collection.js';
import User from '../models/User.js';
import Blog from '../models/Blog.js';
import Notification from '../models/Notification.js';
import { 
  emitCollectionUpdated, 
  emitCollectionItemAdded, 
  emitCollectionItemRemoved, 
  emitCollectionReordered, 
  emitCollectionFollowed, 
  emitCollectionNewPublic 
} from '../services/collectionSocket.js';

// Create a new collection
export const createCollection = async (req, res) => {
  try {
    const { title, description, coverImage, visibility, tags, category, metaTitle, metaDescription } = req.body;
    const userId = req.user._id;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Collection title is required.' });
    }

    const cleanTags = (tags || []).map(t => t.trim().toLowerCase()).filter(Boolean);

    const collection = new Collection({
      title: title.trim(),
      description: description || '',
      coverImage: coverImage || '',
      curator: userId,
      visibility: visibility || 'private',
      tags: cleanTags,
      category: category || '',
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || ''
    });

    await collection.save();

    // Link to curator
    await User.findByIdAndUpdate(userId, { $push: { collections: collection._id } });

    if (collection.visibility === 'public') {
      emitCollectionNewPublic(collection);
    }

    res.status(201).json({ message: 'Collection created successfully', collection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all collections (paginated, with visibility checks)
export const getCollections = async (req, res) => {
  try {
    const { curator, category, tag, search, visibility = 'public', limit = 10, offset = 0 } = req.query;
    
    const query = {};

    // Enforce visibility guards
    if (visibility === 'private' || visibility === 'unlisted') {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required for non-public visibilities.' });
      }
      query.visibility = visibility;
      query.curator = req.user._id;
    } else {
      query.visibility = 'public';
    }

    if (curator) query.curator = curator;
    if (category) query.category = category;
    if (tag) query.tags = tag.toLowerCase().trim();
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const collections = await Collection.find(query)
      .populate('curator', 'name username profileImage')
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Number(limit))
      .lean();

    const total = await Collection.countDocuments(query);

    res.status(200).json({ collections, total, hasMore: total > Number(offset) + collections.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single collection by slug
export const getCollectionBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userId = req.user ? req.user._id : null;

    const collection = await Collection.findOne({ slug })
      .populate('curator', 'name username profileImage bio')
      .populate('collaborators', 'name username profileImage');

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check permissions
    if (collection.visibility === 'private' && (!userId || collection.curator._id.toString() !== userId.toString())) {
      return res.status(403).json({ error: 'This collection is private.' });
    }

    // Populate blogs (nested items)
    const populatedCollection = await Collection.populate(collection, [
      { 
        path: 'items.blog', 
        select: 'title slug coverImage category tags views likes author collaborators status',
        populate: [
          { path: 'author', select: 'name username profileImage isVerified badge' },
          { path: 'collaborators', select: 'name profileImage' }
        ]
      }
    ]);

    // Filter out unpublished or deleted items for general visitors
    const isOwner = userId && collection.curator._id.toString() === userId.toString();
    if (!isOwner) {
      populatedCollection.items = populatedCollection.items.filter(item => item.blog && item.blog.status === 'published');
    }

    // Increment view count
    collection.viewsCount += 1;
    await collection.save();

    emitCollectionUpdated(collection._id, { viewsCount: collection.viewsCount });

    const isFollowing = userId ? collection.followers.some(f => f.toString() === userId.toString()) : false;

    res.status(200).json({ collection: populatedCollection, isFollowing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update collection details
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, coverImage, visibility, tags, category, metaTitle, metaDescription } = req.body;
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check authority
    const isCurator = collection.curator.toString() === userId.toString();
    const isCollaborator = collection.collaborators.some(c => c.toString() === userId.toString());
    if (!isCurator && !isCollaborator) {
      return res.status(403).json({ error: 'You are not authorized to update this collection.' });
    }

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ error: 'Title cannot be empty.' });
      collection.title = title.trim();
    }
    if (description !== undefined) collection.description = description;
    if (coverImage !== undefined) collection.coverImage = coverImage;
    if (visibility !== undefined) collection.visibility = visibility;
    if (tags !== undefined) collection.tags = tags.map(t => t.trim().toLowerCase()).filter(Boolean);
    if (category !== undefined) collection.category = category;
    if (metaTitle !== undefined) collection.metaTitle = metaTitle;
    if (metaDescription !== undefined) collection.metaDescription = metaDescription;

    await collection.save();

    emitCollectionUpdated(collection._id, { 
      title: collection.title, 
      description: collection.description, 
      coverImage: collection.coverImage,
      visibility: collection.visibility,
      tags: collection.tags,
      category: collection.category,
      updatedAt: collection.updatedAt
    });

    res.status(200).json({ message: 'Collection updated successfully', collection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete collection
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Only curator can delete
    if (collection.curator.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Only the creator can delete this collection.' });
    }

    // Remove reference from curator
    await User.findByIdAndUpdate(userId, { $pull: { collections: collection._id } });
    
    // Remove references from followers
    await User.updateMany(
      { _id: { $in: collection.followers } },
      { $pull: { followedCollections: collection._id } }
    );

    await Collection.findByIdAndDelete(id);

    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add blog to collection
export const addBlogToCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { blogId, note } = req.body;
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check authority
    const isCurator = collection.curator.toString() === userId.toString();
    const isCollaborator = collection.collaborators.some(c => c.toString() === userId.toString());
    if (!isCurator && !isCollaborator) {
      return res.status(403).json({ error: 'You are not authorized to edit this collection.' });
    }

    // Prevent duplicates
    const alreadyExists = collection.items.some(item => item.blog.toString() === blogId.toString());
    if (alreadyExists) {
      return res.status(400).json({ error: 'This article is already in the collection.' });
    }

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found.' });
    }

    const newItem = {
      blog: blogId,
      order: collection.items.length,
      note: note || '',
      addedAt: new Date()
    };

    collection.items.push(newItem);
    await collection.save();

    // Socket broadcasts
    emitCollectionItemAdded(collection._id, blogId, newItem);
    emitCollectionUpdated(collection._id, { itemsCount: collection.itemsCount });

    // Notify blog author (if not curator)
    if (blog.author.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: blog.author,
        message: `${req.user.name} added your article "${blog.title}" to their collection "${collection.title}"`,
        type: 'collection_added',
        referenceId: collection._id
      });
      await notification.save();
      if (global.io) {
        global.io.to(`user_${blog.author}`).emit('notification_received', notification);
      }
    }

    res.status(200).json({ message: 'Blog added successfully', items: collection.items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove blog from collection
export const removeBlogFromCollection = async (req, res) => {
  try {
    const { id, blogId } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check authority
    const isCurator = collection.curator.toString() === userId.toString();
    const isCollaborator = collection.collaborators.some(c => c.toString() === userId.toString());
    if (!isCurator && !isCollaborator) {
      return res.status(403).json({ error: 'You are not authorized to edit this collection.' });
    }

    collection.items = collection.items.filter(item => item.blog.toString() !== blogId.toString());
    
    // Recalculate order fields
    collection.items.forEach((item, idx) => {
      item.order = idx;
    });

    await collection.save();

    emitCollectionItemRemoved(collection._id, blogId);
    emitCollectionUpdated(collection._id, { itemsCount: collection.itemsCount });

    res.status(200).json({ message: 'Blog removed successfully', items: collection.items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reorder collection items
export const reorderCollectionItems = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { blogId, order }
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    // Check authority
    const isCurator = collection.curator.toString() === userId.toString();
    const isCollaborator = collection.collaborators.some(c => c.toString() === userId.toString());
    if (!isCurator && !isCollaborator) {
      return res.status(403).json({ error: 'You are not authorized to edit this collection.' });
    }

    // Apply new ordering
    collection.items.forEach(item => {
      const match = items.find(ordered => ordered.blogId.toString() === item.blog.toString());
      if (match) {
        item.order = match.order;
      }
    });

    // Sort items array by order
    collection.items.sort((a, b) => a.order - b.order);

    await collection.save();

    emitCollectionReordered(collection._id, collection.items);
    emitCollectionUpdated(collection._id, { updatedAt: collection.updatedAt });

    res.status(200).json({ message: 'Reordered items successfully', items: collection.items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Follow collection
export const followCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    if (collection.curator.toString() === userId.toString()) {
      return res.status(400).json({ error: 'You cannot follow your own collection.' });
    }

    const alreadyFollowing = collection.followers.some(f => f.toString() === userId.toString());
    if (alreadyFollowing) {
      return res.status(400).json({ error: 'You are already following this collection.' });
    }

    collection.followers.push(userId);
    await collection.save();

    await User.findByIdAndUpdate(userId, { $push: { followedCollections: collection._id } });

    emitCollectionFollowed(collection._id, userId, collection.followersCount);

    // Notify curator
    const notification = new Notification({
      userId: collection.curator,
      message: `${req.user.name} followed your collection "${collection.title}"`,
      type: 'collection_followed',
      referenceId: collection._id
    });
    await notification.save();
    if (global.io) {
      global.io.to(`user_${collection.curator}`).emit('notification_received', notification);
    }

    res.status(200).json({ message: 'Successfully followed collection', followersCount: collection.followersCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Unfollow collection
export const unfollowCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const index = collection.followers.findIndex(f => f.toString() === userId.toString());
    if (index === -1) {
      return res.status(400).json({ error: 'You are not following this collection.' });
    }

    collection.followers.splice(index, 1);
    await collection.save();

    await User.findByIdAndUpdate(userId, { $pull: { followedCollections: collection._id } });

    emitCollectionFollowed(collection._id, userId, collection.followersCount);

    res.status(200).json({ message: 'Successfully unfollowed collection', followersCount: collection.followersCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get personal collections of the logged-in user
export const getUserCollections = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const myCollections = await Collection.find({ curator: userId })
      .populate('curator', 'name username profileImage')
      .sort({ createdAt: -1 })
      .lean();

    const followedCollections = await Collection.find({ followers: userId })
      .populate('curator', 'name username profileImage')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ myCollections, followedCollections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get list of followers for a collection
export const getCollectionFollowers = async (req, res) => {
  try {
    const { slug } = req.params;
    
    const collection = await Collection.findOne({ slug })
      .populate('followers', 'name username profileImage bio isVerified badge')
      .select('followers title')
      .lean();

    if (!collection) {
      return res.status(404).json({ error: 'Collection not found.' });
    }

    res.status(200).json({ followers: collection.followers, title: collection.title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Find collections containing a specific blog post
export const getCollectionsContainingBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    
    const query = {
      'items.blog': blogId,
      visibility: 'public'
    };

    const collections = await Collection.find(query)
      .populate('curator', 'name username profileImage')
      .select('title slug curator itemsCount viewsCount followersCount')
      .limit(10)
      .lean();

    res.status(200).json({ collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search across public collections
export const searchCollections = async (req, res) => {
  try {
    const { q, category } = req.query;
    const query = { visibility: 'public' };

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [q.toLowerCase().trim()] } }
      ];
    }
    if (category) {
      query.category = category;
    }

    const collections = await Collection.find(query)
      .populate('curator', 'name username profileImage')
      .sort({ followersCount: -1, viewsCount: -1 })
      .limit(30)
      .lean();

    res.status(200).json({ collections });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get trending collections
export const getTrendingCollections = async (req, res) => {
  try {
    // Formula: Score = followers × 0.4 + views × 0.3 + items × 0.2 + recency × 0.1
    const collections = await Collection.find({ visibility: 'public' })
      .populate('curator', 'name username profileImage')
      .limit(50)
      .lean();

    const scored = collections.map(col => {
      const now = Date.now();
      const ageHours = (now - new Date(col.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyScore = ageHours < 24 ? 100 : ageHours < 168 ? 50 : ageHours < 720 ? 25 : 0;
      
      const score = (col.followersCount * 10) * 0.4 + 
                    (col.viewsCount) * 0.3 + 
                    (col.itemsCount * 5) * 0.2 + 
                    recencyScore * 0.1;

      return { ...col, trendScore: score };
    });

    const trending = scored
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, 10);

    res.status(200).json({ collections: trending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get collection details by id
export const getCollectionById = async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await Collection.findById(id)
      .populate('curator', 'name username profileImage')
      .populate('items.blog');
      
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    
    res.status(200).json({ collection });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sync curator notes and ordering
export const syncNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { blogId, note, order }
    const userId = req.user._id;

    const collection = await Collection.findById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    const isCurator = collection.curator.toString() === userId.toString();
    const isCollaborator = collection.collaborators.some(c => c.toString() === userId.toString());
    if (!isCurator && !isCollaborator) {
      return res.status(403).json({ error: 'You are not authorized.' });
    }

    collection.items.forEach(item => {
      const match = items.find(ordered => ordered.blogId.toString() === item.blog.toString());
      if (match) {
        item.note = match.note || '';
        if (match.order !== undefined) {
          item.order = match.order;
        }
      }
    });

    collection.items.sort((a, b) => a.order - b.order);
    await collection.save();

    res.status(200).json({ message: 'Synchronized notes successfully', items: collection.items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
