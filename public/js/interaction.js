$(function() {

	$.fn.editable.defaults.mode = 'inline';

	//======================= Drag and Drop
	var UI = {
		dropArea: $('.column-notes'),
		add: $('#add-todo'),
		todoArea: $('#todo'),
		newUser: $('#new_user'),
		menu: $('.menu'),
		addUser: $('#add_user'),
		notification: $('#notification'),

		init: function() {
			this.editable();
			this.show();
			this.adduser();
			this.delete();
		},

		show: function() {
			this.newUser.on('click', function(e) {
				e.preventDefault();
				UI.menu.slideToggle(300);
			});
		},

		adduser: function() {
			this.addUser.on('click', function(e) {
				e.preventDefault();
				var username = $('#add_username').val(),
					password = $('#add_password').val();
				socket.emit('newuser', {u: username, p: password});
			});
		},

		delete: function() {
			$('.delete_anchor').on('click', function(e) {
				e.preventDefault();
				var id = $(this).attr('id');
				$('li#'+id).remove();
				socket.emit('delete', {id: id});
			});
		},

		editable: function() {
			$.each($('.note-content'), function(i,v) {
				$(this).editable({
					rows: 3,
					url: function(value) {
						socket.emit('contentUpdate', value);
					},
					success: function(data) {
						//$(this).data('pk') = data._id;
					},
					error: function(error) {
						console.log('error' + error);
					}
				});
			});
		}
	};

	UI.init();

	$.each(UI.dropArea, function(i,v) {
		$(this).sortable({
			connectWith: '.connectedSortable',
		}).disableSelection();
	});

	UI.dropArea.droppable({

		drop: function(event, ui) {
			var dropped = ui.draggable;
			var droppedOn = $(this);

			var thenote = $(dropped).map(function() {
				return {
			 		className: $(dropped).attr('class'),
			 		content: $(dropped).find('p').text(),
					id: $(dropped).find('p').data('pk')
				}
			});

			var column = $(droppedOn).map(function() {
				return { 
					droppedId: $(droppedOn).attr('id') 
				}
			});

			var x = $.merge(thenote, column);
			var data = $.extend({}, x[0], x[1]);

			socket.emit('move', data);

		}
	});

	function placeNewNote(data) {
		var html = '<li class="note todo ui-state-default" id="'+data._id+'">\
					<p class="note-content" data-type="textarea" data-pk="'+data._id+'" data-name="content">\
						'+data.content+'</p>\
					<a class="delete_anchor" id="'+data._id+'">\
						<span class="delete">&times;</span>\
					</a>\
					</li>';
		UI.todoArea.append(html);
		UI.editable();
		UI.delete();
	}

	//====================== New Note

	UI.add.on('click', function(e) {
		e.preventDefault();
		socket.emit('add');	
	});

	socket.on('newnote', function(data) {
		placeNewNote(data);	
	});

	socket.on('deleted', function(data) {
		$('li#'+data.id).remove();
	});


	socket.on('updateChanges', function(data) {
		$('.note').find('p[data-pk='+data._id+']').text(data.content);
	});

	socket.on('moved', function(data) {
		var existing = $('.note').find('p[data-pk='+data.id+']');
		if($(existing[0]).data('pk') === data.id) {

			$(existing[0]).parent().remove();
			$('#'+data.droppedId).append('<li class="'+data.className+'" id="'+data.id+'">\
				<p class="note-content" data-type="textarea" data-pk="'+data.id+'" data-name="content">\
					'+data.content+'</p>\
				<a class="delete_anchor" id="'+data.id+'">\
					<span class="delete">&times;</span>\
				</a>\
				</li>\
			');
			UI.init();
		}
	});

	socket.on('notification', function(data) {
		if(data) {
			UI.notification.text('User already exists! -> '+data.username).addClass('red').fadeIn(300).delay(1500).fadeOut(1000);
		} else {
			UI.notification.text('User has been added to the project!').addClass('green').fadeIn(300).delay(1500).fadeOut(1000);
		}
	});


});