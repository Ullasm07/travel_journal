const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const path = require('path');
const galleryRoutes = require('./routes/gallery'); // Adjust the path if needed

require('dotenv').config();

const app = express();

// MongoDB Connection
const mongoURI = 'mongodb+srv://travel:ullasm123@cluster0.mongodb.net/Cluster0?retryWrites=true&w=majority';

app.use(cors());
app.use(express.json());

// Connect to MongoDB using mongoose.connect
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// GridFS Stream setup
const conn = mongoose.connection; // Use mongoose default connection
let gfs;
conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads'); // Collection name for storing files
});

console.log(mongoURI); // Log to ensure the URI is being loaded properly

// Configure GridFS Storage
const storage = new GridFsStorage({
  url: 'mongodb+srv://travel:ullasm123@cluster0.mongodb.net/Cluster0?retryWrites=true&w=majority',
  options: { useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `${Date.now()}-${file.originalname}`,
      bucketName: 'uploads', // MongoDB collection to store files
    };
  },
});

const upload = multer({ storage });

// Use Gallery routes
app.use('/api/gallery', galleryRoutes);

// ------------------ Gallery Routes ------------------

// Get metadata of all images
app.get('/api/gallery', async (req, res) => {
  try {
    const files = await gfs.files.find().toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: 'No images found' });
    }
    const images = files.map((file) => ({
      _id: file._id,
      filename: file.filename,
      contentType: file.contentType,
      uploadDate: file.uploadDate,
      size: file.length,
    }));
    res.status(200).json(images);
  } catch (err) {
    console.error('Error fetching images:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve an image by filename
app.get('/api/gallery/image/:filename', (req, res) => {
  const { filename } = req.params;
  gfs.files.findOne({ filename }, (err, file) => {
    if (err) {
      console.error('Error finding file:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
    if (!file || file.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }
    if (!file.contentType.startsWith('image')) {
      return res.status(400).json({ message: 'Not an image file' });
    }
    const readStream = gfs.createReadStream(file.filename);
    res.set('Content-Type', file.contentType);
    readStream.pipe(res);
  });
});

// Upload an image
app.post('/api/gallery/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  res.status(201).json({
    message: 'Image uploaded successfully',
    file: {
      id: req.file.id,
      filename: req.file.filename,
      bucketName: req.file.bucketName,
    },
  });
});

// Delete an image by ID
app.delete('/api/gallery/:id', (req, res) => {
  const { id } = req.params;
  gfs.delete(new mongoose.Types.ObjectId(id), (err) => {
    if (err) {
      console.error('Error deleting file:', err);
      return res.status(500).json({ message: 'Error deleting image' });
    }
    res.status(200).json({ message: 'Image deleted successfully' });
  });
});

// ------------------ Error Handling ------------------

// Handle invalid routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// General error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// ------------------ Server Setup ------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
