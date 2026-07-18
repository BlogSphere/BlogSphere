# Feature Implementation Plan: Reading Lists / Curated Collections

## 📋 Executive Summary

**Feature**: Allow users to create, curate, and share collections of blog posts (e.g., "React Learning Path", "AI Papers 2024", "My Favorite Tutorials").

**Impact**: High engagement driver - increases session time, return visits, and social sharing. Authors get notified when added to collections.

**Effort**: Medium (2-3 weeks for full implementation)

**Dependencies**: Existing Blog, User, Notification models. No new external services required.

---

## 🎯 Feature Requirements

### Core User Stories
1. **As a reader**, I want to create private/public reading lists so I can organize articles for later reference
2. **As a curator**, I want to share public collections with descriptions and custom ordering so others can discover curated content
3. **As an author**, I want to be notified when my article is added to a collection so I can engage with curators
4. **As a visitor**, I want to browse popular collections and follow them for updates

### Functional Requirements
| Requirement | Priority |
|-------------|----------|
| Create/edit/delete collections (title, description, cover image, privacy) | P0 |
| Add/remove/reorder blogs in collection (drag-drop) | P0 |
| Public/Private/Unlisted visibility | P0 |
| Follow/unfollow collections | P0 |
| Author notification when added to collection | P0 |
| Collection discovery page (trending, recent, by category) | P1 |
| Collection SEO (slug, meta tags, OG cards) | P1 |
| Share collection (copy link, social buttons) | P1 |
| Bulk add from search/bookmarks | P2 |
| Collaborative collections (multiple curators) | P2 |
| Export collection (PDF, Markdown, OPML) | P3 |

### Non-Functional
- Real-time updates via Socket.io when followed collections change
- Optimistic UI for add/remove/reorder
- Paginated/infinite scroll for collection feeds
- Responsive design matching existing glassmorphic UI

---

## 🗄️ Database Schema Changes

### New Model: `Collection.js`
```javascript
// src/server/models/Collection.js
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
```

### Updates to Existing Models

**User.js** - Add collections reference:
```javascript
// Add to UserSchema
collections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
followedCollections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
```

**Blog.js** - Add reverse reference (virtual):
```javascript
// Add to BlogSchema (virtual, no DB storage)
BlogSchema.virtual('collections', {
  ref: 'Collection',
  localField: '_id',
  foreignField: 'items.blog',
  justOne: false
});
```

**Notification.js** - Add new type:
```javascript
// In NotificationSchema, add to type enum:
type: { 
  enum: [..., 'collection_added', 'collection_followed', 'collection_shared'],
  ...
}
```

---

## 🔌 Backend API Routes

### File: `src/server/routes/collection.ts`
```typescript
import express from 'express';
import {
  createCollection,
  getCollections,
  getCollectionBySlug,
  updateCollection,
  deleteCollection,
  addBlogToCollection,
  removeBlogFromCollection,
  reorderCollectionItems,
  followCollection,
  unfollowCollection,
  getUserCollections,
  getCollectionFollowers,
  getCollectionsContainingBlog,
  searchCollections,
  getTrendingCollections
} from '../controllers/collectionController';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Public/Optional Auth
router.get('/', optionalAuth, getCollections);
router.get('/trending', optionalAuth, getTrendingCollections);
router.get('/search', optionalAuth, searchCollections);
router.get('/blog/:blogId', optionalAuth, getCollectionsContainingBlog);
router.get('/:slug', optionalAuth, getCollectionBySlug);
router.get('/:slug/followers', optionalAuth, getCollectionFollowers);

// Auth Required
router.post('/', auth, createCollection);
router.get('/user/me', auth, getUserCollections);
router.put('/:id', auth, updateCollection);
router.delete('/:id', auth, deleteCollection);
router.post('/:id/items', auth, addBlogToCollection);
router.delete('/:id/items/:blogId', auth, removeBlogFromCollection);
router.put('/:id/reorder', auth, reorderCollectionItems);
router.post('/:id/follow', auth, followCollection);
router.delete('/:id/follow', auth, unfollowCollection);

export default router;
```

### Controller: `src/server/controllers/collectionController.js`
Key implementations needed:

