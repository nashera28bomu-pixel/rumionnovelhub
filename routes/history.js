import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/*
|--------------------------------------------------------------------------

SAVE / UPDATE READING HISTORY
Called whenever user opens a chapter
--------------------------------------------------------------------------
*/

router.post('/', authenticate, async (req, res) => {
try {
const { novel_id, chapter_id, chapter_title, novel_title } = req.body;

if (!novel_id || !chapter_id) {
  return res.status(400).json({
    success: false,
    message: 'novel_id and chapter_id are required'
  });
}

const user_id = req.user.id;

const { data, error } = await supabase
  .from('reading_history')
  .upsert(
    {
      user_id,
      novel_id,
      chapter_id,
      chapter_title,
      novel_title,
      last_read: new Date().toISOString()
    },
    {
      onConflict: 'user_id,novel_id'
    }
  )
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
  message: 'Reading progress saved',
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

GET USER HISTORY (RECENTLY READ)
*/

router.get('/', authenticate, async (req, res) => {
try {
const user_id = req.user.id;

const { data, error } = await supabase
  .from('reading_history')
  .select('*')
  .eq('user_id', user_id)
  .order('last_read', { ascending: false })
  .limit(50);

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

CONTINUE READING (LATEST ITEM ONLY)
*/

router.get('/continue', authenticate, async (req, res) => {
try {
const user_id = req.user.id;

const { data, error } = await supabase
  .from('reading_history')
  .select('*')
  .eq('user_id', user_id)
  .order('last_read', { ascending: false })
  .limit(1)
  .single();

if (error && error.code !== 'PGRST116') {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

if (!data) {
  return res.json({
    success: true,
    data: null,
    message: 'No reading history found'
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

DELETE HISTORY ITEM
*/

router.delete('/:novel_id', authenticate, async (req, res) => {
try {
const user_id = req.user.id;
const { novel_id } = req.params;

const { error } = await supabase
  .from('reading_history')
  .delete()
  .eq('user_id', user_id)
  .eq('novel_id', novel_id);

if (error) {
  return res.status(500).json({
    success: false,
    message: error.message
  });
}

res.json({
  success: true,
  message: 'History removed successfully'
});

} catch (error) {
res.status(500).json({
success: false,
message: error.message
});
}
});

export default router;
