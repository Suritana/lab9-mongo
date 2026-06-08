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
app.use(bodyParser.json());
app.use(express.static('public'));

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB подключена'))
    .catch(err => console.error('❌ Ошибка подключения к MongoDB:', err));

// ==================== МАРШРУТЫ ====================

// Главная страница
app.get('/', async (req, res) => {
    try {
        const allAuthors = await Article.distinct('authors');
        res.render('index', {
            articles: null,
            searchQuery: '',
            authors: allAuthors,
            selectedAuthor: ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Список всех статей
app.get('/articles', async (req, res) => {
    try {
        const articles = await Article.find().sort({ publishDate: -1 });
        const allAuthors = await Article.distinct('authors');

        res.render('articles', {
            articles: articles,
            searchQuery: '',
            authors: allAuthors,
            selectedAuthor: '',
            startDate: '',
            endDate: ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Форма создания статьи (GET - показывает форму)
app.get('/article/new', (req, res) => {
    res.render('new-article');
});

// Создание новой статьи (POST - обрабатывает отправку формы)
app.post('/article/new', async (req, res) => {
    try {
        const { title, authors, content, tags } = req.body;

        const authorsArray = authors.split(',').map(a => a.trim());
        const tagsArray = tags ? tags.split(',').map(t => t.trim()) : [];

        const newArticle = new Article({
            title,
            authors: authorsArray,
            content,
            tags: tagsArray,
            publishDate: new Date()
        });

        await newArticle.save();
        res.redirect('/articles');
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при создании статьи: ' + error.message);
    }
});


// Полная страница статьи (для просмотра)
app.get('/article/:id', async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).send('Статья не найдена');
        }
        res.render('article', { article });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Удаление статьи
app.delete('/article/:id', async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);
        if (!article) {
            return res.status(404).json({ error: 'Статья не найдена' });
        }
        res.json({ message: 'Статья успешно удалена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка при удалении' });
    }
});


// Добавление рецензии
app.post('/article/:id/review', async (req, res) => {
    try {
        const { name, message, rating } = req.body;
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).send('Статья не найдена');
        }

        article.reviews.push({
            name: name || 'Аноним',
            message,
            rating: parseInt(rating)
        });

        await article.save();
        res.redirect(`/article/${req.params.id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка при добавлении рецензии');
    }
});

// Поиск по названию
app.post('/search/title', async (req, res) => {
    const { title } = req.body;
    try {
        const articles = await Article.find({
            title: { $regex: title, $options: 'i' }
        }).sort({ publishDate: -1 });

        const allAuthors = await Article.distinct('authors');

        res.render('articles', {
            articles: articles,
            searchQuery: title,
            authors: allAuthors,
            selectedAuthor: '',
            startDate: '',
            endDate: ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Поиск по автору
app.post('/search/author', async (req, res) => {
    const { author } = req.body;
    try {
        const articles = await Article.find({
            authors: author
        }).sort({ publishDate: -1 });

        const allAuthors = await Article.distinct('authors');

        res.render('articles', {
            articles: articles,
            searchQuery: '',
            authors: allAuthors,
            selectedAuthor: author,
            startDate: '',
            endDate: ''
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// ТОП статей (по рейтингу)
app.get('/top-articles', async (req, res) => {
    try {
        const articles = await Article.find();

        // Сортируем статьи по рейтингу и количеству комментариев
        const sortedArticles = articles
            .map(article => ({
                ...article.toObject(),
                averageRating: article.averageRating,
                reviewCount: article.reviews.length
            }))
            .sort((a, b) => {
                // Сначала сравниваем по рейтингу
                if (b.averageRating !== a.averageRating) {
                    return b.averageRating - a.averageRating;
                }
                // Если рейтинг равный, то по количеству комментариев
                return b.reviewCount - a.reviewCount;
            })
            .slice(0, 10); // Берем топ-10

        const allAuthors = await Article.distinct('authors');

        res.render('top-articles', {
            articles: sortedArticles,
            authors: allAuthors
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Ошибка сервера');
    }
});

// Поиск по диапазону дат
app.post('/search/date', async (req, res) => {
    const { startDate, endDate } = req.body;
    try {
        const query = {};

        if (startDate && startDate !== '') {
            query.publishDate = { $gte: new Date(startDate) };
        }
        if (endDate && endDate !== '') {
            const endDateTime = new Date(endDate);
            endDateTime.setHours(23, 59, 59, 999);
            query.publishDate = { ...query.publishDate, $lte: endDateTime };
        }

        const articles = await Article.find(query).sort({ publishDate: -1 });
        const allAuthors = await Article.distinct('authors');

        res.render('articles', {
            articles: articles,
            searchQuery: '',
            authors: allAuthors,
            selectedAuthor: '',
            startDate: startDate || '',
            endDate: endDate || ''
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