| Method | Description | Key Logic |
|--------|-------------|-----------|
| `createCollection` | Create new collection | Validate, generate slug, emit socket event |
| `getCollections` | Paginated list with filters | Filter by visibility, curator, tags, category |
| `getCollectionBySlug` | Single collection view | Increment views, populate blogs, check follow status |
| `addBlogToCollection` | Add blog (prevent duplicates) | Push to items[], notify author, update blog collections virtual |
| `reorderCollectionItems` | Drag-drop reorder | Bulk update order fields |
| `followCollection` | Toggle follow | Add/remove from followers[], notify curator |
| `getTrendingCollections` | Algorithm-based | Score = followers×0.4 + views×0.3 + items×0.2 + recency×0.1 |

---

## 🔌 Real-time Events (Socket.io)

### File: `src/server/services/collectionSocket.js` (new)
```javascript
// Events to emit from controllers:
socket.emit('collection:updated', { collectionId, itemsCount, updatedAt });
socket.emit('collection:item_added', { collectionId, blogId, item });
socket.emit('collection:item_removed', { collectionId, blogId });
socket.emit('collection:reordered', { collectionId, items });
socket.emit('collection:followed', { collectionId, followerId, followersCount });
socket.emit('collection:new_public', { collection }); // Broadcast to all for discovery

// Client listens in collection pages for live updates
```

---

## 🎨 Frontend Components

### New Pages
```
src/client/pages/
├── Collections.jsx           # Discovery page (trending, search, categories)
├── CollectionDetail.jsx      # Single collection view (/collection/:slug)
├── CollectionEditor.jsx      # Create/edit collection (/collection/new, /collection/:id/edit)
└── MyCollections.jsx         # User's collections (/dashboard/collections)
```

### New Components
```
src/client/components/collections/
├── CollectionCard.jsx        # Grid card for discovery
├── CollectionList.jsx        # List view for dashboard
├── CollectionItemRow.jsx     # Draggable row in editor
├── CollectionFollowBtn.jsx   # Follow/unfollow button
├── CollectionShareBtn.jsx    # Share dropdown
├── CollectionVisibilityBadge.jsx
├── AddToCollectionModal.jsx  # Modal to add blog to collections
└── CollectionSEO.jsx         # Meta tags component
```

### Updated Components
- `BlogCard.jsx` → Add "Add to Collection" menu item
- `BlogDetail.jsx` → Show "Part of X collections" + add button
- `Navbar.jsx` → Link to Collections discovery
- `Sidebar.jsx` → "My Collections" link for authenticated users

---

## 🔄 State Management (Redux)

### New Slice: `src/client/redux/collectionSlice.ts`
```typescript
interface CollectionState {
  // Discovery
  collections: Collection[];
  trendingCollections: Collection[];
  searchResults: Collection[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; hasMore: boolean };
  
  // Single collection
  currentCollection: Collection | null;
  currentCollectionLoading: boolean;
  
  // User collections
  myCollections: Collection[];
  followedCollections: Collection[];
  
  // UI
  addToCollectionModal: { open: boolean; blogId: string | null };
}

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    setCollections,
    appendCollections,
    setCurrentCollection,
    updateCollectionInList,
    removeCollectionFromList,
    addItemToCollection,
    removeItemFromCollection,
    reorderCollectionItems,
    toggleFollowCollection,
    setAddToCollectionModal,
  },
  extraReducers: (builder) => {
    // Async thunks for all API calls
  }
});
```

### Async Thunks
- `fetchCollections(params)`
- `fetchTrendingCollections()`
- `fetchCollectionBySlug(slug)`
- `createCollection(data)`
- `updateCollection(id, data)`
- `deleteCollection(id)`
- `addBlogToCollection(collectionId, blogId, note)`
- `removeBlogFromCollection(collectionId, blogId)`
- `reorderCollectionItems(collectionId, items)`
- `followCollection(id)`
- `unfollowCollection(id)`
- `searchCollections(query, filters)`

---

## 🎯 Integration Points

### 1. BlogDetail.jsx - "Add to Collection" Button
```jsx
// In BlogDetail toolbar area
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm">
      <BookmarkPlus className="w-4 h-4 mr-1" />
      Save to Collection
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    {myCollections.map(c => (
      <DropdownMenuItem 
        key={c._id} 
        onClick={() => dispatch(addBlogToCollection({ collectionId: c._id, blogId: blog._id }))}
      >
        {c.title} ({c.itemsCount})
      </DropdownMenuItem>
    ))}
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => setAddToCollectionModal({ open: true, blogId: blog._id })}>
      + Create New Collection
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 2. BlogCard.jsx - Quick Add
```jsx
// Hover overlay or context menu
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
      <BookmarkPlus className="w-4 h-4" />
    </Button>
  </DropdownMenuTrigger>
  ...
