var Note = require('../models/note');

exports.index = function(req, res) {
  if(req.user) {
  	Note.find({account: req.user.account}, function(err, notes) {
		res.render('home', {user: req.user, notes: notes});
	});
  } else {
  	res.render('index', { title: 'Express' });
  }
};

exports.home = function(req, res) {
	if(!req.user) {
		res.render('index');
	} else {
		Note.find({account: req.user.account}, function(err, notes) {
			res.render('home', {user: req.user, notes: notes});
		});
	}
};

