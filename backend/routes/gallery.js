const express = require('express');
const router = express.Router();
const { GridFsStorage } = require('multer-gridfs-storage');
const mongoose = require('mongoose');
const multer = require('multer');
const Grid = require('gridfs-stream');
// const mongoURI = process.env.MONGO_URI;
const conn = mongoose.connection;

mongoose.connection.once('open', () => {
  console.log('Gallery route connected to MongoDB');
})

let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create the multer storage using GridFS
const storage = new GridFsStorage({
  url: 'mongodb+srv://travel:ullasm123@cluster0.mongodb.net/Cluster0?retryWrites=true&w=majority',
  options: { useUnifiedTopology: true },
  file: (req, file) => ({
    filename: `${Date.now()}-${file.originalname}`,
    bucketName: 'development',
  }),
});
const upload = multer({ storage });

// Get all image metadata
router.get('/', async (req, res) => {
  try {
    const files = await gfs.files.find().toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No images found' });
    }
    res.json(files);
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Upload an image
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(201).json({
    message: 'Image uploaded successfully',
    file: req.file,
  });
});

// Delete an image by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  gfs.delete(new mongoose.Types.ObjectId(id), (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).json({ message: 'Error deleting image' });
    }
    res.status(200).json({ message: 'Image deleted successfully' });
  });
});

module.exports = router;
