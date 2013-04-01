$(document).ready(function() {



var db = openDatabase("bb-websql-tests", "", "Backbone Websql Tests", 1024*1024);

var ThingModel = Backbone.Model.extend({
	store: new WebSQLStore(db, "things")
})
var ThingCollection = Backbone.Collection.extend({
	model: ThingModel,
	store: ThingModel.prototype.store
});

function teardown() {
	var coll = new ThingCollection();
	stop();
	coll.fetch({
		success: function(){
			var success = _.after(coll.length, function(){
				start();
			});
			_.invoke(_.clone(coll.models), 'destroy', {
				success: success,
				error: error.bind(null, 'model.destroy() failed')
			});
		},
		error: error.bind(null, 'teardown fetch failed')
	});
}
 
module("save load", {teardown: teardown});

test("saving and loading by id", function(){
	var model = new ThingModel();
	ok(!model.id);
	model.set({'name': 'some name'})

	expect(3);
	stop();
	model.save({}, {
		success: function(m, resp){
			ok(model.id);
			loadTest();
		},	
		error: error.bind(null, 'saving failed')
	});


	function loadTest(){
		var loadModel = new ThingModel({id: model.id});
		loadModel.fetch({	
			success: function(){
				start();
				//console.log('model.toJSON()=%o', model.toJSON())
				deepEqual(loadModel.toJSON(), model.toJSON());
			},
			error: error.bind(null, 'loading failed')
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
		},
		error: error.bind(null, 'model2.fetch() failed')
	});
});

module("fetch", {teardown: teardown});

test("Collection.fetch() should populate the collection", function(){
	var coll = new ThingCollection();
	var model = new ThingModel({name: "some thing"});
	stop();
	model.save(null, {
		success: function(){
			coll.fetch({
				success: function(){
					start();
					equal(coll.length, 1);
				},
				error: error.bind(null, 'coll.fetch() failed')
			});
		},
		error: error.bind(null, 'model.save() failed')
	});
});

test("Model.fetch() should update a single model", function() {
	var model = new ThingModel({name: "some thing"});
	stop();
	model.save(null, {
		success: function(){
			var model2 = new ThingModel({id: model.id});
			model2.fetch({
				success: function() {
					start();
					equal(model2.get("name"), "some thing");
				},
				error: error.bind(null, 'model2.fetch() failed')
			})
		},
		error: error.bind(null, 'model.save() failed')
	});
});

test("Collection.fetch() should work, even if Model.fetch() is called immediately after it", function(){
	var coll = new ThingCollection();
	var model = new ThingModel({name: "some thing"});
	stop();
	model.save(null, {
		success: function(){
			var model2 = new ThingModel({id: model.id});
			var success = _.after(2, function() {
				start();
				equal(coll.length, 1);
				equal(model2.get("name"), "some thing");
			});
			coll.fetch({
				success: success,
				error: error.bind(null, 'coll.fetch() failed')
			});
			model2.fetch({
				success: success,
				error: error.bind(null, 'model.fetch() failed')
			});
		},
		error: error.bind(null, 'model.save() failed')
	});
});

function error(msg, model, resp){
	start();
	console.error(resp);
	ok(false, msg);
}

});