</DropdownMenu>
```

### 3. Dashboard.jsx - New Tab
```jsx
// Add to dashboard tabs
<TabsTrigger value="collections">My Collections</TabsTrigger>
<TabsContent value="collections">
  <MyCollectionsList collections={myCollections} />
</TabsContent>
```

### 4. Navbar.jsx - Collections Link
```jsx
<Link to="/collections" className="...">Collections</Link>
```

---

## 📱 UI/UX Design Specs

### Collection Card (Discovery Grid)
```
┌─────────────────────────────────────┐
│  [Cover Image 16:9]                 │
│  ┌─────────┐  👁 1.2k  ♡ 42  👥 128 │
│  │  PRIV   │  🏷️ React, TypeScript   │
│  └─────────┘                          │
│  "Mastering React Server Components"  │
│  A curated path from basics to...     │
│  ┌─────────────────────────────────┐  │
│  │  by @johndoe  •  12 articles    │  │
│  │  [Follow]  [Share]  [•••]       │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Collection Editor (Drag-Drop)
- Left: Searchable blog picker (my blogs, bookmarks, recent reads)
- Right: Droppable list with drag handles, order numbers, per-item notes
- Top bar: Title, description, cover upload, visibility selector, save/publish

### Collection Detail Page
- Hero: Cover, title, description, stats, follow button, share
- Tabs: Articles (grid/list), About (curator info, tags), Followers
- Sticky "Follow" CTA on scroll

---

## 🧪 Testing Strategy

### Unit Tests
- Collection model validation (slug generation, count updates)
- Controller methods (auth checks, visibility filters)
- Redux slice reducers

### Integration Tests
- Full CRUD flow via API
- Follow/unfollow notifications
- Add/remove blog triggers author notification
- Visibility enforcement (private/unlisted/public)

### E2E Tests (Playwright)
1. Create collection → add blogs → publish → verify public view
2. Follow collection → new item added → real-time update
3. Author receives notification when added to collection
4. Drag-drop reorder persists after refresh

---

## 📦 Implementation Phases

### Phase 1: Backend Core (Week 1)
- [ ] Create `Collection` model with indexes
- [ ] Update `User` model (collections, followedCollections)
- [ ] Implement all controller methods
- [ ] Create REST routes with auth middleware
- [ ] Add Socket.io events for real-time
- [ ] Write unit/integration tests

### Phase 2: Frontend Discovery (Week 1-2)
- [ ] `Collections.jsx` discovery page (grid, filters, pagination)
- [ ] `CollectionCard.jsx` component
- [ ] `CollectionDetail.jsx` with tabs
- [ ] Redux slice + thunks
- [ ] SEO meta tags for collection pages

### Phase 3: Collection Editor (Week 2)
- [ ] `CollectionEditor.jsx` (create/edit)
- [ ] Drag-drop with `@dnd-kit` or native HTML5 DnD
- [ ] Blog search picker (debounced API search)
- [ ] Cover image upload (base64 or S3)
- [ ] Visibility selector with explanations

### Phase 4: Integrations & Polish (Week 2-3)
- [ ] "Add to Collection" in BlogCard, BlogDetail
- [ ] Dashboard "My Collections" tab
- [ ] Navbar link + Sidebar link
- [ ] Follow button with real-time count
- [ ] Author notification on add
- [ ] Share modal (copy link, Twitter, LinkedIn, embed code)
- [ ] Empty states, loading skeletons, error boundaries

### Phase 5: Advanced (Post-Launch)
- [ ] Collaborative collections (invite curators)
- [ ] Collection analytics (views, click-through per item)
- [ ] Export (PDF, Markdown, OPML)
- [ ] Bulk import from OPML/JSON
- [ ] Collection recommendations ("Similar collections")

---

## 🔧 Configuration & Env

### No new env vars needed (uses existing MongoDB, Socket.io)

### Tailwind Config Additions
```javascript
// tailwind.config.js - add if not present
animation: {
  'drag-enter': 'drag-enter 0.2s ease-out',
  'drag-leave': 'drag-leave 0.2s ease-in',
}
```

