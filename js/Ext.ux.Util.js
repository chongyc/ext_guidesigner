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


/**
 * Constuctor for the Util object
 * @param {Object} config The configuration used to intialize the utils.
 */
Ext.ux.Util = function(config){
  Ext.apply(this, config);
  this.init();
};

/**
 * A class used by JsonPanel and JsonWindow to load a jsonFile
 */
Ext.extend(Ext.ux.Util,Ext.util.Observable,{ 

  /**
   * Indicator if this version support hasOwnProperty
   * @type {Boolean}
   */
  useHasOwn : ({}.hasOwnProperty ? true : false),

  /**
   * Called from within the constructor allowing to initialize the parser
   */
  init: function() {
      this.addEvents({
        /**
         * Fires when there is a parsing error
         * @event error
         * @param {String} func The function throwing the error
         * @param {Object} error The error object created by parser
         * @return {Boolean} when true the error is supressed
         */
        'error' : false
      });
   },

  /**
   * A Synchronized Content loader for data from url
   * @param {String} url The url to load synchronized
   * @param {Boolean} cachingOff Should caching of file be disabled
   * @param {Boolean} responseXML Should responseXML be returned instead of responseText
   * @return {Boolean/String/XMLObject} When there was a error False otherwise response base on responseXML flag
   */
  syncContent : function(url,cachingOff,responseXML) {
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
   } catch (e) {
     this.fireEvent('error','synchronized',e);
   }
   return false;
  }, 

  /**
   * Function used to load a JavaScript into a document.head element
   * the id of the script item is the name of the file.
   * @param {String} url The url to load javascript from
   * @param {Boolean} cachingOff Should caching of javascript files be disabled
   * @return {Boolean} Indicator if load went corretly true/false
   */
  scriptLoader : function(url,cachingOff) {
   if(url && !document.getElementById(url)) {
     var content = this.syncContent(url,cachingOff);
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

});

/**
 * Create global object 
 */
Ext.ux.UTIL = new Ext.ux.Util();
