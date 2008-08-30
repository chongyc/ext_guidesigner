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
 * Override Ext.FormPanel so that in case whe create a form without items from a json
 * it still has a item list.
 */
Ext.override(Ext.FormPanel, {
    // private
    initFields : function(){
        //BEGIN FIX It can happend that there is a form created without items (json)
        this.initItems(); 
        //END FIX
        var f = this.form;
        var formPanel = this;
        var fn = function(c){
            if(c.doLayout && c != formPanel){
                Ext.applyIf(c, {
                    labelAlign: c.ownerCt.labelAlign,
                    labelWidth: c.ownerCt.labelWidth,
                    itemCls: c.ownerCt.itemCls
                });
                if(c.items){
                    c.items.each(fn);
                }
            }else if(c.isFormField){
                f.add(c);
            }
        }
        this.items.each(fn);
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
 * A class used by JsonPanel and JsonWindow to load a jsonFile
 */
Ext.ux.Json = Ext.extend(Ext.util.Observable,{
    /**
     * Boolean indicator when true loadMsg will be shown
     @cfg */
    loadMask: true,
    /**
     * The loading message
     @cfg */
    loadMsg: 'Loading...',
    /**
     * Mask used for loading message
     @cfg */
    msgCls : 'x-mask-loading',
   
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
     * The custom licenseText that should be added to each JSON File Created
     * @type {String}
     @cfg */
    licenseText  : null,
    
    /**
     * @private Indicator if object hasOwnProperty
     */
    useHasOwn : ({}.hasOwnProperty ? true : false),
    
    //@private The internal tag used to create unique, when null no id is generated
    jsonId : null, 
    //@private Last id used to create json
    lastJsonId : 0,
    
    /**
     * Load one or more javascripts. Is trigger by root element window.required_js in json file. 
     * The javascripts are synchonrized load before the JSON is evaluated. Base on the config item
     * disableCaching (defaults true) the url of the javascript to load is made unique with parameter _dc.
     * @param {String} list A comma seperated list of javascripts to load
     */
    setRequired_js : function(list) {   
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
    setRequired_css : function(list) {
      if (!list) return;
      var files = list.split(',');
      for (var f=0;f<files.length;f++) {    
        if(document.getElementById(files[f])) {continue;}
        Ext.util.CSS.swapStyleSheet(files[f], files[f]);
     }
    },


    /**
    * Function called with config object of json file
    * @param {Object} config The config object that can be applied
    * @return {Boolean} indicator if all changes where set
    */
    jsonInit : function (config,element,scopeOnly) {
     var allSet = true, el = element || this;
     if (config) {
      for (var i in config) {       
        var j = i;
          if (i=='required_js') { 
            this.setRequired_js(config[i]);
          } else if (i=='required_css') {
             this.setRequired_css(config[i]);
          } else {
            var applyTo = el;
            //When scope of var set if
            if (i.indexOf('scope.')==0) {
               j = i.substring(6);
               applyTo = this.getJsonScope();
            } else if (scopeOnly) continue;
            var k = 'set' + j.substring(0,1).toUpperCase() + j.substring(1);
            try {
              if (applyTo[k] && typeof applyTo[k] == 'function') {
                applyTo[k].call(el,config[i]);
              } else if (applyTo[j] && typeof applyTo[j] == 'function') {
                applyTo[j].call(el,config[i]);
              } else {
                applyTo[j] = config[i];
              }
            } catch (e) {
              allSet = false;
            }
          }
      }
     }
     return allSet;
    },
    
    /**
     * Check if a object is empty
     */
    isEmptyObject : function(obj) {
     for (var i in obj) {if (i!=this.jsonId)  return false;}
     return true;
    },

    /**
      * Clean null elements from json object
      */
     deleteJsonNull : function(json) {
       var c=0;      
       for (var k in json) {
         if(!this.useHasOwn || json.hasOwnProperty(k)) {
           if (k=='items') {
             if (json[k] instanceof Array) {
              var n =[];
              for (var i=0,a=json[k];i<a.length;i++) {
                var o = this.deleteJsonNull(a[i]);
                if (o!=null) n.push(o); 
              }
              json[k] = (n.length>0) ? n : null; 
             } else json[k]=this.deleteJsonNull(json[k]);
           }
           if (json[k]===null) {
             delete json[k];
           } else {
             c++;
           }
         }
       }
       return c ? json : null;
     },

    
   /**
    * Apply the Json to given element
    * @param {Object/String} json The json to apply
    * @param {Element} element The element to apply the json to
    * @return {Object} The elements applied
    */
    applyJson : function (json,element) {
     var el = element || this;
     try {
       if (this.loadMask && el.ownerCt) el.ownerCt.el.mask(this.loadMsg, this.msgCls);
       var items = this.jsonId ? this.editableJson(json) : json || {};
       if (typeof(items) !== 'object') items = this.decode(json);
       if (items) {
         items = this.deleteJsonNull(items);        
         //Apply global json vars to element
         if (el instanceof Ext.Container) {
           //Clear out orignal content of container
           while (el.items && el.items.first()) {el.remove(el.items.first(), true);}
           if (items instanceof Array) {
             el.add.apply(el,items);
           } else if (!this.isEmptyObject(items)) { 
             el.add(items);
           }
         } else {
           this.jsonInit(items,el);
         }
       }
      if (el.rendered && el.layout && el.layout.layout) el.doLayout();     
     } catch (e) {   
      throw e;
     } finally {
      if (this.loadMask && el.ownerCt) el.ownerCt.el.unmask();
     }
      return items;
    },
    
   /**
    * Convert a Json to a editableJson by adding an edtiableId when set
    * @param {Object/String} json The json to add an id to
    * @param {Object} id The id object used to give id
    * @return {Object} The decoded object with id
    */
    editableJson : function(json) {
     var items = json || {};
     if (typeof(items) !== 'object') items = this.decode(json);
     if (items instanceof Array) {
       for (var i=0;i<items.length;i++) {
        items[i]=this.editableJson(items[i]);
       }
       return items;
     }
     if (this.jsonId) {
       if (!items[this.jsonId]) {
         items[this.jsonId]=Ext.id();
       }
       for (var k in items) {      
         if (k.indexOf(this.jsonId)==0 && k!=this.jsonId) {
           var orgK = k.substring(this.jsonId.length);
           if (orgK && typeof(items[orgK])=='undefined') items[orgK]=null; //Code is there but not key, create it
         } else if (!items[this.jsonId + k ]) {
           if (typeof(items[k]) == 'function') {
             items[this.jsonId + k]=String(items[k]);
           } else if (typeof(items[k]) == 'object' && k!='items') {
            items[this.jsonId + k] = this.encode(items[k]);
           } 
         } 
       }
       if (items.items) items.items=this.editableJson(items.items);
     }
     return items;
    },

    /**
     * @private Encode a string to Json
     * @param {String} s The string to encode
     * @return {String} A string containing the encode string 
     */
    encodeString : function(s){
       var m = {"\b": '\\b',"\t": '\\t',"\n": '\\n',"\f": '\\f',"\r": '\\r','"' : '\\"',"\\": '\\\\'};
       if (/["\\\x00-\x1f]/.test(s)) { //"
           return '"'  + s.replace(/([\x00-\x1f\\"])/g, function(a, b) { //"
               var c = m[b];
               if(c){ return c; }
               c = b.charCodeAt();
               return "\\u00" +
                   Math.floor(c / 16).toString(16) +
                   (c % 16).toString(16);
           })  + '"';
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
      * @return {String} The array encode as string
      */
     encodeArray  : function(o,indent,keepJsonId){
       indent = indent || 0;
       var a = ["["], b, i, l = o.length, v;
       for (var i = 0; i < l; i += 1) {
         v = o[i];
         switch (typeof v) {
           case "undefined":
           case "unknown":
               break;
           default:
               if (b) a.push(',');
               a.push(v === null ? "null" : this.encode(v, indent + 1,keepJsonId));
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
    encode : function(o,indent,keepJsonId,noLicense){       
       indent = indent || 0;
       if(typeof o == "undefined" || o === null){
           return "null";
       }else if(o instanceof Array){
           return this.encodeArray(o, indent,keepJsonId);
       }else if(o instanceof Date){
           return this.encodeDate(o);
       }else if(typeof o == "number"){
           return isFinite(o) ? String(o) : "null";
       }else if(typeof o == "string" && !isNaN(o) && o!='' ){
           return o; 
       } else if(typeof o == "string" && ['true','false'].indexOf(o)!=-1){
          return o;
       } else if(typeof o == "boolean") {
           return String(o);
       } else if(typeof o == "string"){
           return this.encodeString(o);
       }else {        
         var a = [], b, i, v;
         //Check if whe should create a license text
         if (indent==0 && !noLicense) {
          if (this.licenseText) a.push(this.licenseText + "\n");
         }
         a.push("{\n");
         for (var i in o) {
           v = o[i];   
           
           //Check if key (i) is an internal jsonId and original is empty then use this
           if (i.indexOf(this.jsonId)==0 && (!keepJsonId || i!=this.jsonId)) {
             var orgK = i.substring(this.jsonId.length);
             
             if (orgK && typeof(o[orgK])=='undefined' && v) {
                if(b) a.push(',\n'); 
                a.push(this.indentStr(indent), orgK, " : ", v);
                b = true;
             }
             continue; //internal id skip it during encode
           }
           //Create code for item
           if(!this.useHasOwn || o.hasOwnProperty(i)) {
             if (this.jsonId && o[this.jsonId + i]) {
                 if(b) a.push(',\n'); 
                 a.push(this.indentStr(indent), i, " : ", o[this.jsonId + i]);
                 b = true;
             } else {               
               switch (typeof v) {
                 case "undefined":
                 case "unknown":               
                     break;            
                 case "function":
                   if(b) a.push(',\n'); 
                   a.push(this.indentStr(indent), i, " : ", ""+v);
                   b = true;
                   break;
                 case "object" :
                 case "string" :
                    if (!v) break; //Skip empty string and objects else default
                 default:
                     if(b) a.push(',\n');
                     a.push(this.indentStr(indent), i, " : ",
                           v === null ? "null" : this.encode(v,indent + 1,keepJsonId));
                     b = true;
               }
             }
           }
         }
         a.push("\n" + this.indentStr(indent-1) + "}");
         return a.join("");
       }
     },
     
     /**
      * Function returning the scope to beused for the json
      * @return {Object} 
      */
     getJsonScope : function(){
       return  this.jsonScope || this.scope || this;  
     },     
     
     /**
      * Decode function for parsing json text into objects
      * The parsing contains four stages. 
      * First stage the json is parsed and code is transformed into strings and evaluated
      * Second stage All empty objects are removed
      * Third stage the json key (if exists) is evaluated 
      *   to check if stylesheets or javascipt or scipe objects should be loaded
      * Fourth stage the code objects are checked if there code should be stored __json__[key]
      * @param {String} text The string to decode
      * @return {Object} The decoded object
      */
     decode : function(text) {
          var at = 0;
          var ch = ' ';
          var self = this;
          var isCode = false;
          var lastCode;
     
          function error(m) {
              var e = new SyntaxError(m);
              e.at = at - 1;
              e.text = text;
              throw e;
          }
     
          function next() {
              ch = text.charAt(at);
              at += 1;
              return ch;
          }
          
          function prev(count) {
              at -= count ? count : 1;
              ch = text.charAt(at);
              at += 1;
              return ch;
          }
     
          function wordMatch(word,offset) {
            if (typeof(offset)=='undefined') offset = -1;
            var i=0;
            for (;i<word.length && text.charAt(at+i+offset)==word.charAt(i);i++) {}
            if (i>=word.length) {
              at += offset+i;
              next();
              return true;
            }
            return false;
          }
     
          function white() {
              while (ch) {
                  if (ch <= ' ') {
                      next();
                  } else if (ch == '/') {
                      switch (next()) {
                          case '/':
                              while (next() && ch != '\n' && ch != '\r') {}
                              break;
                          case '*':
                              next();
                              for (;;) {
                                  if (ch) {
                                      if (ch == '*') {
                                          if (next() == '/') {
                                              next();
                                              break;
                                          }
                                      } else {
                                          next();
                                      }
                                  } else {
                                      error("Unterminated comment");
                                  }
                              }
                              break;
                          default:
                              prev(2);
                              return;
                      }
                  } else {
                      break;
                  }
              }
          }
     
          function singleWord(){
            var s = ch;
            while (next() && ": \t\n\r.-+={(".indexOf(ch)==-1) {s+= ch}
            return s;
          }
     
          function string(qoute) {
              qoute = qoute || ch;
              var start=at-1,i, s = '', t, u;
     
              if (ch == qoute) {
      outer:          while (next()) {
                      if (ch == qoute) {
                          next();
                          return s;
                      } else if (ch == '\\') {
                          switch (next()) {
                          case 'b':
                              s += '\b';
                              break;
                          case 'f':
                              s += '\f';
                              break;
                          case 'n':
                              s += '\n';
                              break;
                          case 'r':
                              s += '\r';
                              break;
                          case 't':
                              s += '\t';
                              break;
                          case 'u':
                              u = 0;
                              for (i = 0; i < 4; i += 1) {
                                  t = parseInt(next(), 16);
                                  if (!isFinite(t)) {
                                      break outer;
                                  }
                                  u = u * 16 + t;
                              }
                              s += String.fromCharCode(u);
                              break;
                          default:
                              s += ch;
                          }
                      } else {
                          s += ch;
                      }
                  }
              }
              error("Bad string " + text.substring(start,at-1));
          }
     
          function array(asCode) {
              var start=at-1,a = [];
     
              if (ch == '[') {
                  next();
                  white();
                  if (ch == ']') {
                      next();
                      return a;
                  }
                  while (ch) {
                      a.push(value(asCode));
                      white();
                      if (ch == ']') {
                          next();
                          return a;
                      } else if (ch != ',') {
                          break;
                      }
                      next();
                      white();
                  }
              }
              error("Bad array " + text.substring(start,at-1));
          }
     
          function object(asCode) {
              var start=at-1,k, o = {};
     
              if (ch == '{') {
                  next();
                  white();
                  if (ch == '}') {
                      next();
                      return o;
                  }
                  while (ch) {
                      k = ch=='"' || ch=="'" ? string() : singleWord();
                      white();
                      if (ch != ':') {
                          break;
                      }
                      next();
                      white();
                      start = at-1;
                      o[k] = value(k!='items');
                      if (o[k]===null) {
                        //Phase two remove empty object results
                        delete o[k];
                      } else if (isCode && k!='items') { 
                         //Phase four save readable code for editing
                         if (self.jsonId) o[self.jsonId + k] = lastCode;
                         //Phase three load javascript, stylesheet and evalute scope objects
                         if (k=='json') self.jsonInit(o[k]);
                      }
                      
                      white();
                      if (ch == '}') {
                          next();
                          return o;
                      } else if (ch != ',') {
                          break;
                      }
                      next();
                      white();
                  }
              }
              error("Bad object ["+k+"]" + text.substring(start,at-1));
          }
     
          function number() {
              var n = '', v;
              if (ch == '-') {
                  n = '-';
                  next();
              }
              while (ch >= '0' && ch <= '9') {
                  n += ch;
                  next();
              }
              if (ch == '.') {
                  n += '.';
                  while (next() && ch >= '0' && ch <= '9') {
                      n += ch;
                  }
              }
              if (ch == 'e' || ch == 'E') {
                  n += 'e';
                  next();
                  if (ch == '-' || ch == '+') {
                      n += ch;
                      next();
                  }
                  while (ch >= '0' && ch <= '9') {
                      n += ch;
                      next();
                  }
              }
              v = +n;
              if (!isFinite(v)) {
                  ////error("Bad number");
              } else {
                  return v;
              }
          }
     
          function codeBlock(breaker){
            while (next()) {
              white();
              switch (ch) {
                case breaker :
                  return;
                case '(' :
                  codeBlock(')');
                  break;
                case '[' :
                  codeBlock(']');
                  break;
                case '{' :
                  codeBlock('}');
                  break;
                case '"' :
                case "'" :
                  string();
                  at--;
              }
            }
          }
          
          function code(){
            //Search for , or } ]
            at--; //restart code block
            var start = at;
            var wat;
            while (next()){
              wat = at;
              white();
              switch (ch) {
                case '(' :
                  codeBlock(')');
                  break;
                case '[' :
                  codeBlock(']');
                  break;
                case '{' :
                  codeBlock('}');
                  break;
                case '"' :
                case "'" :
                  string();
                  break;
                case ',' :
                case ']' :
                case '}' :
                  lastCode = text.substring(start,wat-1);
                  try {
                    var scope = self.getJsonScope();
                    return eval("(" + lastCode + ")");
                  } catch (e) {                    
                    error("Invalid code:" + lastCode);
                  }
                  
              }
            }
          }
     
          function other() {
              if (wordMatch('true')) return true;
              else if (wordMatch('false')) return false;
              else if (wordMatch('null')) return null;
              else {
                var c = code();
                isCode=true;
                return c;
              }
          }
     
          function value(asCode) {
              isCode=false;
              white();
              switch (ch) {
                  case '{':
                    return asCode ? other() : object(asCode);
                  case '[' :
                    return asCode ? other() : array(asCode);
                  case '"':
                  case "'":
                      return string(ch);
                  default:
                      return "-.0123456789".indexOf(ch)>=0 ? number() : other();
              }
          }          
        var v = value(false);
        white();
        if (ch) error("Invalid Json");
        return v;
     },
          
    /**
     * Function used to clone a object
     * @param {Object} o the object to be cloned
     * @return {Object} The cloned object
     */
    clone : function(o) {
      return this.decode(this.encode(o));
    }
});

/**
 * Create global object 
 */
Ext.ux.JSON = new Ext.ux.Json();

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
  * @private We override the render function of the panel, so that the updater.renderer is changed to accept JSON
  * @param {Component} ct The component to render
  * @param {Object} position A object containing the position of the component
  */
 onRender : function(ct, position){
  Ext.ux.JsonPanel.superclass.onRender.call(this, ct, position);
  var um = this.getUpdater();
  um.showLoadIndicator = false; //disable it.
  um.on('failure',function(el, response){
    this.ownerCt.el.unmask();
    this.fireEvent('failedjsonload',response)
  }.createDelegate(this));
  um.on('beforeupdate',function(el, url, params) {
   if (this.loadMask && this.ownerCt)
     this.ownerCt.el.mask(this.loadMsg, this.msgCls);
  }.createDelegate(this));
 
  um.setRenderer({render:
       function(el, response, updater, callback){
     //add item configs to the panel layout
        //Load the code to check if we should javascripts
        this.fireEvent('beforejsonload', response);
        try { 
          this.applyJson(response.responseText);           
          this.fireEvent('afterjsonload');
          this.ownerCt.el.unmask();

          if(callback) {callback();}
        } catch (e) {
          this.ownerCt.el.unmask();
          if (!this.fireEvent('afterjsonload',response,e))
             Ext.Msg.alert('Failure','Failed to decode load Json:' + e)
        }
      }.createDelegate(this)
    });  
  }

},Ext.ux.JSON));
//Register the panel
Ext.reg('jsonpanel', Ext.ux.JsonPanel);


/**
 * JsonWindow implements a way to load a json directly into a window
 * The window config elements of this window for example x,y can be set 
 * by specifing the values in the json tag
 */
Ext.ux.JsonWindow = Ext.extend(Ext.Window,Ext.applyIf({
 
 //@private Window is hidden by moving X out of screen
 x     : -1000,
 //@private Window is hidden by moving Y out of screen
 y     : -1000,
 
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
  * Set the x position of window
  * @param x {number} the postion in pixels
  */
 setX : function(x) {
   this.setPosition(x,this.y);
 },
 
 /**
  * Set the y position of window
  * @param y {number} the postion in pixels
  */
 setY : function(y) {
    this.setPosition(this.x,y);
 },
 
 //@private internal function to call allignTo with array
 setAlignTo : function(arg) {
   this.alignTo(arg[0],arg[1],arg[2]);
 },
 
 //@private internal function to call anchorTo with array
 setAnchorTo : function(arg) {
   this.anchorTo(arg[0],arg[1],arg[2],arg[3]);
 },
 
  
 /**
  * @private We override the render function of the panel, so that the updater.renderer is changed to accept JSON
  * @param {Component} ct The component to render
  * @param {Object} position A object containing the position of the component
  * @see For more information about usages see jsonpanel
  */
 onRender : function(ct, position){
  Ext.ux.JsonWindow.superclass.onRender.call(this, ct, position);
  var um = this.getUpdater();
  um.showLoadIndicator = false; //disable it.
  um.on('failure',function(el, response){
      this.ownerCt.el.unmask();
      this.fireEvent('failedjsonload',response)
    }.createDelegate(this));
    um.on('beforeupdate',function(el, url, params) {
     if (this.loadMask && this.ownerCt)
       this.ownerCt.el.mask(this.loadMsg, this.msgCls);
  }.createDelegate(this));
  
  um.setRenderer({render:
       function(el, response, updater, callback){
     //add item configs to the panel layout
        //Load the code to check if we should javascripts
        this.fireEvent('beforejsonload', response);
        try { 
          this.applyJson(response.responseText); 
          this.fireEvent('afterjsonload');
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
