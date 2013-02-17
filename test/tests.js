$(document).ready(function() {



var db = openDatabase("bb-websql-tests", "", "Backbone Websql Tests", 1024*1024);

var ThingModel = Backbone.Model.extend({
	store: new WebSQLStore(db, "things")
})
 
module("save load")

test("saving and loading by id", function(){
	var model = new ThingModel();
	
	ok(!model.id);
	model.set({'name': 'some name'})

	expect(3);
	stop();
	model.save({}, {
		success: function(m, resp){
			start();
			ok(model.id);
			loadTest();
		},	
		error: function(model, resp){
			start();
			console.error(resp);
			ok(false, 'saving failed');
		}
	});


	function loadTest(){
		var loadModel = new ThingModel({id: model.id});

		stop();
		loadModel.fetch({	
			success: function(){
				start();
				//console.log('model.toJSON()=%o', model.toJSON())
				deepEqual(loadModel.toJSON(), model.toJSON());
			},
			error: function(){
				start();
				console.error(resp);
				ok(false, 'loading failed');
			}
		});
	}
});

test("do not save apiid ", 3, function(){
	var model = new ThingModel({name: "some thing"});
	model.set({apiid: (new Date()).getTime()});

	model.save();
	ok(model.id);

	var model2 = new ThingModel({id: model.id});
	stop();
	model2.fetch({
		success: function(){
			start();
			equal(model2.get('name'), model.get('name'));
			ok(!model2.get('apiid'), 'should not save apiid');
		}
	});
});


});
