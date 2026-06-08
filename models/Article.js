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

// Виртуальное поле для среднего рейтинга
articleSchema.virtual('averageRating').get(function() {
    if (this.reviews.length === 0) return 0;
    const sum = this.reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / this.reviews.length).toFixed(1);
});

// Виртуальное поле для количества комментариев
articleSchema.virtual('reviewCount').get(function() {
    return this.reviews.length;
});

articleSchema.set('toJSON', { virtuals: true });
articleSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Article', articleSchema);