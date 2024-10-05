import mongoose, { Document, Model, Schema } from 'mongoose';

// User Interface
interface IUser extends Document {
  name: string;
  email: string;
}

// Reply Interface
interface IReply extends Document {
  user: mongoose.Types.ObjectId; // User ID
  content: string;
  createdAt?: Date;
}

// Comment Interface
export interface IComment extends Document {
  user: mongoose.Types.ObjectId; // User ID
  content: string;
  replies: IReply[];
  createdAt?: Date;
}

// News Interface
export interface INews extends Document {
  title: string;
  content: string; // Store HTML or JSON from editor
  likes: number;
  category: mongoose.Types.ObjectId; // Reference to NewsCategory
  comments: IComment[]; // Updated to use IComment type
  featured_image?: string; // New field for featured image
  featured_video?: string;
  banner: number; // New field for banner with default value of 0
  author: string; // New field for author, reference to User
  yt_url:string;
  reel_url:string;
}

// Reply Schema
const replySchema = new Schema<IReply>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Comment Schema
const commentSchema = new Schema<IComment>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to User model
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// News Schema
const newsSchema = new Schema<INews>({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String, // Store content from editor, which can include HTML
    required: true,
  },
  likes: {
    type: Number,
    default: 0,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "NewsCategory",
    required: true,
  },
  comments: [commentSchema], // Updated to use commentSchema
  featured_image: {
    type: String, // URL to the image
    required: false, // Optional field
  },
  featured_video: {
    type: String, // URL to the video
    required: false, // Optional field
  },
  banner: {
    type: Number,
    default: 0, // Default value is 0
  },
  author: {
    type: String,
  },
  yt_url: {
    type: String, // URL to the image
    required: false, // Optional field
  },
  reel_url: {
    type: String, // URL to the image
    required: false, // Optional field
  }
}, { timestamps: true });

// Create Models
const NewsModel: Model<INews> = mongoose.model('News', newsSchema);
export default NewsModel;
