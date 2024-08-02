const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();
// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237_news_website'
});

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    }
});

const upload = multer({storage: storage});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Set up view engine
app.set('view engine', 'ejs');

// Enable static files
app.use(express.static('images'));
app.use(express.static('style'));

// Enable form processing (add new article)
app.use(express.urlencoded({ extended: false }));

// Define routes
// Display all articles on homepage
app.get('/', (req, res) => {
    // Fetch data from MySQL
    const sql = 'SELECT * FROM article ORDER BY date DESC';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving articles");
        }
        // Render HTML page with data
        res.render('index', { article: results });
    });
});

// Display article details
app.get('/article/:id', (req, res) => {
    const art_id = req.params.id;
    const uid = req.params.id;
    const articlesql = 'SELECT * FROM article WHERE art_id = ?';
    const usersql = 'SELECT * FROM user INNER JOIN article ON user.uid = article.user_id';
    connection.query(articlesql, [art_id], (error, articleres) => {
        if (error) {
            // Handle any error that occurs during the db operation
            console.error("Error adding article:", error); 
            res.status(500).send("Error adding article")
        }
        connection.query(usersql, [uid], (error, userres) => {
            if (error) {
                console.error("Error retrieving comments:", error);
                return res.status(500).send("Error retrieving comments");
            }

            // Send a success response
            res.render('article', {
                article: articleres,
                user: userres
            });
        });
    });
});

// **Direct to the create page 
app.get('/create', (req, res) => {
    res.render('create')
});

// **Add article into database
app.post('/create', upload.single('image'), (req, res) => {
    //Extract the article ID from request body 
    const {title, content, tag, user_id} = req.body;
    let image;
    if (req.file) {
        image=req.file.filename; //save only the filename
    } else {
        image = null;
    }
    const sql = 'INSERT INTO article (title, content, tag, image, user_id) VALUES (?, ?, ?, ?, ?)';
    // Insert the new article in the database
    connection.query(sql, [title, content, tag, image, user_id], (error, results) => {
        if (error) {
            // Handle any error that occurs during the db operation
            console.error("Error adding article:", error); 
            res.status(500).send("Error adding article")
        } else {
            // Send a success response
            res.redirect("/");
        }
    });
});

// Display created articles on homepage
app.get('/published', (req, res) => {
    // Fetch data from MySQL
    const sql = 'SELECT * FROM article';
    connection.query(sql, (error, results) => {
        if (error) {
            console.error("Database query error:", error.message);
            return res.status(500).send("Error retrieving articles");
        }
        // Render HTML page with data
        res.render('published', { article: results });
    });
});

// Add new article to database
app.post('/published', upload.single('image'), (req, res) => {
    const { title, content, date} = req.body;
    let image = null;
    if (req.file) {
        image = req.file.filename;
    }
    const sql = 'INSERT INTO article (title, content, date, image) VALUES (?, ?, ?, ?)';
    connection.query(sql, [title, content, date, image], (error, results) => {
        if (error) {
            console.error("Error adding article:", error);
            res.status(500).send("Error adding article");
        } else {
            res.redirect("/");
        }
    });
});

app.get('/editarticle/:id', (req,res) => {
    const art_id = req.params.id;
    const sql = 'SELECT * FROM article WHERE art_id = ?';
    // Fetch data from MySQL based on the article ID
    connection.query( sql , [art_id], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving article by ID');
        }
        // Check if any article with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the article data
            res.render('editarticle', { article: results[0] });
        } else {
            // If no article with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Article not found');
        }
    });
});

app.post('/editarticle/:id', upload.single('image'), (req, res) => {
    const art_id = req.params.id;
    // Extract article data from the request body
    const { title, content, tag } = req.body;
    let image = req.body.currentImage;
    if (req.file) {
        image = req.file.filename;
    }
    const sql = 'UPDATE article SET title = ?, content = ?, tag = ?, image = ? WHERE art_id = ?';

    // Insert the new article into the database
    connection.query( sql, [title, content, tag, image, art_id], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating article:", error);
            res.status(500).send('Error updating article');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/deletearticle/:id', (req, res) => {
    const art_id = req.params.id;
    const sql = 'DELETE FROM article WHERE art_id = ?';
    connection.query(sql, [art_id], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting article:", error);
            res.status(500).send('Error deleting article');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

// Display selected category articles on homepage
app.get('/category/:tag', (req, res) => {
    const tag = req.params.tag;
    const sql = 'SELECT * FROM article WHERE tag = ?';
    // Fetch data from MySQL based on the article ID
    connection.query( sql , [tag], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving article by ID');
        }
        // Check if any article with the given ID was found
        if (results.length > 0) {
            // Render HTML page with the article data
            res.render('category', { article: results });
        } else {
            // If no article with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Article not found');
        }
    });
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));