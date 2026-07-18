import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../utils/api.js';

export interface CollectionItem {
  blog: any;
  order: number;
  note: string;
  addedAt: string;
}

export interface Collection {
  _id: string;
  title: string;
  slug: string;
  description: string;
  coverImage: string;
  curator: any;
  collaborators: any[];
  visibility: 'public' | 'unlisted' | 'private';
  items: CollectionItem[];
  itemsCount: number;
  followers: string[];
  followersCount: number;
  tags: string[];
  category: string;
  metaTitle?: string;
  metaDescription?: string;
  viewsCount: number;
  sharesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface CollectionState {
  collections: Collection[];
  trendingCollections: Collection[];
  searchResults: Collection[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; hasMore: boolean };
  
  currentCollection: Collection | null;
  currentCollectionLoading: boolean;
  
  myCollections: Collection[];
  followedCollections: Collection[];
  
  addToCollectionModal: { open: boolean; blogId: string | null };
}

const initialState: CollectionState = {
  collections: [],
  trendingCollections: [],
  searchResults: [],
  loading: false,
  error: null,
  pagination: { page: 1, hasMore: true },
  
  currentCollection: null,
  currentCollectionLoading: false,
  
  myCollections: [],
  followedCollections: [],
  
  addToCollectionModal: { open: false, blogId: null },
};

// Async Thunks
export const fetchCollections = createAsyncThunk(
  'collection/fetchAll',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/collections', { params });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch collections');
    }
  }
);

export const fetchTrendingCollections = createAsyncThunk(
  'collection/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/collections/trending');
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch trending collections');
    }
  }
);

export const fetchCollectionBySlug = createAsyncThunk(
  'collection/fetchBySlug',
  async (slug: string, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/collections/${slug}`);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch collection detail');
    }
  }
);

export const createCollection = createAsyncThunk(
  'collection/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/collections', data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create collection');
    }
  }
);

export const updateCollection = createAsyncThunk(
  'collection/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/collections/${id}`, data);
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update collection');
    }
  }
);

export const deleteCollection = createAsyncThunk(
  'collection/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/api/collections/${id}`);
      return id;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete collection');
    }
  }
);

export const addBlogToCollection = createAsyncThunk(
  'collection/addBlog',
  async ({ collectionId, blogId, note }: { collectionId: string; blogId: string; note?: string }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/collections/${collectionId}/items`, { blogId, note });
      return { collectionId, items: res.data.items };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to add blog to collection');
    }
  }
);

export const removeBlogFromCollection = createAsyncThunk(
  'collection/removeBlog',
  async ({ collectionId, blogId }: { collectionId: string; blogId: string }, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/api/collections/${collectionId}/items/${blogId}`);
      return { collectionId, items: res.data.items };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to remove blog from collection');
    }
  }
);

export const reorderCollectionItems = createAsyncThunk(
  'collection/reorder',
  async ({ collectionId, items }: { collectionId: string; items: { blogId: string; order: number }[] }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/collections/${collectionId}/reorder`, { items });
      return { collectionId, items: res.data.items };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to reorder items');
    }
  }
);

export const followCollection = createAsyncThunk(
  'collection/follow',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/collections/${id}/follow`);
      return { id, followersCount: res.data.followersCount };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to follow collection');
    }
  }
);

