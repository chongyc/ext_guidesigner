/*global Ext document */
/*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * Some common function brought together in util class
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
  
Ext.namespace('Ext.ux');

//Do not receate util when it is allready there
if (!Ext.ux.Util) {

  /**
   * Constuctor for the Util object
   * @param {Object} config The configuration used to intialize the utils.
   */
  Ext.ux.Util = function(config){
    Ext.apply(this, config);
    Ext.ux.Util.superclass.constructor.call(this);
    this.initialize();
  };

  /**
   * A class containig basic functionality for loading javascript and stylesheets
   * and helper functions for url manipulation
   */
  Ext.extend(Ext.ux.Util,Ext.util.Observable,{

    /**
     * Should caching be disabled when files are loaded (defaults false).
     * @type {Boolean}
     @cfg */
    nocache : false,

    /**
     * Indicator if this version support hasOwnProperty
     * @type {Boolean}
     */
    useHasOwn : ({}.hasOwnProperty ? true : false),

    /**
     * Called from within the constructor allowing to initialize the parser
     */
    initialize: function() {
        this.addEvents({
          /**
           * Fires when there is a parsing error
           * @event error
           * @param {String} func The function throwing the error
           * @param {Object} error The error object created by parser
           * @return {Boolean} when true the error is supressed
           */
          'error' : true
        });
        this.on('error',this.onError,this);
     },

    /**
     * Basic error handling
     * @param {String} type The type of error
     * @param {Object} exception The exception object
     * @return {Boolean} When false the error event is canceled.
     */
     onError : function(type,exception) {
       return true;
     },

     /**
      * Convert a url into a nocache url by adding a date if needed
      * @param {String} url The url to use
      * @param {boolean} nocache The nocache variable (default this.nocache)
      */
     nocacheUrl : function(url,nocache){
       nocache = nocache==undefined ? this.nocache : nocache;
       if (nocache) {
         url += (url.indexOf('?') != -1 ? '&' : '?') + '_dc=' + (new Date().getTime());
       }
       return url;
     },

    /**
     * A Synchronized Content loader for data from url
     * @param {String} url The url to load synchronized
     * @param {Boolean} nocache Should caching of file be disabled
     * @param {Boolean} responseXML Should responseXML be returned instead of responseText
     * @return {Boolean/String/XMLObject} When there was a error False otherwise response base on responseXML flag
     */
    syncContent : function(url,nocache,responseXML) {
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
     url = this.nocacheUrl(url,nocache);
     try {
      conn.open('GET', url , false);
      conn.send(null);
      if ((isLocal && conn.responseText.length!=0) || (conn.status !== undefined && conn.status>=200 && conn.status< 300)) {
        return responseXML ? conn.responseXML : conn.responseText;
      }
     } catch (e) {
       this.fireEvent('error','synchronized',e);
     }
     return false;
    },

    /**
     * Function used to load a JavaScript into a document.head element
     * the id of the script item is the name of the file.
     * @param {String} url The url to load javascript from
     * @param {Boolean} nocache Should caching of javascript files be disabled
     * @return {Boolean} Indicator if load went corretly true/false
     */
    scriptLoader : function(url,nocache) {
     if (!url) return false;
     var id=url;
     if(!document.getElementById(id)) {
       var content = this.syncContent(url,nocache);
       if (content===false) return false;
       var head = document.getElementsByTagName("head")[0];
       var script = document.createElement("script");
       try {
         script.text = content;
       } catch (e) {
         script.appendChild(content);
       }
       script.setAttribute("type", "text/javascript");
       script.setAttribute("id", id);
       head.appendChild(script);
     }
     return true;
    },

    /**
     * Get the value of a url action
     * @param {String} name The name of the action
     * @param {String} defaultValue The default value used when not found
     * @param {String} url The url to use defaults to window url
     * @return {String} The value found for action or default
     */
    getUrlAction : function (name,defaultValue,url) {
      name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
      var regexS = "[\\?&]"+name+"=([^&#]*)";
      var regex = new RegExp( regexS );
      var results = regex.exec( url || window.location.href );
      if( results == null )
        return isNaN(defaultValue) ? defaultValue : Number(defaultValue);
      else
        return isNaN(results[1]) ? results[1] : Number(results[1]);
    },

    /**
     * Parse a url into object
     * containing element: "source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","name","ext","query","anchor"
     * @param {String} str The url to parse
     * @param {Object} options A object with options to be used during parse
     */
    parseUrl : function(str,options) {
      var o   = Ext.applyIf(options || {},{
          strictMode: false,
          key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
          q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
          },
          parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
          }
        }),
        m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
        uri = {},
        i   = 14;

      while (i--) uri[o.key[i]] = m[i] || "";
      uri[o.q.name] = {};
      uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
        if ($1) uri[o.q.name][$1] = $2;
      });
      if (!uri.protocol) {
        uri.relative= uri.host + uri.relative;
        uri.path = uri.host + uri.path;
        uri.directory = uri.host + uri.directory;
        uri.host="";
      }
      if (!uri.file) {
        uri.file = uri.path;
        uri.path = uri.directory = '';
      }
      uri['name']="";uri['ext']="";
        if (/\.\w+$/.test(uri.file) && uri.file.match(/([^\/\\]+)\.(\w+)$/)) {
          uri['name']=RegExp.$1;
          uri['ext']=RegExp.$2;
        }
      return uri;
    },

    /**
     * Load a url, stylesheet or javascript by adding it to the header
     * @param {String} url The url to be added
     * @param {String} type The load action to perform (default js)
     * @param {Object} options options[reload] Should the file be reload if allready loaded
     */
    loadUrl : function(url,type,options) {
      options = options || {};
      //Now load it by adding it to the header
      if (this._loadCount == undefined) {
        this._loadCount=0;
        this._loaded=[];
      }
      if (this._loaded[url] && !options.reload) return;
      var node;
      var self = this;
      var head = document.getElementsByTagName("head")[0];
      if(document.getElementById(url)){head.removeChild(url)}
      switch (type) {
       case 'css' :
         node = document.createElement("link");
         node.setAttribute("rel", "stylesheet");
         node.setAttribute("type", "text/css");
         node.setAttribute("href", this.nocacheUrl(url,options.nocache));
         break;
       default :
         node = document.createElement("script");
         node.setAttribute("type", "text/javascript");
         node.setAttribute("src", this.nocacheUrl(url,options.nocache));
      }
      node.setAttribute("id",url);
      node.onload = node.onreadystatechange = function() {
       if (!self._loaded[url] && (!node.readyState || [4,"loaded","complete"].indexOf(node.readyState)!=-1)) {
         self._loadCount--;
         self._loaded[url]=true;
       }
      };
      this._loadCount++;
      this._loaded[url]=false;
      head.appendChild(node);
    },

    /**
     * Function require is used to checks if the required files are loaded
     * when not the files are loaded
     * @param {Mixed} packages An array or ; seperated string with packages to load
     * @param {Mixed} options An object with options to used, when string then basedir is assumed
     * options[basedir] The default directory to use for all files
     * options[cssdir] The directory to be used for stylesheets
     * options[async] When set to true required will return directly
     * options[callback] Callback function after all required files are loaded
     * options[reload] When reload is set packages are reloaded
     * options[nocache] When set the object caching is turned off
     * options[reload] When true stylesheet/javacode is swapped
     * @return {Object} a object with keys js and css contain an array with full path of items
     */
    require : function(packages,options){
      var ret = {css: [],js:[]};
      if (!packages) return ret;
      if (packages instanceof Array && !options && packages.length==2 && typeof(packages[1])=='object') {
        options=packages[1];
        packages=packages[0];
      }
      packages= (typeof(packages)=='string') ? packages.split(';') : packages || [];
      options = (typeof(options)=='string') ? {'basedir' : options} : options || {basedir : ""};
      options['cssdir'] = options.cssdir || options.basedir;
      options['reload'] = options['reload']== undefined ? true : options['reload'];
      options['nocache'] = options['nocache']== undefined ? this.nocache : options['nocache'];
      //First load all files
      for (var i=0;i<packages.length;i++) {
        //Create a name of path + packages + extentsion
        var url = this.parseUrl(packages[i]);
        if (['js','css'].indexOf(url.ext)==-1) url.file+='.js';
        var dir = url.ext=='css' ? options.cssdir : options.basedir;
        var uri = dir + (dir.length!=0 && dir.charAt(dir.length-1)!='/' ? "/" : "") +
           url.directory +  url.file + (url.query ? '?' + url.query : '');
        if (url.ext=='css') {
            ret.css.push(uri);
            Ext.util.CSS.swapStyleSheet(this.nocacheUrl(uri,options.nocache), uri);
        } else if (options.async){
           this.loadUrl(uri,url.ext,options);
           ret.js.push(uri);
        } else {
           ret.js.push(uri);
           this.scriptLoader(uri,options.nocache);
        }
      }
      return ret;
    }

  });

  /**
   * Create global object for utility and require object
   */
  Ext.ux.UTIL = new Ext.ux.Util();
  require = Ext.ux.UTIL.require.createDelegate(Ext.ux.UTIL);
}
