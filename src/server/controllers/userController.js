import User from '../models/User.js';
import Blog from '../models/Blog.js';
import Notification from '../models/Notification.js';

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Fetch published blogs of this user
    const blogs = await Blog.find({ author: id, status: 'published' })
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ user, blogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const { id } = req.params; // Target user to follow
    const currentUser = await User.findById(req.user._id);
    const targetUser = await User.findById(id);

    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (currentUser._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    const followIndex = currentUser.following.indexOf(targetUser._id);
    let isFollowing = false;

    if (followIndex === -1) {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
      isFollowing = true;

      // Notify the target user
      const notif = new Notification({
        userId: targetUser._id,
        message: `${currentUser.name} started following you`,
        type: 'follow',
        referenceId: currentUser._id
      });
      await notif.save();
      if (global.io) {
        global.io.to(`user_${targetUser._id}`).emit('notification_received', notif);
      }
    } else {
      // Unfollow
      currentUser.following.splice(followIndex, 1);
      const followerIndex = targetUser.followers.indexOf(currentUser._id);
      if (followerIndex !== -1) {
        targetUser.followers.splice(followerIndex, 1);
      }
    }

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({
      message: isFollowing ? 'Successfully followed' : 'Successfully unfollowed',
      isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: currentUser.following.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin Routes
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (role) {
      user.role = role;
    }
    await user.save();

    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(id);
    // Delete their blogs
    await Blog.deleteMany({ author: id });

    res.status(200).json({ message: 'User and all associated blogs deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update own user profile
export const updateOwnProfile = async (req, res) => {
  try {
    const { name, bio, profileImage, socialLinks } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (socialLinks !== undefined) {
      user.socialLinks = {
        twitter: socialLinks.twitter !== undefined ? socialLinks.twitter : user.socialLinks?.twitter || '',
        github: socialLinks.github !== undefined ? socialLinks.github : user.socialLinks?.github || '',
        website: socialLinks.website !== undefined ? socialLinks.website : user.socialLinks?.website || ''
      };
    }

    await user.save();
    
    // Omit password from output
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle bookmark on blog post
export const toggleBookmark = async (req, res) => {
  try {
    const { blogId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.savedBlogs) {
      user.savedBlogs = [];
    }

    const index = user.savedBlogs.indexOf(blogId);
    let isBookmarked = false;
    if (index === -1) {
      user.savedBlogs.push(blogId);
      isBookmarked = true;
    } else {
      user.savedBlogs.splice(index, 1);
    }

    await user.save();
    res.status(200).json({
      message: isBookmarked ? 'Article bookmarked' : 'Bookmark removed',
      isBookmarked,
      savedBlogs: user.savedBlogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all bookmarked blog posts
export const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'savedBlogs',
      populate: { path: 'author', select: 'name profileImage' }
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Filter out any blogs that might have been deleted but are still in bookmarks
    const validSavedBlogs = (user.savedBlogs || []).filter(blog => blog !== null);

    res.status(200).json({ bookmarks: validSavedBlogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle Newsletter Subscription to author
export const toggleNewsletter = async (req, res) => {
  try {
    const { authorId } = req.params;
    const targetAuthor = await User.findById(authorId);
    if (!targetAuthor) {
      return res.status(404).json({ error: 'Author not found.' });
    }

    if (req.user._id.toString() === authorId) {
      return res.status(400).json({ error: 'You cannot subscribe to your own newsletter.' });
    }

    if (!targetAuthor.newsletterSubscribers) {
      targetAuthor.newsletterSubscribers = [];
    }

    const index = targetAuthor.newsletterSubscribers.indexOf(req.user._id);
    let isSubscribed = false;
    if (index === -1) {
      targetAuthor.newsletterSubscribers.push(req.user._id);
      isSubscribed = true;
    } else {
      targetAuthor.newsletterSubscribers.splice(index, 1);
    }

    await targetAuthor.save();
    res.status(200).json({
      message: isSubscribed ? 'Subscribed to newsletter' : 'Unsubscribed from newsletter',
      isSubscribed,
      subscribersCount: targetAuthor.newsletterSubscribers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle Category Subscription
export const toggleCategorySubscription = async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) {
      return res.status(400).json({ error: 'Category name is required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (!user.subscribedCategories) {
      user.subscribedCategories = [];
    }

    const index = user.subscribedCategories.indexOf(category);
    let isSubscribed = false;
    if (index === -1) {
      user.subscribedCategories.push(category);
      isSubscribed = true;
    } else {
      user.subscribedCategories.splice(index, 1);
    }

    await user.save();
    res.status(200).json({
      message: isSubscribed ? `Subscribed to category ${category}` : `Unsubscribed from category ${category}`,
      isSubscribed,
      subscribedCategories: user.subscribedCategories
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
