/*global Ext document */
/*  
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This extension enables a panel to be directly created from Gui Designer Json
  * Dependend JavaScripts are loaded using ScriptLoader function
  ************************************************************************************
  *   This file is distributed on an AS IS BASIS WITHOUT ANY WARRANTY;
  *   without even the implied warranty of MERCHANTABILITY or
  *   FITNESS FOR A PARTICULAR PURPOSE.
  ************************************************************************************

  License: This source is licensed under the terms of the Open Source LGPL 3.0 license.
  Commercial use is permitted to the extent that the code/component(s) do NOT become
  part of another Open Source or Commercially licensed development library or toolkit
  without explicit permission.Full text: http://www.opensource.org/licenses/lgpl-3.0.html

  * Donations are welcomed: http://donate.webblocks.eu
  */

/**
 * Override Ext.Panel so that scope of keymap is always set to object when not set, 
 * instead of window 
 */
Ext.override(Ext.Panel,{
   // private
    getKeyMap : function(){
      if(!this.keyMap){
        if(Ext.isArray(this.keys)){          
          for(var i = 0, len = this.keys.length; i < len; i++){
            this.keys[i].scope = this.keys[i].scope || this;
          }
        } else if (this.keys && !this.keys.scope) this.keys.scope = this;
        this.keyMap = new Ext.KeyMap(this.el, this.keys);
      }
      return this.keyMap;
    }
});

/**
 * A Synchronized Content loader for data from url
 * @param {String} url The url to load synchronized
 * @param {Boolean} cachingOff Should caching of file be disabled
 * @param {Boolean} responseXML Should responseXML be returned instead of responseText
 * @return {Boolean/String/XMLObject} When there was a error False otherwise response base on responseXML flag
 */
Ext.ux.SyncLoader = function(url,cachingOff,responseXML) {
 var activeX = Ext.lib.Ajax.activeX;
 var isLocal = (document.location.protocol == 'file:');
 var conn;
 
 try { 
  if(Ext.isIE7 && isLocal){throw("IE7forceActiveX");}
  conn = new XMLHttpRequest();
 } catch(e)  {
   for (var i = 0; i < activeX.length; ++i) {
     try {conn = new ActiveXObject(activeX[i]); break;} catch(e) {}
   }
 }
 //Should we disable caching
 if (!cachingOff)
    url += (url.indexOf('?') != -1 ? '&' : '?') + '_dc=' + (new Date().getTime());
 try {
  conn.open('GET', url , false);
  conn.send(null);
  if ((isLocal && conn.responseText.length!=0) || (conn.status !== undefined && conn.status>=200 && conn.status< 300)) {
    return responseXML ? conn.responseXML : conn.responseText;
  }
 } catch (e) {}
 return false;
} 

/**
 * Function used to load a JavaScript into a document.head element
 * the id of the script item is the name of the file.
 * @param {String} url The url to load javascript from
 * @param {Boolean} cachingOff Should caching of javascript files be disabled
 * @return {Boolean} Indicator if load went corretly true/false
 */
Ext.ux.ScriptLoader = function(url,cachingOff) {
 if(url && !document.getElementById(url)) {
   var content = Ext.ux.SyncLoader(url,cachingOff);
   if (content===false) return false;
   var head = document.getElementsByTagName("head")[0];
   var script = document.createElement("script");
   try {
     script.text = content;
   } catch (e) {
     script.appendChild(content);
   }
   script.setAttribute("type", "text/javascript");
   script.setAttribute("id", url);
   head.appendChild(script);
 }
 return true;
} 


/**
 * A class 
 */
