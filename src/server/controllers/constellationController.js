import Constellation from '../models/Constellation.js';
import Blog from '../models/Blog.js';

export const getConstellations = async (req, res) => {
  try {
    const constellations = await Constellation.find()
      .populate('creator', 'name username profileImage')
      .populate({
        path: 'blogs',
        select: 'title slug coverImage category tags author',
        populate: { path: 'author', select: 'name profileImage' }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ constellations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createConstellation = async (req, res) => {
  try {
    const { name, description, blogs } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Constellation name is required.' });
    }
    if (!blogs || !Array.isArray(blogs) || blogs.length === 0) {
      return res.status(400).json({ error: 'At least one blog post must be included in the constellation.' });
    }

    const constellation = new Constellation({
      name: name.trim(),
      description: description || '',
      creator: req.user._id,
      blogs,
      isAIGenerated: false
    });

    await constellation.save();
    
    // Populate before sending back
    await constellation.populate('creator', 'name username profileImage');
    await constellation.populate({
      path: 'blogs',
      select: 'title slug coverImage category tags author',
      populate: { path: 'author', select: 'name profileImage' }
    });

    res.status(201).json({ message: 'Constellation created successfully', constellation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateAIConstellation = async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not defined in environment variables.' });
    }

    const { category, tag } = req.body;
    
    // Find published blogs
    const query = { status: 'published' };
    if (category) query.category = category;
    if (tag) query.tags = { $in: [tag] };

    const blogs = await Blog.find(query).select('title summary category tags _id');
    if (blogs.length < 2) {
      return res.status(400).json({ error: 'Not enough blogs available to generate a thematic constellation. Need at least 2.' });
    }

    // Prepare inputs for Gemini
    const blogDataList = blogs.map(b => ({
      id: b._id.toString(),
      title: b.title,
      summary: b.summary || 'No summary available.',
      category: b.category,
      tags: b.tags
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert content curator. Your task is to organize a selection of blog posts into a coherent thematic learning path or "constellation".
From the following list of available blog posts, select between 2 and 6 posts that fit together logically. Order them sequentially so they form a progressive reading sequence (e.g., from foundational concepts to advanced details).
Assign a compelling theme name and a short description explaining what the user will learn from this path.

Available blogs:
${JSON.stringify(blogDataList, null, 2)}

You MUST return a JSON object with this exact structure:
{
  "name": "A creative title for the constellation",
  "description": "A description of the theme and why these blogs are connected.",
  "blogsOrderedIds": ["id_1", "id_2", "id_3"]
}

Rules:
1. Only select from the provided list. Do not make up blog IDs.
2. Order them from easiest/introductory to most advanced.
3. Return only raw JSON, no markdown formatting, backticks, or other text.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: `Gemini API returned error: ${response.status} - ${errorText}` });
    }

    const result = await response.json();
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ error: 'Failed to retrieve constellation structure from Gemini AI.' });
    }

    const curation = JSON.parse(rawText.trim());
    if (!curation.name || !curation.blogsOrderedIds || curation.blogsOrderedIds.length === 0) {
      return res.status(500).json({ error: 'Invalid constellation format returned from Gemini.' });
    }

    // Verify blog IDs actually exist and construct constellation
    const validBlogIds = curation.blogsOrderedIds.filter(id => 
      blogs.some(b => b._id.toString() === id)
    );

    if (validBlogIds.length === 0) {
      return res.status(500).json({ error: 'Gemini generated invalid blog IDs that do not exist.' });
    }

    const constellation = new Constellation({
      name: curation.name,
      description: curation.description || 'AI curated reading path.',
      creator: req.user._id,
      blogs: validBlogIds,
      isAIGenerated: true
    });

    await constellation.save();

    await constellation.populate('creator', 'name username profileImage');
    await constellation.populate({
      path: 'blogs',
      select: 'title slug coverImage category tags author',
      populate: { path: 'author', select: 'name profileImage' }
    });

    res.status(201).json({ 
      message: 'AI Theme Constellation created successfully!', 
      constellation 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
