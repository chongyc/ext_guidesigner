/*global Ext document */
/*  
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
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

//Register name spaces used
Ext.namespace('Ext.ux.data');  

/**
 * Constructor for HttpMergeProxy which accepts an array of Ajax
 */
Ext.ux.data.HttpMergeProxy = function(urlArray){
    Ext.ux.data.HttpMergeProxy.superclass.constructor.call(this);
    this.urlArray = urlArray || [];
    this.urlData  = [];
};

/**
 * HttpMergeProxy accepts an array of Ajax url and joins them together into one 
 * before calling the callback
 * @param {Array} a array of Ajax requests, url string or as object
 */
Ext.extend(Ext.ux.data.HttpMergeProxy, Ext.data.DataProxy, {

    /**
     * Merge two json files into one, incase same items exists 
     * then second json is leading
     * @param {Object\Array} json1 The first json file
     * @param {Object\Array} json2 The second json file
     * @return {Object\Array} The merged json
     */
    merge : function (item1,item2) {
      if (item1 instanceof Array && item2 instanceof Array) {
        var arr = [];
        for (var i=0;i<item1.length;i++) arr.push(item1[i]);
        for (var i=0;i<item2.length;i++) arr.push(item2[i]);
        return arr;
      } else if (typeof(item1)==typeof(item2) && typeof(item1)=='object') {
        var obj = {};
        for (var i in item1) {obj[i] = this.merge(item1[i],item2[i]);}
        for (var i in item2) {if (!obj[i]) obj[i]=item2[i];}
        return obj;
      } else if (typeof(item1)==typeof(item2) && typeof(item1)=='string') {
        return item1+item2;
      } else if (typeof(item1)==typeof(item2)) {
        return item2;
      } else if (item1==undefined) {
        return item2;
      } else if (item2==undefined) {
        return item1;      
      } else { 
        throw new SyntaxError('Object items cannot be joined because items mismatch');
      }
    },
       
    /**
     * Load data from the configured urlArray, read the data object into
     * a block of Ext.data.Records using the passed {@link Ext.data.DataReader} implementation, and
     * process that block using the passed callback.
     * @param {Object} params An object containing properties which are to be used as HTTP parameters
     * for the request to the remote server.
     * @param {Ext.data.DataReader} reader The Reader object which converts the data
     * object into a block of Ext.data.Records.
     * @param {Function} callback The function into which to pass the block of Ext.data.Records.
     * The function must be passed <ul>
     * <li>The Record block object</li>
     * <li>The "arg" argument from the load function</li>
     * <li>A boolean success indicator</li>
     * </ul>
     * @param {Object} scope The scope in which to call the callback
     * @param {Object} arg An optional argument which is passed to the callback as its second parameter.
     */
    load : function(params, reader, callback, scope, arg){
        if(this.fireEvent("beforeload", this, params) !== false){
         //Got through the urls and start calling
          this.count=this.urlArray.length;
          this.urlData  = [];
          for (var i=0;i<this.urlArray.length;i++) {
            var  o = {
                params : params || {},
                request: {
                    callback : callback,
                    scope : scope,
                    arg : arg
                },
                reader: reader,
                callback : this.loadResponse,
                scope: this
            };
            o = Ext.apply(o,typeof(this.urlArray[i])=='object' ? this.urlArray[i] : {url:this.urlArray[i]});
            o['urlArrayId']=i;
            Ext.Ajax.request(o);
          }
        } else {
            callback.call(scope||this, null, arg, false);
        }
    },

    /**
     * @private Process the result of a ajax call
     */
    loadResponse : function(o, success, response){
       //Check if we allready finished with processing
       if (this.count<=0) return;
       //Check if last call was valid
       if(!success){
           this.count=0;
           this.fireEvent("loadexception", this, o, response);
           o.request.callback.call(o.request.scope, null, o.request.arg, false);
           return;
       }
       //Process the result
       try {
          this.urlData[o['urlArrayId']]=o.reader.read(response);
       } catch(e){
          this.count=0;
          this.fireEvent("loadexception", this, o, response, e);
          o.request.callback.call(o.request.scope, null, o.request.arg, false);
          return;
       }
       //Check if this is the last result so whe can join
       this.count--;
       if ((this.count)==0) {
          var result;
          try {
            for (var i=0;i<this.urlArray.length;i++) {
              result = this.merge(result,this.urlData[i]);
            }
            this.fireEvent("load", this, o, o.request.arg);
            o.request.callback.call(o.request.scope, result, o.request.arg, true);
          } catch(e){
            this.count=0;
            this.fireEvent("loadexception", this, o, response, e);
            o.request.callback.call(o.request.scope, null, o.request.arg, false);
            return;
          }  
       }
     },
    
    /**
     * @private Update the dataSet
     */
    update : function(dataSet){
        
    },
    
    /**
     * @private Update the dataSet
     */
    updateResponse : function(dataSet){
        
    }
});