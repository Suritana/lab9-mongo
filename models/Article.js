const mongoose = require('mongoose');

// Схема для рецензии
const reviewSchema = new mongoose.Schema({
    name: { type: String, required: true },
    message: { type: String, required: true },
    rating: { type: Number, min: 1, max: 10, required: true },
    date: { type: Date, default: Date.now }
});

// Схема для статьи
const articleSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    authors: [{ type: String, required: true }],
    publishDate: { type: Date, default: Date.now },
    content: { type: String, required: true },
    tags: [{ type: String }],
    reviews: [reviewSchema]
});

module.exports = mongoose.model('Article', articleSchema);