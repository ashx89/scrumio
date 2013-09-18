var mongoose = require('mongoose');

var db = mongoose.createConnection('mongodb://localhost/scrumio');

var NoteSchema = new mongoose.Schema({
	content: String,
	status: String,
	account: String
});


var collection = 'notes';
var Note = db.model('Note', NoteSchema, collection);

module.exports = Note;