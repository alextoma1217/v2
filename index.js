const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../server/config/auth');

// Welcome Page
router.get('/', forwardAuthenticated, (req, res) => res.render('welcome'));


// Dashboard
router.get('/dashboard/?', ensureAuthenticated, (req, res) =>
  res.render('game', {
    user: req.user
  })
);

// Dashboard
router.get('/tictactoe/?', ensureAuthenticated, (req, res) =>
  res.render('tictactoe', {
    user: req.user
  })
);


// router.get('/*', forwardAuthenticated, (req, res) => res.render('welcome'));



module.exports = router;
