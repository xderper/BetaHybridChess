import mongoose from 'mongoose';

// Define the User schema
const UserSchema = new mongoose.Schema({
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  email: {
    type: String,
    required: false,
    unique: true,
    trim: true,
    lowercase: true,
    sparse: true  // Позволяет иметь несколько документов без email
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create and export the User model
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
