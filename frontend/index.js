const express = require('express');
const passport = require('passport');
const session = require('express-session');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: '1017988010282-85jc10h4ma3qmf0p04dcjet9henalngu.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  // Here, you can save the user profile to your database if needed
  return done(null, profile);
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('login', { user: req.user });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/portfolio');
  }
);

app.get('/portfolio', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch the user's portfolio from the database
    const portfolio = await Portfolio.findOne({ userId: req.user.id });

    // Render the portfolio view with the fetched data
    res.render('portfolio', {
      user: req.user,
      portfolio: portfolio || { about: '', projects: [], githubUsername: '' },
    });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/portfolio/edit', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch the user's portfolio from the database
    const portfolio = await Portfolio.findOne({ userId: req.user.id });

    // Render the edit portfolio view with the fetched data
    res.render('edit', {
      user: req.user,
      portfolio: portfolio || { about: '', projects: [], githubUsername: '' },
    });
  } catch (err) {
    console.error('Error fetching portfolio for editing:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.redirect('/'); // Redirect to the login page
    });
  });
});

mongoose.connect('mongodb://localhost:27017/portfolioDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

const portfolioSchema = new mongoose.Schema({
  userId: String, // Store the user's unique ID from Google OAuth
  about: String,
  projects: [String], // Array of project descriptions
  githubUsername: String,
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

app.post('/portfolio/edit', ensureAuthenticated, async (req, res) => {
  const { about, projects, githubUsername } = req.body;

  try {
    // Find the user's portfolio or create a new one
    const portfolio = await Portfolio.findOneAndUpdate(
      { userId: req.user.id },
      { about, projects: projects.split(','), githubUsername },
      { upsert: true, new: true }
    );

    console.log('Portfolio updated:', portfolio);
    res.redirect('/portfolio');
  } catch (err) {
    console.error('Error saving portfolio:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running. Visit: http://localhost:${port} in your browser 🚀`);
});


