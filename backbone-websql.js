var WebSQLStore =// Support backward compatibility.
(function( window, Backbone, undefined ) {
// ====== [UTILS] ======
//function for generating "random" id of objects in DB
function S4() {
   return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
}

//function guid() {
//   return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
//}
// Generate a pseudo-GUID by concatenating random hexadecimals
//	matching GUID version 4 and the standard variant.
var VERSION_VALUE = 0x4;// Bits to set
var VERSION_CLEAR = 0x0;// Bits to clear
var VARIANT_VALUE = 0x8;// Bits to set for Standard variant (10x)
var VARIANT_CLEAR = 0x3;// Bits to clear
function guid() {
	var data3_version = S4();
	data3_version = (parseInt( data3_version.charAt( 0 ), 16 ) & VERSION_CLEAR | VERSION_VALUE).toString( 16 )
		+ data3_version.substr( 1, 3 );
	var data4_variant = S4();
	data4_variant = data4_variant.substr( 0, 2 )
		+ (parseInt( data4_variant.charAt( 2 ), 16 ) & VARIANT_CLEAR | VARIANT_VALUE).toString( 16 )
		+ data4_variant.substr( 3, 1 );
	return( S4() + S4() + '-' + S4() + '-' + data3_version + '-' + data4_variant + '-' + S4() + S4() + S4());
}

// ====== [ WebSQLStore ] ======

var WebSQLStore = function (db, tableName, initSuccessCallback, initErrorCallback) {
	this.tableName = tableName;
	this.db = db;
	var success = function (tx,res) {
		if(initSuccessCallback) initSuccessCallback();
	};
	var error = function (tx,error) {
		window.console.error("Error while create table",error);
		if (initErrorCallback) initErrorCallback();
	};
	//db.transaction (function(tx) {
	//	tx.executeSql("CREATE TABLE IF NOT EXISTS `" + tableName + "` (`id` unique, `value`);",[],success, error);
	//});
	this._executeSql("CREATE TABLE IF NOT EXISTS `" + tableName + "` (`id` unique, `value`);",null,success, error);
};
WebSQLStore.debug = false;
_.extend(WebSQLStore.prototype,{
	
	create: function (model,success,error) {
		//when you want use your id as identifier, use apiid attribute
		if(!model.attributes[model.idAttribute]) {
			// Reference model.attributes.apiid for backward compatibility.
			var obj = {};
			obj[model.idAttribute] = (model.attributes.apiid)?(model.attributes.apiid):(guid());
			model.set(obj);
		}

		this._executeSql("INSERT INTO `" + this.tableName + "`(`id`,`value`)VALUES(?,?);",[model.attributes[model.idAttribute], JSON.stringify(model.toJSON())], success, error);
	},
	
	destroy: function (model, success, error) {
		//window.console.log("sql destroy");
		var id = (model.attributes[model.idAttribute] || model.attributes.id);
		this._executeSql("DELETE FROM `"+this.tableName+"` WHERE(`id`=?);",[model.attributes[model.idAttribute]],success, error);
	},
	
	find: function (model, success, error) {
		//window.console.log("sql find");
		var id = (model.attributes[model.idAttribute] || model.attributes.id);
		this._executeSql("SELECT `id`, `value` FROM `"+this.tableName+"` WHERE(`id`=?);",[model.attributes[model.idAttribute]], success, error);
	},
	
	findAll: function (model, success,error) {
		//window.console.log("sql findAll");
		this._executeSql("SELECT `id`, `value` FROM `"+this.tableName+"`;",null, success, error);			
	},
	
	update: function (model, success, error) {
		//window.console.log("sql update")
		var id = (model.attributes[model.idAttribute] || model.attributes.id);
		this._executeSql("UPDATE `"+this.tableName+"` SET `value`=? WHERE(`id`=?);",[JSON.stringify(model.toJSON()), model.attributes[model.idAttribute]], success, error);
	},
	
	_save: function (model, success, error) {
		//window.console.log("sql _save");
		var id = (model.attributes[model.idAttribute] || model.attributes.id);
		this.db.transaction(function(tx) {
			tx.executeSql("");
		});
	},
	
	_executeSql: function (SQL, params, successCallback, errorCallback) {
		var success = function(tx,result) {
			if(WebSQLStore.debug) {window.console.log(SQL, params, " - finished");}
			if(successCallback) successCallback(tx,result);
		};
		var error = function(tx,error) {
			if(WebSQLStore.debug) {window.console.error(SQL, params, " - error: " + error)};
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
		window.console.warn("[BACKBONE-WEBSQL] model without store object -> ", model);
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
		window.console.error("sql error");
		window.console.error(error);
		window.console.error(tx);
		options.error(error);
	};
	
	switch(method) {
		case "read":	((model.attributes && model.attributes[model.idAttribute]) ? store.find(model,success,error) : store.findAll(model, success, error)); 
			break;
		case "create":	store.create(model,success,error);
			break;
		case "update":	store.update(model,success,error);
			break;
		case "delete":	store.destroy(model,success,error);
			break;
		default:
			window.console.error(method);
	}		
};
Backbone.WebSQLStore = WebSQLStore;
return( WebSQLStore );// Support backward compatibility.
})( window, Backbone );