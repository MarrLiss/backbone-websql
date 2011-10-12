// ====== [UTILS] ======
//function for generating "random" id of objects in DB
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

function guid() {
   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
}

// ====== [ WebSQLStore ] ======

var WebSQLStore = function (db, tableName, initSuccessCallback, initErrorCallback) {
	var success, error;
	this.tableName = tableName;
	this.db = db;
	success = function (tx,res) {
		if(initSuccessCallback) initSuccessCallback();
	};
	error = function (tx,error) {
		console.log("Error while create table",error);
		if (initErrorCallback) initErrorCallback();
	};
	db.transaction (function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS " + tableName + " (id unique, value)",[],success, error);
	});
};

_.extend(WebSQLStore.prototype,{
	
	create: function (model,success,error) {
		//when you want use your id as identifier, use apiid attribute
		if (model.attributes.apiid) {
			model.id = model.attributes.id = model.attributes.apiid;
		}
		else {
			model.id = model.attributes.id = guid();
		}

		this._executeSql("INSERT INTO " + this.tableName + " VALUES (?,?)",[model.id, JSON.stringify(model.toJSON())], success, error);
	},
	
	destroy: function (model, success, error) {
		//console.log("sql destroy");
		var id = (model.id || model.attributes.id);
		this._executeSql("DELETE FROM "+this.tableName+" WHERE id=?",[model.id],success, error);
	},
	
	find: function (model, success, error) {
		//console.log("sql find");
		var id = (model.id || model.attributes.id);
		this._executeSql("SELECT id, value FROM "+this.tableName+" WHERE id=?",[model.id], success, error);
	},
	
	findAll: function (model, success,error) {
		//console.log("sql findAll");
		this._executeSql("SELECT id, value FROM "+this.tableName,[], success, error);			
	},
	
	update: function (model, success, error) {
		//console.log("sql update")
		var id = (model.id || model.attributes.id);
		this._executeSql("UPDATE "+this.tableName+" SET value=? WHERE id=?",[JSON.stringify(model.toJSON()),model.id], success, error);
	},
	
	_save: function (model, success, error) {
		//console.log("sql _save");
		var id = (model.id || model.attributes.id);
		this.db.transaction(function(tx) {
			tx.executeSql("");
		});
	},
	
	_executeSql: function (SQL, params, successCallback, errorCallback) {
		var success = function(tx,result) {
			console.log(SQL + " - finished");
			if(successCallback) successCallback(tx,result);
		};
		var error = function(tx,error) {
			console.log(SQL + " - error: " + error);
			if(errorCallback) errorCallback(tx,error);
		};
		this.db.transaction(function(tx) {
			tx.executeSql(SQL, params, success, error);
		});
	}
});

// ====== [ Backbone.sync WebSQL implementation ] ======

Backbone.sync = function (method, model, options) {
	var store = model.store || model.collection.store, success, error;
	
	if (store == null) {
		console.warn("[BACKBONE-WEBSQL] model without store object -> ", model);
		return;
	}
	
	success = function (tx, res) {
		var len = res.rows.length,result, i;
		if (len > 0) {
			result = [];

			for (i=0;i<len;i++) {
				result.push(JSON.parse(res.rows.item(i).value));
			}
		} 
		
		options.success(result);
	};
	error = function (tx,error) {
		console.error("sql error");
		console.error(error);
		console.error(tx);
		options.error(error);
	};
	
	switch(method) {
		case "read":	(model.id ? store.find(model,success,error) : store.findAll(model, success, error)); 
			break;
		case "create":	store.create(model,success,error);
			break;
		case "update":	store.update(model,success,error);
			break;
		case "delete":	store.destroy(model,success,error);
			break;
		default:
			console.log(method);
	}		
};