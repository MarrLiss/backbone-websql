(function(Backbone, _) {
var assert = chai.assert;

var db = openDatabase("bb-websql-tests", "", "Backbone Websql Tests", 1024*1024);

var ThingModel = Backbone.Model.extend({
  store: new WebSQLStore(db, "things")
});
var ThingCollection = Backbone.Collection.extend({
  model: ThingModel,
  store: ThingModel.prototype.store
});

describe('Backbone.WebSQL', function() {

  afterEach(teardown);

  it("should save/load by id", function(done){
    var model = new ThingModel();
    assert(!model.id);
    model.set({'name': 'some name'})

    model.save({}, {
      success: function(m, resp){
        assert(model.id);
        loadTest();
      },
      error: done.bind(null, 'saving failed')
    });

    function loadTest(){
      var loadModel = new ThingModel({id: model.id});
      loadModel.fetch({  
        success: function(){
          assert.deepEqual(loadModel.toJSON(), model.toJSON());
          done();
        },
        error: done.bind(null, 'loading failed')
      });
    }
  });

  it("should not save apiid ", function(done){
    var model = new ThingModel({name: "some thing"});
    model.set({apiid: (new Date()).getTime()});

    model.save();
    assert(model.id);

    var model2 = new ThingModel({id: model.id});
    model2.fetch({
      success: function(){
        assert.equal(model2.get('name'), model.get('name'));
        assert(!model2.get('apiid'), 'should not save apiid');
        done();
      },
      error: done.bind(null, 'model2.fetch() failed')
    });
  });

  describe('Collection.fetch()', function() {
    it("should populate the collection", function(done){
      var coll = new ThingCollection();
      var model = new ThingModel({name: "some thing"});
      model.save(null, {
        success: function(){
          coll.fetch({
            success: function(){
              assert.equal(coll.length, 1);
              done();
            },
            error: done.bind(null, 'coll.fetch() failed')
          });
        },
        error: done.bind(null, 'model.save() failed')
      });
    });

    it("should work, even if Model.fetch() is called immediately after it", function(done) {
      var coll = new ThingCollection();
      var model = new ThingModel({name: "some thing"});
      model.save(null, {
        success: function(){
          var model2 = new ThingModel({id: model.id});
          var success = _.after(2, function() {
            assert.equal(coll.length, 1);
            assert.equal(model2.get("name"), "some thing");
            done();
          });
          coll.fetch({
            success: success,
            error: done.bind(null, 'coll.fetch() failed')
          });
          model2.fetch({
            success: success,
            error: done.bind(null, 'model.fetch() failed')
          });
        },
        error: done.bind(null, 'model.save() failed')
      });
    });
  });

  describe('Model.fetch()', function() {
    it("should update a single model", function(done) {
      var model = new ThingModel({name: "some thing"});
      model.save(null, {
        success: function(){
          var model2 = new ThingModel({id: model.id});
          model2.fetch({
            success: function() {
              assert.equal(model2.get("name"), "some thing");
              done();
            },
            error: done.bind(null, 'model2.fetch() failed')
          })
        },
        error: done.bind(null, 'model.save() failed')
      });
    });
  });

});

function teardown(done) {
  var coll = new ThingCollection();
  coll.fetch({
    success: function(){
      var success = _.after(coll.length, function(){
        done();
      });
      _.invoke(_.clone(coll.models), 'destroy', {
        success: success,
        error: done.bind(null, 'model.destroy() failed')
      });
    },
    error: done.bind(null, 'teardown fetch failed')
  });
}

function error(msg, model, resp){
  start();
  console.error(resp);
  ok(false, msg);
}

})(Backbone, _);