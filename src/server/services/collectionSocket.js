export const emitCollectionUpdated = (collectionId, data) => {
  if (global.io) {
    global.io.to(`collection_${collectionId}`).emit('collection:updated', data);
  }
};

export const emitCollectionItemAdded = (collectionId, blogId, item) => {
  if (global.io) {
    global.io.to(`collection_${collectionId}`).emit('collection:item_added', { collectionId, blogId, item });
  }
};

export const emitCollectionItemRemoved = (collectionId, blogId) => {
  if (global.io) {
    global.io.to(`collection_${collectionId}`).emit('collection:item_removed', { collectionId, blogId });
  }
};

export const emitCollectionReordered = (collectionId, items) => {
  if (global.io) {
    global.io.to(`collection_${collectionId}`).emit('collection:reordered', { collectionId, items });
  }
};

export const emitCollectionFollowed = (collectionId, followerId, followersCount) => {
  if (global.io) {
    global.io.to(`collection_${collectionId}`).emit('collection:followed', { collectionId, followerId, followersCount });
  }
};

export const emitCollectionNewPublic = (collection) => {
  if (global.io) {
    global.io.emit('collection:new_public', { collection });
  }
};
