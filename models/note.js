var mongoose = require('mongoose');

var db = mongoose.createConnection('mongodb://localhost/scrumio');
db.on('error', console.error.bind(console, 'Connection Error'));

db.once('open', function() {
	console.log('Connected to ' + db.name);
});

var NoteSchema = new mongoose.Schema({
	content: String,
	status: String,
	account: String
});


var collection = 'notes';
var Note = db.model('Note', NoteSchema, collection);

module.exports = Note;