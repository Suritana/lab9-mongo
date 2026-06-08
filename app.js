require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const Article = require('./models/Article');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка шаблонизатора
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB подключена'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// Маршрут для главной страницы
app.get('/', (req, res) => {
    res.render('index', {
        articles: null,
        searchQuery: '',
        authors: [],
        selectedAuthor: ''
    });
});

// Маршрут для получения списка всех статей
app.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ publishDate: -1 });
        const allAuthors = await Article.distinct('authors');

        res.render('index', {
            articles: articles,
            searchQuery: '',
            authors: allAuthors,
            selectedAuthor: ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для поиска по названию
app.post('/search/title', async (req, res) => {
    const { title } = req.body;
    try {
        const articles = await Article.find({
            title: { $regex: title, $options: 'i' }
        }).sort({ publishDate: -1 });

        const allAuthors = await Article.distinct('authors');

        res.render('index', {
            articles: articles,
            searchQuery: title,
            authors: allAuthors,
            selectedAuthor: ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Маршрут для поиска по автору
app.post('/search/author', async (req, res) => {
    const { author } = req.body;
    try {
        const articles = await Article.find({
            authors: author
        }).sort({ publishDate: -1 });

        const allAuthors = await Article.distinct('authors');

        res.render('index', {
            articles: articles,
            searchQuery: '',
            authors: allAuthors,
            selectedAuthor: author
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📚 Научный журнал готов к работе!`);
});