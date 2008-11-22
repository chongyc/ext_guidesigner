/*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A customizable json encoder and decoder
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
 * A class used by JsonPanel and JsonWindow to load a jsonFile
 */
Ext.ux.Json = Ext.extend(Ext.ux.Util,{
    /**
     * The string used to indent
     * @type {String}
     @cfg */
    indentString : '  ',

    /**
     * Should the result of a encode be readable
     * @type {Boolean}
     @cfg */
    readable : true,

    /**
     * The custom licenseText that should be added to each JSON File Created
     * @type {String}
     @cfg */
    licenseText  : null,

    /**
     * The internal tag added to an objectkey used to store original code of a objectvalue,
     * when null the original code is not stored and encode will not be able to recreate
     * javascript code.
     * @type {String}
     @cfg */
    jsonId : null,

    /**
     * Scope is used as binding varaible for <b>this</b> within the json
     * @type {Object}
     @cfg */
    scope : {},

    /**
     * Should an eval Exception been thrown causing parsing to stop
     * or should it be converted into string
     * @type {Boolean}
     @cfg */
    evalException : true,

    /**
     * Flag indicating that whe should do a full encode, not only items keys recusivly
     * @type {Boolean}
     @cfg */
    fullEncode : false,

    /**
     * Called from within the constructor allowing to initialize the parser
     */
    initialize: function() {
      Ext.ux.Json.superclass.initialize.call(this);
      this.addEvents({
        /**
         * Fires before a json is been applied to a visual component
         * @event beforeapply
         * @param {Object} element The visual component
         * @param {Object} json The json used
         */
        'beforeapply' : true,

        /**
         * Fires after a json has been applied to a visual component
         * @event afterapply
         * @param {Object} element The visual component
         * @param {Object} json The json used
         */
        'afterapply' : true
      });
     },

     /**
      * Function returning the scope to beused for the json
      * @return {Object} the object which should be used as scope when parsing
      */
     getScope : function(){
       return  this.scope;
     },

    /**
     * Check if a object is empty, ignoring jsonId keys
     * @param {Object\Array} obj The json object to be checked
     * @return {Boolean} true when object does not contain any data
     */
    isEmpty : function(obj) {
     if (obj instanceof Array) {
       for (var i=0;i<obj.length;i++) {
         if (!this.isEmpty(obj[i])) return false;
       }
     } else if (typeof(obj) == 'object')  {
       for (var i in obj) {
         if ((!this.useHasOwn || obj.hasOwnProperty(i)) &&
             (!this.jsonId || i.indexOf(this.jsonId)!=0)) {
            return false;
         }
       }
     } else if (obj!=undefined) return false;
     return true;
    },

    /**
     * Load a json object directly from url. Target can be a callback function or
     * visual component. When target is not set load will be come a synchrone call
     * @param {String/Object} url The url information to be used for loading
     * @param {function/Container} target A callback function or container to render json\
     * @return {Object} null when target is set otherwise the loaded json.
     */
    load : function(url,target) {
      if (target && target instanceof Ext.Container) {
        return this.load(url,function(items){this.apply(target,items)}.createDelegate(this));
      } else if (typeof(target)=='function') {
        Ext.Ajax.request({
              url: url,
              nocache : this.nocache,
              callback: function(options, success, response) {
                try {
                  if (success) {
                    var items = this.decode(response.responseText);
                    if(typeof callback == "function") callback(items);
                  } else {
                    throw new Error('Failure during load');
                  }
                } catch (e) {
                  this.fireEvent('error','load',e);
                }
              },
              scope: this
        });
        return null;
      } else {
        return this.decode((typeof(url)=='object')
                   ? this.syncContent(url.url,url.nocache==undefined ? this.nocache : url.nocache)
                   : this.syncContent(url.url,this.nocache));
      }
    },


   /**
    * Function called to set the values of items to element using element functions
    * Special keys within the object are required_css and required_js
    * these keys can contain a comma seperated list of javascript or stylesheets
    * to load. Style sheets are loaded asynchone but javascript are loaded synchrone.
    * @param {Object} items The config object with items that should be set
    * @param {Element} element The element to which to set the values
    * @param {Object} options Options that can be set are scope,scopeOnly
    * @return {Boolean} indicator if all changes where set
    */
    set : function (element,items,options) {
     var allSet = true, el = element || this;
     options = options || {}
     if (options.nocache==undefined) options.nocache = this.nocache;
     if (items) {
      if (options.scopeOnly) options = Ext.apply({evalException : false},options);
      if (typeof(items)=='string') items = this.decode(items,options);
      for (var i in items) {
        var j = i;
          if (i=='required_js') {
            if (items[i]) {
              var files = items[i].replace(',',';').split(';');
              for (var f=0;f<files.length;f++) {
                if(document.getElementById(files[f])) {continue;}
                if (!this.scriptLoader(files[f],options.nocache)) {
                  var e = new Error('Failed to load javascript '+ files[f]);
                  if (this.fireEvent('error','set',e)) throw e;
                }
              }
            }
          } else if (i=='required_css') {
            if (items[i]) {
              var files = items[i].replace(',',';').split(';');
              for (var f=0;f<files.length;f++) {
                if(document.getElementById(files[f])) {continue;}
                Ext.util.CSS.swapStyleSheet(files[f], files[f]);
              }
            }
          } else {
            var applyTo = el;
            //When scope of var set if
            if (i.indexOf('scope.')==0) {
               applyTo = options.scope ? options.scope : this.getScope();
               j = i.substring(6);
               if (j.charAt(0)=='!') {
                 //Check if it only should be set when not available
                 j=j.substring(1);
                 if (applyTo[j]) continue;
               }
            } else if (options.scopeOnly) continue;
            var k = 'set' + j.substring(0,1).toUpperCase() + j.substring(1);
            try {
              if (applyTo[k] && typeof applyTo[k] == 'function') {
                applyTo[k].call(el,items[i]);
              } else if (applyTo[j] && typeof applyTo[j] == 'function') {
                applyTo[j].call(el,items[i]);
              } else {
                applyTo[j] = items[i];
              }
            } catch (e) {
              if (options.ignoreError) {
                allSet = false;
              } else {
               allSet |= (this.fireEvent('error','set('+k+')',e)===false);
              }
            }
          }
      }
     }
     return allSet;
    },


  /**
   * Clean the null elements from items object
   * @param {Object} items The items object to be cleaned
   * @return {Object} The cleaned items object
   */
   clean : function(items) {
     var c=0;
     for (var k in items) {
       if(!this.useHasOwn || items.hasOwnProperty(k)) {
         if (k=='items') {
           if (items[k] instanceof Array) {
            var n =[];
            for (var i=0,a=items[k];i<a.length;i++) {
              var o = this.clean(a[i]);
              if (o!=null) n.push(o);
            }
            items[k] = (n.length>0) ? n : null;
           } else items[k]=this.clean(items[k]);
         }
         if (items[k]===undefined || items[k]===null || (typeof items[k]=="string" && items[k]=="")) {
           delete items[k];
         } else {
           c++;
         }
       }
     }
     return c ? items : null;
   },

   /**
    * Convert a Json to a editable Json by adding an jsonId when set to each object
    * @param {Object/String} json The json as text or object to add an id to
    * @return {Object} The decoded object with id's added
    */
    editable : function(json) {
     var items = json || {};
     if (typeof(items) !== 'object') items = this.decode(json);
     if (!this.jsonId) return items;
     if (items instanceof Array) {
       for (var i=0;i<items.length;i++) {
        items[i]=this.editable(items[i]);
       }
       return items;
     }
     //Check if the object is allready editable
     if (!items[this.jsonId]) {
       items[this.jsonId]=Ext.id();
       if (items.items) items.items=this.editable(items.items);
     }
     return items;
    },

   /**
    * Apply the Json to given visual element
    * @param {Object/String} json The json to apply
    * @param {Element} el The element to apply the json to
    * @param {Boolean} clean When false object will not be cleaned, defaults true
    * @return {Object} The elements applied
    */
    apply : function (el,json,clean) {
     var items;
     try {
       items = this.jsonId ? this.editable(json) : json || {};
       if (typeof(items) !== 'object') items = this.decode(json);
       if (items && (items instanceof Array || typeof(items)=="object")) {
         if (clean!==false) items = this.clean(items);
         this.fireEvent('beforeapply',el,items);
         //Apply global json vars to element
         if (el instanceof Ext.Container) {
           //Clear out orignal content of container
           while (el.items && el.items.first()) {el.remove(el.items.first(), true);}
           if (!this.isEmpty(items)) {
             if (items instanceof Array) {
                el.add.apply(el,items);
             } else {
               el.add(items);
             }
            //Apply json settings if there
            this.set(el,items.json);
           }
         } else {
           this.set(el,items);
         }
        if (el.rendered && el.layout && el.layout.layout) el.doLayout();
      }
     } catch (e) {
      if (this.fireEvent('error','apply',e)) throw e;
     } finally {
      this.fireEvent('afterapply',el,items);
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
       while (this.readable && i<n) {
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
       var nl = this.readable ? "\n" : "";
       var nc = this.readable ? " : ": "";
       indent = indent || 0;
       if (indent==0) {
         var a=[], lic =  (!noLicense && this.licenseText) ? this.licenseText + "\n" : "";
         a.push(lic ,this.encode(o,1,keepJsonId));
         return a.join("");
       }
       if(o == undefined || o === null){
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
         a.push(this.indentStr(indent-1),"{" + nl); //On same line as key
         for (var i in o) {
           v = o[i];
           var orgKey = (i.indexOf(this.jsonId)==0 && i!=this.jsonId) ?
                 i.substring(this.jsonId.length) : null;
           if ((!orgKey && this.jsonId && o[this.jsonId + i]) ||
               (!keepJsonId && i==this.jsonId)) {
             continue; //skip items which have a rawValue or are jsonId
           }
           if (orgKey) { //We have a rawValue
             if (typeof(v)=='object' && (typeof(v.value)!="string" || String(v.value).replace(/\s+$/,""))) {
               if(b) a.push(',' + nl);
               if (v.encode===false) {
                 a.push(this.indentStr(indent), orgKey, nc,v.value);
               } else {
                 a.push(this.indentStr(indent), orgKey, nc,
                   this.encode(v.value,indent + 1,keepJsonId));
               }
             } else if (typeof(v)!='object' && String(v).replace(/\s+$/,"")) {
               if(b) a.push(',' + nl);
               a.push(this.indentStr(indent), orgKey, nc, v);
             } else {
               continue;
             }
             b = true;
           } else if(!this.useHasOwn || o.hasOwnProperty(i)) { //We have normal value
             switch (typeof v) {
               case "undefined":
               case "unknown":
                   break;
               case "function":
                 if(b) a.push(',' + nl);
                 a.push(this.indentStr(indent), i, nc, ""+v);
                 b = true;
                 break;
               case "object" :
               case "string" :
                  if (!v) break; //Skip empty string and objects else default
               default:
                   if(b) a.push(',' + nl);
                   a.push(this.indentStr(indent), i, nc,
                         v === null ? "null" : this.encode(v,indent + 1,keepJsonId));
                   b = true;
             }
           }
         }
         a.push(nl + this.indentStr(indent-2) + "}");
         return a.join("");
       }
     },


     /**
      * Function used to read a raw value form a given object
      * @param {Object} object The object used
      * @param {String} key The key to use
      * @return {value} The value of the raw key
      */
     getObjectRawValue : function(object,key) {
       if (this.jsonId && object[this.jsonId+key]) {
         var v = object[this.jsonId+key];
         return typeof(v)=='object' ? v.value : v;
       }
       return object[key];
     },

    /**
     * Set a key with a value within the json container of config
     * without changing the layout of the json
     * @param {Object} cfg The config object
     * @param {String} key The to be set
     * @param {Mixed} value The value to be set
     * @return {Object} The config object
     */
    setJsonValue : function(cfg,key,value){
      cfg = cfg || {};
      //Check if root is a array with more then one element, if so skip
       if (!cfg.json) cfg.json = {};
       //Parse original so if can be reused as base
       var myEncoder = new Ext.ux.Json({jsonId : this.jsonId, nocache : nocache,evalException : false});
       var o = myEncoder.decode(cfg[this.jsonId + "json"]) || {};
       o[key] = value;
       cfg.json[key] = value;
       cfg[this.jsonId+"json"]=myEncoder.encode(o);
       return cfg;
    },

     /**
      * Function used to by decode to assign a value to a key within a object created during decode
      * Overwriting this functions allows to write you to rewrite output of value depending on situtation
      * @param {Object} object The object array used to assing
      * @param {String} key The key of the element within then object
      * @param {Object} value The value of the element within the object
      * @param {String} rawValue the rawValue to be used for the object (defaults null)
      * @param {Object} scope The scope to be used (defaults getScope())
      * @retrun {Object} The value assigned
      */
     setObjectValue : function (object,key,value,rawValue,scope) {
       scope = scope || this.getScope();
      //Phase three load javascript, stylesheet and evalute scope objects
       if (key=='json') {
         this.set(scope,value,{scopeOnly :true,scope : scope,nocache:this.nocache});
       }
       //remove empty object results
       if (typeof(value)=='string') value = value.replace(/\s+$/,"");
       if (value===null || value==="") {
         delete object[key];
         if (this.jsonId) delete object[this.jsonId + key];
         return value;
       }
       object[key]=value;

       //Check if whe should set or delete a rawValue
       if (this.jsonId) {
          if (rawValue && typeof(rawValue)=='object') {
            object[this.jsonId + key] = rawValue;
          } else if (rawValue) { //Check if this is a valid code object
            try {
              if (typeof(rawValue)=='string') rawValue = rawValue.replace(/\s+$/,"");
              object[key]=this.decode(rawValue,{exceptionOnly : true,scope : scope});
              if (typeof(object[key])=='string' &&
                ([value,"'"+value+"'",this.encodeString(value)].indexOf(rawValue)!=-1)) {  //Stip qoutes
                delete object[this.jsonId+key];
             } else {
               object[this.jsonId+key]=rawValue;
             }
            } catch (e) { //Code is not valid thread as string
              object[this.jsonId + key] = {value : rawValue, encode : true }
            }
          } else {
            delete object[this.jsonId+key];
          }
       }
       return value;
     },

     /**
      * Code Evaluation function forcing that scope is set during eval
      * @param {String} text The string to be evaluated
      * @param {Object} options A object that can overrule config items,
      *         evalException or scope
      * @return {Object\Function} The evaluated object
      */
     codeEval : function(code,options) {
       options = options || {}
       var self = this;
       var scope = options.scope || this.getScope();
       var evalException = options.evalException==undefined ? this.evalException : options.evalException;
       if (!code || !String(code).replace(/\s+$/,"")) return null;
       var myEval = function(code) {
         try {
           //Fix is needed because ie7 does not eval a function directly
           return eval("({fix:" + code+ "})").fix;
         } catch (e) {
           e = new SyntaxError('Invalid code: ' + code + ' (' + e.message + ')' );
           if (options.exceptionOnly) throw e;
           if (evalException && self.fireEvent('error','codeEval',e)) throw e;
           return code;
         }
       }.createDelegate(scope);
       return myEval(code);
     },

     /**
      * Decode function for parsing json json into objects
      * The parsing contains four stages.
      * First stage the json is parsed and code is transformed into strings and evaluated
      * Second stage All empty objects are removed
      * Third stage the json key (if exists) is evaluated
      *   to check if stylesheets or javascipt or scipe objects should be loaded
      * Fourth stage the code objects are checked if there code should be stored __json__[key]
      * @param {String} json The string to decode
      * @param {Object} options A object that can overrule config items,
      *        fullDecode, evalException or scope
      * @return {Object} The decoded object
      */
     decode : function(json,options) {
          options = options || {}
          var at = 0,ch = ' ',self = this;
          var scope = options.scope || this.getScope();
          var fullDecode = options.fullDecode==undefined ? this.fullDecode : options.fullDecode ;

          /* function throwning a error*/
          function error(m) {
              var e = new SyntaxError(m);
              e.at = at - 1;
              e.json = json;
              throw e;
          }

          /* Get the next charachter of the json to parse, moving pointer one forward */
          function next() {
              ch = json.charAt(at);
              at += 1;
              return ch;
          }

          /* Get the previous charachter of the json to parse, moving pointer one back */
          function prev(count) {
              at -= count ? count : 1;
              ch = json.charAt(at);
              at += 1;
              return ch;
          }

          /* Check if there is a full wordmatch, offset is used to set postion to read from
           * default this is -1 resulting that pointer is set to 0=current charachter */
          function wordMatch(word,offset) {
            if (offset==undefined) offset = -1;
            var i=0;
            for (;i<word.length && json.charAt(at+i+offset)==word.charAt(i);i++) {}
            if (i>=word.length) {
              at += offset+i;
              next();
              return true;
            }
            return false;
          }

          /* Clean out white space, block comments and end of line comments*/
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

          /* Skip a single word */
          function singleWord(){
            var s = ch;
            while (next() && ": \t\n\r-+={(}[])'\"".indexOf(ch)==-1) {s+= ch}
            return s;
          }

          /* Read a qouted string */
          function string(qoute) {
              qoute = qoute || ch;
              var start=at-1,i, s = '', t, u;

              if (ch == qoute) {
           outer: while (next()) {
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
              error("Bad string " + json.substring(start,at-1));
          }

          /* Read an array */
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
                      a.push(value(asCode)[0]);
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
              error("Bad array " + json.substring(start,at-1));
          }

          /* Read a object, when asCode is set only items are recusivly parsed */
          function object(asCode) {
            var start=at-1,k, o = {},v;

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
                      error("Bad key("+ch+") seprator for object " + json);
                    }

                    next();
                    white();
                    v=value(k!='items');
                    self.setObjectValue(o,k,v[0],v[1],scope);
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
            error("Bad object ["+k+"]" + json.substring(start,at-1));
          }

          /* Read a number */
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
                  error("Bad number " + v);
              } else {
                  return v;
              }
          }

          /* Skip a code block */
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
                  string(ch);
                  at--;
              }
            }
            error('Unexpected end of code');
          }


          /* Parse a code block, returning the evaluated code and
           * returning [evaluateCode,orignalCode] */
          function code(isFunction) {
            at--; //restart code block
            var start = at - (isFunction ?  8: 0); //if function add 8 to start
            var wat;
            while (next()){
              
              white();
              switch (ch) {
                case '(' :
                  codeBlock(')');
                  break;
                case '[' :
                  codeBlock(']');
                  break;
                case '"' :
                case "'" :
                  string(ch);
                  prev(2); //Go back to closing qoute
                  break;
                case '{' :
                  codeBlock('}');
                  if (!isFunction) break;
                  next();
                case ',' :
                case ']' :
                case '}' :
                  var block =json.substring(start,at-1);
                  return [self.codeEval(block,options),block];
              }
            }
            var block =json.substring(start,at-1);
            return [self.codeEval(block,options),block];
          }

          /* Read a value returning a array [value,orignalcode] */
          function value(asCode) {
              lastCode=null;
              white();
              switch (ch) {
                  case '{':
                    return asCode && !fullDecode ? code() : [object(false)];
                  case '[' :
                    return asCode && !fullDecode ? code() : [array(false)];
                  default:
                    if (wordMatch('true')) return [true];
                    else if (wordMatch('false')) return [false];
                    else if (wordMatch('null')) return [null];
                    else if ("-.0123456789".indexOf(ch)>=0) return [number()];
                    else if (wordMatch('function')) return code(true);
                    return code();
              }
          }
        try {
          if (!json) return null;
          var v = value(false)[0];
          white();
          if (ch) error("Invalid Json");
          //Check if we should make the code editable
          if (this.jsonId && typeof(v)=="object") v = this.editable(v);
          return v;
        } catch (e) {
          if (options.exceptionOnly) throw e;
          if (this.fireEvent('error','decode',e)) throw e;
        }
     },

    /**
     * Function used to clone a object
     * IMPORTANT: works only when items are build with jsonid set
     * @param {Object} items The object to be cloned
     * @return {Object} The cloned object
     */
    clone : function(items) {
      return this.decode(this.encode(items));
    }
});

/**
 * Create global object
 */
Ext.ux.JSON = new Ext.ux.Json({
   jsonId:'__JSON__',
   licenseText :'/* This file is created or modified by Ext.ux.Json */'
//   ,onError : function(type,exception){alert(type +" " + (typeof(exception)=='object' ? exception.message || exception : exception))}
});