export const unfollowCollection = createAsyncThunk(
  'collection/unfollow',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/api/collections/${id}/follow`);
      return { id, followersCount: res.data.followersCount };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to unfollow collection');
    }
  }
);

export const searchCollections = createAsyncThunk(
  'collection/search',
  async (params: { q?: string; category?: string }, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/collections/search', { params });
      return res.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to search collections');
    }
  }
);

export const fetchMyCollections = createAsyncThunk(
  'collection/fetchMyCollections',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/collections/user/me');
      return res.data; // { myCollections, followedCollections }
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error || 'Failed to load user collections');
    }
  }
);

const collectionSlice = createSlice({
  name: 'collection',
  initialState,
  reducers: {
    setAddToCollectionModal: (state, action: PayloadAction<{ open: boolean; blogId: string | null }>) => {
      state.addToCollectionModal = action.payload;
    },
    clearCurrentCollection: (state) => {
      state.currentCollection = null;
    },
    liveUpdateCurrentCollection: (state, action: PayloadAction<any>) => {
      if (state.currentCollection && state.currentCollection._id === action.payload.collectionId) {
        state.currentCollection = { ...state.currentCollection, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    // fetchCollections
    builder.addCase(fetchCollections.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCollections.fulfilled, (state, action) => {
      state.loading = false;
      state.collections = action.payload.collections;
      state.pagination.hasMore = action.payload.hasMore;
    });
    builder.addCase(fetchCollections.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // fetchTrendingCollections
    builder.addCase(fetchTrendingCollections.fulfilled, (state, action) => {
      state.trendingCollections = action.payload.collections;
    });

    // fetchCollectionBySlug
    builder.addCase(fetchCollectionBySlug.pending, (state) => {
      state.currentCollectionLoading = true;
      state.error = null;
    });
    builder.addCase(fetchCollectionBySlug.fulfilled, (state, action) => {
      state.currentCollectionLoading = false;
      state.currentCollection = action.payload.collection;
    });
    builder.addCase(fetchCollectionBySlug.rejected, (state, action) => {
      state.currentCollectionLoading = false;
      state.error = action.payload as string;
    });

    // createCollection
    builder.addCase(createCollection.fulfilled, (state, action) => {
      state.myCollections.unshift(action.payload.collection);
    });

    // updateCollection
    builder.addCase(updateCollection.fulfilled, (state, action) => {
      const updated = action.payload.collection;
      if (state.currentCollection && state.currentCollection._id === updated._id) {
        state.currentCollection = { ...state.currentCollection, ...updated };
      }
      state.myCollections = state.myCollections.map(c => c._id === updated._id ? { ...c, ...updated } : c);
    });

    // deleteCollection
    builder.addCase(deleteCollection.fulfilled, (state, action) => {
      const id = action.payload;
      state.myCollections = state.myCollections.filter(c => c._id !== id);
      if (state.currentCollection && state.currentCollection._id === id) {
        state.currentCollection = null;
      }
    });

    // addBlogToCollection
    builder.addCase(addBlogToCollection.fulfilled, (state, action) => {
      const { collectionId, items } = action.payload;
      if (state.currentCollection && state.currentCollection._id === collectionId) {
        state.currentCollection.items = items;
        state.currentCollection.itemsCount = items.length;
      }
      state.myCollections = state.myCollections.map(c => 
        c._id === collectionId ? { ...c, items, itemsCount: items.length } : c
      );
    });

    // removeBlogFromCollection
    builder.addCase(removeBlogFromCollection.fulfilled, (state, action) => {
      const { collectionId, items } = action.payload;
      if (state.currentCollection && state.currentCollection._id === collectionId) {
        state.currentCollection.items = items;
        state.currentCollection.itemsCount = items.length;
      }
      state.myCollections = state.myCollections.map(c => 
        c._id === collectionId ? { ...c, items, itemsCount: items.length } : c
      );
    });

    // reorderCollectionItems
    builder.addCase(reorderCollectionItems.fulfilled, (state, action) => {
      const { collectionId, items } = action.payload;
      if (state.currentCollection && state.currentCollection._id === collectionId) {
        state.currentCollection.items = items;
      }
      state.myCollections = state.myCollections.map(c => 
        c._id === collectionId ? { ...c, items } : c
      );
    });

    // followCollection
    builder.addCase(followCollection.fulfilled, (state, action) => {
      const { id, followersCount } = action.payload;
      if (state.currentCollection && state.currentCollection._id === id) {
        state.currentCollection.followersCount = followersCount;
      }
    });

    // unfollowCollection
    builder.addCase(unfollowCollection.fulfilled, (state, action) => {
      const { id, followersCount } = action.payload;
      if (state.currentCollection && state.currentCollection._id === id) {
        state.currentCollection.followersCount = followersCount;
      }
      state.followedCollections = state.followedCollections.filter(c => c._id !== id);
    });

    // searchCollections
    builder.addCase(searchCollections.fulfilled, (state, action) => {
      state.searchResults = action.payload.collections;
    });

    // fetchMyCollections
    builder.addCase(fetchMyCollections.fulfilled, (state, action) => {
      state.myCollections = action.payload.myCollections;
      state.followedCollections = action.payload.followedCollections;
    });
  }
});

export const { setAddToCollectionModal, clearCurrentCollection, liveUpdateCurrentCollection } = collectionSlice.actions;
export default collectionSlice.reducer;
