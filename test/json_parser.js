

Ext.onReady(function(){
	use( ['Ext::ux::Json::Parser'], function(use){		
		plan({ tests: 2 });
		
		
//		diag('Basic operations:');
		var a = Ext.ux.Json.Parser.decode('{ test1 : "test1", test2 : ["A1","A2"]}');

 		is(a.test1,'test1', 'String parsed');		 	
 		ok(a.test2[0] == 'A1' && a.test2[1] == 'A2', 'Array parsed');

	});
});




//try {
//		
// 	/* test 1 */
// 	 	
// 	var t = document.createElement("div");
// 	t.innerHTML = "Test 1 passed";
// 	document.body.appendChild(t);
//
//
// 	/* test 2 */
// 	a = parse('{\
//		scope : this,\
//		handler : function (){\
//			handler\
//		},\
//		xtype : \'gmappanel\'\
// 	}');
//
// 	if (a.scope != 'this') throw "this block error";		 	
// 	if (!/function/.test(a.handler)) throw "Function block error";
//	if (!/handler/.test(a.handler)) throw "Function block error";
// 	
// 	var t = document.createElement("div");
// 	t.innerHTML = "Test 2 passed";
// 	document.body.appendChild(t);
//
//
// 	/* test 3 */
// 	a = parse('{\
//		scope : this.undefined_node,\
//		handler : function (){\
//			handler\
//		},\
//		xtype : \'gmappanel\'\
// 	}');
//
// 	if (a.scope != 'this.undefined_node') throw "this block error";		 	
// 	
// 	var t = document.createElement("div");
// 	t.innerHTML = "Test 3 passed";
// 	document.body.appendChild(t);
//
// 	/* test 4 */
// 	a = parse('{\
//		scope : this.undefined_node1.undefined_node2,\
//		handler : function (){\
//			handler\
//		},\
//		xtype : \'gmappanel\'\
// 	}');
//
// 	if (a.scope != 'this.undefined_node1.undefined_node2') throw "this block error";		 	
// 	
// 	var t = document.createElement("div");
// 	t.innerHTML = "Test 4 passed";
// 	document.body.appendChild(t);
//
//} catch (e){alert(e);}