---

## 📊 Success Metrics

| Metric | Target (3 months) |
|--------|-------------------|
| Collections created | > 500 |
| Avg items per collection | > 5 |
| Collection follow rate | > 15% of viewers |
| Author notification open rate | > 40% |
| Return visits via collections | +20% |

---

## ❓ Open Questions for Decision

1. **Cover Images**: Base64 in DB (simpler) vs Upload to S3/Cloudinary (performance)?
   - *Recommendation*: Base64 for MVP, migrate to object storage later

2. **Collaborative Editing**: Allow multiple curators from launch or v2?
   - *Recommendation*: v2 - adds complexity to permissions

3. **Collection Comments**: Enable discussion on collections?
   - *Recommendation*: Yes, reuse existing Comment model with `collectionId`

4. **Algorithm for Trending**: Simple weighted score or ML-based?
   - *Recommendation*: Weighted formula (see controller spec), iterate later

5. **Private Collection Sharing**: Allow "unlisted" link sharing?
   - *Recommendation*: Yes, `visibility: 'unlisted'` - accessible via slug only

---

## 📁 File Creation Checklist

### Backend (7 new files)
- [ ] `src/server/models/Collection.js`
- [ ] `src/server/controllers/collectionController.js`
- [ ] `src/server/routes/collection.ts`
- [ ] `src/server/services/collectionSocket.js`
- [ ] Update `src/server/models/User.js`
- [ ] Update `src/server/models/Blog.js` (virtual)
- [ ] Update `src/server/index.ts` (register routes)

### Frontend (12+ new files)
- [ ] `src/client/pages/Collections.jsx`
- [ ] `src/client/pages/CollectionDetail.jsx`
- [ ] `src/client/pages/CollectionEditor.jsx`
- [ ] `src/client/pages/MyCollections.jsx`
- [ ] `src/client/components/collections/CollectionCard.jsx`
- [ ] `src/client/components/collections/CollectionList.jsx`
- [ ] `src/client/components/collections/CollectionItemRow.jsx`
- [ ] `src/client/components/collections/CollectionFollowBtn.jsx`
- [ ] `src/client/components/collections/CollectionShareBtn.jsx`
- [ ] `src/client/components/collections/CollectionVisibilityBadge.jsx`
- [ ] `src/client/components/collections/AddToCollectionModal.jsx`
- [ ] `src/client/components/collections/CollectionSEO.jsx`
- [ ] `src/client/redux/collectionSlice.ts`
- [ ] Update `src/client/redux/store.ts` (add reducer)
- [ ] Update `src/client/App.tsx` (routes)
- [ ] Update `src/client/components/Navbar.jsx`
- [ ] Update `src/client/components/Sidebar.jsx`
- [ ] Update `src/client/pages/BlogDetail.jsx`
- [ ] Update `src/client/components/BlogCard.jsx`
- [ ] Update `src/client/pages/Dashboard.jsx`

---

## 🚀 Quick Start Commands

```bash
# 1. Create model
touch src/server/models/Collection.js

# 2. Create controller
touch src/server/controllers/collectionController.js

# 3. Create routes
touch src/server/routes/collection.ts

# 4. Create frontend pages
mkdir -p src/client/pages/collections
touch src/client/pages/Collections.jsx
touch src/client/pages/CollectionDetail.jsx
touch src/client/pages/CollectionEditor.jsx
touch src/client/pages/MyCollections.jsx

# 5. Create components
mkdir -p src/client/components/collections
touch src/client/components/collections/CollectionCard.jsx
# ... etc

# 6. Create Redux slice
touch src/client/redux/collectionSlice.ts
```

---

## 📝 Notes for Implementation

1. **Reuse existing patterns**: Follow `Community` model/controller structure for consistency
2. **Socket.io namespace**: Consider `/collections` namespace for isolation
3. **Pagination**: Use cursor-based for infinite scroll on collection detail
4. **Optimistic Updates**: Critical for drag-drop and follow buttons
5. **Accessibility**: Proper ARIA for drag-drop, focus management in modals
6. **Performance**: Virtualize long collection lists (>50 items)

---

*Plan Version: 1.0*  
*Created: 2025*  
*Estimated Effort: 80-120 hours*