Ext.ux.JSON = new (function(){
  return {
   /** 
    * The string used to indent   
    * @type {String} 
    @cfg */
    indentString : '  ',

   /** 
    * Should caching be disabled when JSON are loaded (defaults false).   
    * @type {Boolean} 
    @cfg */
    disableCaching:false, 

   /**
    * @private Tag added to json code so whe can see begining of code  
    */
    scriptStart  : '/*BEGIN*/',

   /**
    * @private Tag added to json code so whe can see ending of code
    */
    scriptEnd    : '/*END*/',
    /**
     * @private Indicator if object hasOwnProperty
     */
    useHasOwn : ({}.hasOwnProperty ? true : false),

    /**
     * Load one or more javascripts. Is trigger by root element window.required_js in json file. 
     * The javascripts are synchonrized load before the JSON is evaluated. Base on the config item
     * disableCaching (defaults true) the url of the javascript to load is made unique with parameter _dc.
     * @param {String} list A comma seperated list of javascripts to load
     */
    required_js : function(list) {   
     if (!list) return;
     var files = list.split(',');
     for (var f=0;f<files.length;f++) {
       if (!Ext.ux.ScriptLoader(files[f],this.disableCaching)) {
          Ext.Msg.alert('Failure','Failed to load javascript '+ files[f]);
       }
     }
    },

    /**
     * Load one or more stylesheets. Is triggered by root element window.required_css in json file
     * @param {String} list A comma seperated list of stylesheets to load
     */
    required_css : function(list) {
      if (!list) return;
      var files = list.split(',');
      for (var f=0;f<files.length;f++) {    
        if(document.getElementById(files[f])) {continue;}
        Ext.util.CSS.swapStyleSheet(files[f], files[f]);
     }
    },

    /**
     * @private Encode a string to Json
     * @param {String} s The string to encode
     * @return {String} A string containing the encode string 
     */
    encodeString : function(s){
       var m = {"\b": '\\b',"\t": '\\t',"\n": '\\n',"\f": '\\f',"\r": '\\r','"' : '\\"',"\\": '\\\\'};
       if (/["\\\x00-\x1f]/.test(s)) { //"
           return '"' + s.replace(/([\x00-\x1f\\"])/g, function(a, b) { //"
               var c = m[b];
               if(c){ return c; }
               c = b.charCodeAt();
               return "\\u00" +
                   Math.floor(c / 16).toString(16) +
                   (c % 16).toString(16);
           }) + '"';
       }
       return '"' + s + '"';
     },

     /**
      * @private Create a indent so code is readable
      * @param {Int} n The indent length
      * @return {String} A string containing n spaces
      */
     indentStr : function(n) {
       var str = "", i = 0;
       while (i<n) {
         str += this.indentString;
         i++;
       }
       return str;
     },  

     /**
      * @private Encode an Array to Json
      * @param {Array} o The array to encode
      * @param {Int} indent The indent to uses (defaults 0)
      * @param {Boolean} notags Should code be wrapped between scriptStart and scriptEnd
      * @return {String} The array encode as string
      */
     encodeArray  : function(o, indent,notags){
       indent = indent || 0;
       var a = ["["], b, i, l = o.length, v;
       for (i = 0; i < l; i += 1) {
         v = o[i];
         switch (typeof v) {
           case "undefined":
           case "unknown":
               break;
           default:
               if (b) a.push(',');
               a.push(v === null ? "null" : this.encode(v, indent + 1));
               b = true;
         }
       }
       a.push("]");
       return a.join("");
     },

     /** 
      * @private Encode a date to json 
      * @param {Date} o The date object to encode
      * @return {String} The data encode as string
      */
     encodeDate : function(o){
       var pad = function(n) { return n < 10 ? "0" + n : n; };
       return '"' + o.getFullYear() + "-" +
               pad(o.getMonth() + 1) + "-" +
               pad(o.getDate()) + "T" +
               pad(o.getHours()) + ":" +
               pad(o.getMinutes()) + ":" +
               pad(o.getSeconds()) + '"';
     },

     /** 
      * Customer encode decode and recode, enabling reading and writing of JSON files with javascript code
      * @param {Object} o The object to encode
      * @param {Int} indent The indent to uses (defaults 0)
      * @return {String} The object encode as string
      */  
    encode : function(o, indent){
       indent = indent || 0;
       if(typeof o == "undefined" || o === null){
           return "null";
       }else if(o instanceof Array){
           return this.encodeArray(o, indent);
       }else if(o instanceof Date){
           return this.encodeDate(o);
       }else if(typeof o == "number"){
           return isFinite(o) ? String(o) : "null";
       }else if(typeof o == "string" && !isNaN(o) ){
           return o; 
       } else if(typeof o == "string"){
           return this.encodeString(o);
       }else if(typeof o == "boolean"){
           return String(o);
       }else {
         var a = ["{\n"], b, i, v;
         for (i in o) {
           if(!this.useHasOwn || o.hasOwnProperty(i)) {
             v = o[i];
             switch (typeof v) {
               case "function":
                 if(b) a.push(',\n'); 
                 a.push(this.indentStr(indent), i, " : ", this.scriptStart,""+v,this.scriptEnd);
                 b = true;
                 break;
               case "undefined":
               case "unknown":
                   break;
               default:
                   if(b) a.push(',\n');
                   a.push(this.indentStr(indent), i, " : ",
                           v === null ? "null" : this.encode(v, indent + 1));
                   b = true;
             }
           }
         }
         a.push("\n" + this.indentStr(indent-1) + "}");
         return a.join("");
       }
     },

     /**
      * Decode json evaluating Json tag (required_js,required_css) 
      * @param {String} value The string to decode
      * @return {Object} The decoded object
      */
     decode : function(json) {
      if (!json) return;
      /* Encode all functions between begin and end as string enabling load of packages */
      var value = json
      var v = '', s = value.indexOf(this.scriptStart);
      while (s!=-1) {
        e = value.indexOf(this.scriptEnd,s);
        v += value.substring(0,s);
        v += this.encodeString(value.substring(s+this.scriptStart.length,e));
        value = value.substring(e+this.scriptEnd.length);
        s=value.indexOf(this.scriptStart);
      }
      v += value;   

      var scope = this.scope || this; //Create reference object for json    
      var items = eval("(" + v + ")");
      if(items && items.json) { 
        this.required_css(items.json.required_css);                    
        this.required_js(items.json.required_js);
      }
      //Now we can do decode by using eval setting scope
      items = eval("(" + json + ")"); 
      return items;
    },

    /**
     * Function used to clone a object
     * @param {Object} o the object to be cloned
     * @return {Object} The cloned object
     */
    clone : function(o) {
      return this.decode(this.encode(o));
    }
  }
})();

/**
 * Component extending a panel giving it the capability to read or create a JSON file.
 * When using Json file created with designer this JsonPanel will also evaluate the special items 
 * under Json root called <b>winbow</b>. The JsonPanel currently evaluates two special window items 
 * called <i>required_js,required_css</i> that enable loading of javascripts and stylesheets directly from the json.
 *
 *<p>Example how to create a Json from a external file filling the browser:</p>
 * <pre><code>new Ext.Viewport({
     items : new Ext.ux.JsonPanel({autoLoad:'json/designer.json'}),
     layout: 'fit'
   }).show();</code></pre>
 *<p>Example how to (re)load a JsonPanel that is allready loaded:</p>
 * <pre><code>this.load({url:'new url'});</code></pre>   
 * <p><b>IMPORTANT:</b>When you want use the JsonPanel to load a Json file in a local browser make sure that you include a
 * local xhr package like <a href="http://extjs.com/forum/showthread.php?t=10672">localXHR</a> or any other
 * to fix the problem of ExtJs not supporting Ajax from local file system</p>
 * @type component
 */
 
Ext.ux.JsonPanel = Ext.extend(Ext.Panel,Ext.applyIf({
 
 //@private Layout is by default fit
 layout: 'fit',
 
 //@private Border is by default false
 border: false,
 
 //@private Whe only read a JSON file once
 single:true,  //only needed once
 
 /**
  * @private Init the JSON Panel making sure caching is set depending on disableCaching 
  */
 initComponent : function(){
   if (this.autoLoad) {
     if (typeof this.autoLoad !== 'object')  this.autoLoad = {url: this.autoLoad};
     if (typeof this.autoLoad['nocache'] == 'undefined') this.autoLoad['nocache'] = this.disableCaching;
   }                
   Ext.ux.JsonPanel.superclass.initComponent.call(this);
   
   this.addEvents({
     /**
      * Fires after the jsonfile is retrived from server but before it's loaded in panel
      * @event beforejsonload
      * @param {Object} response The response object returned
      * @param {Exception} e The exception when avialable
      */
    'beforejsonload' : true,
     /**
      * Fires after panel the panel is loaded with new content
      * @event afterjsonload
      */
    'afterjsonload'  : true,
     /**
      * Fires when loading of jsonfile fails
      * @event afterjsonload
      */
    'failedjsonload' : false
   });
 },
 
 /**
  * Function called with config object of json file
  * @param {Object} config The config object that can be applied
  */
 jsonInit : function (config) {
   Ext.apply(this,config);
 },

 /**
  * @private We override the render function of the panel, so that the updater.renderer is changed to accept JSON
  * @param {Component} ct The component to render
  * @param {Object} position A object containing the position of the component
  */
 onRender : function(ct, position){
  Ext.ux.JsonPanel.superclass.onRender.call(this, ct, position);
  var um = this.getUpdater();
  um.showLoadIndicator = false; //disable it.
  um.on('failure',function(el, response){this.fireEvent('failedjsonload',response)}.createDelegate(this));
  um.setRenderer({render:
       function(el, response, updater, callback){
     //add item configs to the panel layout
        //Load the code to check if we should javascripts
        this.fireEvent('beforejsonload', response);
        try { 
          var items = this.decode(response.responseText); 
          if (items) {
            this.jsonInit(items.json);
            delete items.json;
            //Clear out orignal content
            while (this.items.first()) {this.remove(this.items.first(), true);}
            for (var i=0;i<this.items.items.length;i++) {this.remove(this.items.items[i],true)};
            if(items instanceof Array) {
              this.add.apply(this,items);
            } else {
             this.add(items);
            }
          }
          this.fireEvent('afterjsonload');
          this.doLayout();
          if(callback) {callback();}
        } catch (e) {
          if (!this.fireEvent('afterjsonload',response,e))
             Ext.Msg.alert('Failure','Failed to decode load Json:' + e)
        }
      }.createDelegate(this)
    });  
  }

},Ext.ux.JSON));
//Register the panel
Ext.reg('jsonpanel', Ext.ux.JsonPanel);


/* FOR NOW WE COPY CODE TO ALSO HAVE A WINDOW, WE NEED TO FIND A SOLUTION */

Ext.ux.JsonWindow = Ext.extend(Ext.Window,Ext.applyIf({
 
 //@private Layout is by default fit
 layout: 'fit',
 
 //@private Border is by default false
 border: false,
 
 //@private Whe only read a JSON file once
 single:true,  //only needed once
 
 /**
  * @private Init the JSON Panel making sure caching is set depending on disableCaching 
  */
 initComponent : function(){
   if (this.autoLoad) {
     if (typeof this.autoLoad !== 'object')  this.autoLoad = {url: this.autoLoad};
     if (typeof this.autoLoad['nocache'] == 'undefined') this.autoLoad['nocache'] = this.disableCaching;
   }                
   Ext.ux.JsonWindow.superclass.initComponent.call(this);
   
   this.addEvents({
     /**
      * Fires after the jsonfile is retrived from server but before it's loaded in panel
      * @event beforejsonload
      * @param {Object} response The response object returned
      * @param {Exception} e The exception when avialable
      */
    'beforejsonload' : true,
     /**
      * Fires after panel the panel is loaded with new content
      * @event afterjsonload
      */
    'afterjsonload'  : true,
     /**
      * Fires when loading of jsonfile fails
      * @event afterjsonload
      */
    'failedjsonload' : false
   });
 },
 
 /**
  * Function called with config object of json file
  * @param {Object} config The config object that can be applied
  */
 jsonInit : function (config) {
   Ext.apply(this,config);
 },

 /**
  * @private We override the render function of the panel, so that the updater.renderer is changed to accept JSON
  * @param {Component} ct The component to render
  * @param {Object} position A object containing the position of the component
  */
 onRender : function(ct, position){
  Ext.ux.JsonWindow.superclass.onRender.call(this, ct, position);
  var um = this.getUpdater();
  um.showLoadIndicator = false; //disable it.
  um.on('failure',function(el, response){this.fireEvent('failedjsonload',response)}.createDelegate(this));
  um.setRenderer({render:
       function(el, response, updater, callback){
     //add item configs to the panel layout
        //Load the code to check if we should javascripts
        this.fireEvent('beforejsonload', response);
        try { 
          var items = this.decode(response.responseText); 
          if (items) {
            this.jsonInit(items.json);
            delete items.json;
            //Clear out orignal content
            while (this.items.first()) {this.remove(this.items.first(), true);}
            for (var i=0;i<this.items.items.length;i++) {this.remove(this.items.items[i],true)};
            if(items instanceof Array) {
              this.add.apply(this,items);
            } else {
             this.add(items);
            }
          }
          this.fireEvent('afterjsonload');
          this.doLayout();
          if(callback) {callback();}
        } catch (e) {
          if (!this.fireEvent('afterjsonload',response,e))
             Ext.Msg.alert('Failure','Failed to decode load Json:' + e)
        }
      }.createDelegate(this)
    });  
  }

},Ext.ux.JSON));

//Register the window
Ext.reg('jsonwindow', Ext.ux.JsonWindow);
