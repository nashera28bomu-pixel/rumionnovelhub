import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------

CREATE NOVEL (UPLOAD COVER + DETAILS)
*/

router.post(
'/upload',
authenticate,
upload.single('cover'),
async (req, res) => {
try {
const { title, description, genre } = req.body;

  if (!title) {
    return res.status(400).json({
      success: false,
      message: 'Title is required'
    });
  }

  const cover_url = req.file ? req.file.path : null;

  const { data, error } = await supabase
    .from('user_novels')
    .insert([
      {
        user_id: req.user.id,
        title,
        description,
        genre: genre ? genre.split(',') : [],
        cover_url,
        is_published: false
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }

  res.json({
    success: true,
    message: 'Novel created successfully',
    data
  });
} catch (error) {
  res.status(500).json({
    success: false,
    message: error.message
  });
}

}
);

/*
|--------------------------------------------------------------------------

ADD CHAPTER
*/

router.post('/chapter', authenticate, async (req, res) => {
try {
const { novel_id, title, content, chapter_number } = req.body;

if (!novel_id || !content) {
  return res.status(400).json({
    success: false,
    message: 'novel_id and content are required'
  });
}

const { data, error } = await supabase
  .from('user_chapters')
  .insert([
    {
      user_id: req.user.id,
      novel_id,
      title,
      content,
      chapter_number
    }
  ])
  .select()
  .single();

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: 'Chapter added successfully',
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

GET USER NOVELS
*/

router.get('/my-novels', authenticate, async (req, res) => {
try {
const { data, error } = await supabase
.from('user_novels')
.select('*')
.eq('user_id', req.user.id)
.order('created_at', { ascending: false });

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

GET PUBLIC NOVELS (ALL USERS)
*/

router.get('/public', async (req, res) => {
try {
const { page = 1, limit = 20 } = req.query;

const from = (page - 1) * limit;
const to = from + limit - 1;

const { data, error } = await supabase
  .from('user_novels')
  .select('*')
  .eq('is_published', true)
  .range(from, to)
  .order('created_at', { ascending: false });

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

GET SINGLE NOVEL + CHAPTERS
*/

router.get('/:id', async (req, res) => {
try {
const { id } = req.params;

const { data: novel, error: novelError } = await supabase
  .from('user_novels')
  .select('*')
  .eq('id', id)
  .single();

if (novelError) {
  return res.status(404).json({
    success: false,
    message: novelError.message
  });
}

const { data: chapters, error: chapterError } = await supabase
  .from('user_chapters')
  .select('id, title, chapter_number, created_at')
  .eq('novel_id', id)
  .order('chapter_number', { ascending: true });

if (chapterError) {
  return res.status(500).json({
    success: false,
    message: chapterError.message
  });
}

res.json({
  success: true,
  data: {
    novel,
    chapters
  }
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

UPDATE NOVEL
*/

router.put('/:id', authenticate, async (req, res) => {
try {
const { id } = req.params;

const { title, description, genre } = req.body;

const { data, error } = await supabase
  .from('user_novels')
  .update({
    title,
    description,
    genre: genre ? genre.split(',') : [],
    updated_at: new Date().toISOString()
  })
  .eq('id', id)
  .eq('user_id', req.user.id)
  .select()
  .single();

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: 'Novel updated',
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

DELETE NOVEL
*/

router.delete('/:id', authenticate, async (req, res) => {
try {
const { id } = req.params;

const { error } = await supabase
  .from('user_novels')
  .delete()
  .eq('id', id)
  .eq('user_id', req.user.id);

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: 'Novel deleted successfully'
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

/*
|--------------------------------------------------------------------------

PUBLISH / UNPUBLISH TOGGLE
*/

router.patch('/:id/publish', authenticate, async (req, res) => {
try {
const { id } = req.params;
const { publish } = req.body;

const { data, error } = await supabase
  .from('user_novels')
  .update({
    is_published: publish,
    updated_at: new Date().toISOString()
  })
  .eq('id', id)
  .eq('user_id', req.user.id)
  .select()
  .single();

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: publish ? 'Novel published' : 'Novel unpublished',
  data
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

export default router;
