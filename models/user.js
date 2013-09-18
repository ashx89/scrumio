var mongoose = require('mongoose');

var db = mongoose.createConnection('mongodb://localhost/scrumio');


var UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	account: String
});

// Do some validation with database data
UserSchema.methods.validPassword = function(password) {
	return (this.password === password);
}

var collection = 'users';
var User = db.model('User', UserSchema, collection);

module.exports = User;