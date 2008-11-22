/*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A web application framework with backend support
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
 * Add broadcast of publisch and subsribe to Observerable
 */
//Register name spaces used
Ext.namespace('Ext.ux.event');

Ext.override(Ext.util.Observable, {

  /**
   * This function is <b>addListener</b> analog for broadcasted messages. It accept the same parameters and have the same functionality. For further details please refer to <b>Ext.util.Observable</b> documentation
   * @name subscribe
   * @methodOf Ext.ux.event.Broadcast 
   * @param {String} eventName
   * @param {Function} fn
   * @param {Object} scope
   * @param {Object} o
   */
  subscribe: function(eventName, fn, scope, o) {
    Ext.ux.event.Broadcast.addEvents(eventName);
    Ext.ux.event.Broadcast.on(eventName, fn, scope, o);
  },


  /**
   * This function is <b>fireEvent</b> analog for broadcasted messages. It accept the same parameters and have the same functionality. For further details please refer to <b>Ext.util.Observable</b> documentation
   * @name publish
   * @methodOf Ext.ux.event.Broadcast 
     * @param {String} eventName
     * @param {Object} args Variable number of parameters are passed to handlers
     * @return {Boolean} returns false if any of the handlers return false otherwise it returns true
   */
  publish : function() {        
    if(Ext.ux.event.Broadcast.eventsSuspended !== true){
      var ce = Ext.ux.event.Broadcast.events ? Ext.ux.event.Broadcast.events[arguments[0].toLowerCase()] : false;
      if(typeof ce == "object"){
        return ce.fire.apply(ce, Array.prototype.slice.call(arguments, 1));
      }
    }
    return true;
  },

  /**
   * This function is <b>removeListener</b> analog for broadcasted messages.
   * @name removeSubscriptionsFor
   * @methodOf Ext.ux.event.Broadcast 
   * @param {String}   eventName     The type of event which subscriptions will be removed. If this parameter is evaluted to false, then ALL subscriptions for ALL events will be removed.     
   */
  removeSubscriptionsFor : function(eventName) {        
    for(var evt in Ext.ux.event.Broadcast.events) {
      if ( (evt == eventName) || (!eventName) ) {            
        if(typeof Ext.ux.event.Broadcast.events[evt] == "object"){
            Ext.ux.event.Broadcast.events[evt].clearListeners();
        }
      }
     }
   }

});

Ext.ux.event.Broadcast = new Ext.util.Observable();

/**
 * Create a WebApp by extending the Json class
 * All communication with serverside is done through json
 * The backend implements a number of default services like
 * Authenication and Auhtorization, but also reading and writing of
 * data.
 */
Ext.ux.WebApp = Ext.extend(Ext.ux.Json,{  

  remote         : 'webapp.php', 
  requests       : new Ext.util.MixedCollection(),
  method         : "POST",
 
  /**
   * Called from within the constructor allowing to initialize the contoler
   */
  initialize: function() {
    Ext.ux.WebApp.superclass.initialize.call(this);
    //Register the authenticate also as request
    this.register('authenticate',this.authenticate);
    this.register('request',this.request);
    this.register('formrequest',this.formRequest);
    this.register('error',this.errorHandler);
    this.register('callback',this.callbackOnly);
  },

  /**
   * Callback requests
   */
  callbackOnly : function(response,requestName,requestParams,callback,scope){
    callback = callback || response;
    if (typeof(callback)=='function') 
      return callback(requestName,requestParams);
  },
  
  /**
   * A simple error Handler
   */
  errorHandler : function(type,e){
    Ext.Msg.alert('Information','Error (' + type + ') ' + e);
  },

   /**
    * Basic request to do authentication, this is located here
    * because of recusive behavior
    */
   authenticate : function(response,requestName,requestParams,callback,scope){     
     var self = this;
     this.request('jsoncontent',{id : 'authenticate'},
       function(response){
        if (response) {
          //Create a window
          var w = new Ext.ux.JsonWindow({
              scope : scope || this.getScope(),
              resizable : false,
              closable : false,
              modal    : true
          });          
          //Create callback function
          Ext.apply(response,{
           callback : function(){
             if (requestName) {
               self.request(requestName,requestParams,callback,scope);
             }
             self.publish('authenticated');
             w.close();
           }
          });
          //Apply and show
          if (w.apply(response)) {
             w.show();
          } else {
            self.publish('error','authenticate', new SyntaxError('Failed to apply authentication window'));
          }
        }
        return false;
     },this);
     return false; //Eat publish
   },

   /**
    * Call a local or remote request with result of a form
    * @param {String/Form} form The name or object of form to use for request
    * @param {String} requestName The name of the request to be called
    * @param {Object} requestParams The paramters to be connected to requests
    * @param {Function} callback The callback function
    * @param {Object} scope The scope to be used when decoding json. Default getScope()
    * @returns {Mixed} returning the content or false is callback is set
    */   
   formRequest : function(form,requestName,requestParams,callback,scope) {
     var params = Ext.apply(this.formObject(form) || {},requestParams);
     return this.request(requestName,params,callback,scope);
   },
     
   /**
    * Call a local or remote request 
    * @param {String} requestName The name of the request to be called
    * @param {Object} requestParams The paramters to be connected to requests
    * @param {Function} callback The callback function
    * @param {Object} scope The scope to be used when decoding json. Default getScope()
    */
   request : function(requestName,requestParams,callback,scope){
     //Check if this is a local request
     if (requestParams && typeof(requestParams)!='object') requestParams = { id : requestParams};
     var params = Ext.apply({action:requestName},requestParams ||{});
     if (this.requests.containsKey(requestName)) {
       var request = this.requests.get(requestName);
       return this.requestResponse((typeof(request)=='function') ?
            request(requestParams,scope) : request,
            requestName,requestParams,callback,scope);
     } else { //Check if it is asynchrone
        Ext.Ajax.request({
         url     : this.remote,
         nocache : this.nocache,
         method  : this.method,
         params  : params,
         callback: function(options, success, response) {
           try {
             if (success) {
               this.requestResponse(response,requestName,requestParams,callback,scope);
             } else {
               throw new Error('Failure during load of request');
             }
           } catch (e) {
             this.publish('error','request',e);
           }
         },
         scope: this
        });
        return false;
     } 
     return false; 
   },


   /**
    * @private Convert a request reponse into content
    * @param {Object} response The Ajax response object
    * @param {String} requestName the name of the request
    * @param {Object} requestParams The paramters to be connected to requests
    * @param {Function} callback The callback function
    * @param {Object} scope The scope object to beused
    */
   requestResponse : function(response,requestName,requestParams,callback,scope){
     var content = response && response.responseText ? response.responseText : response;
     var ctype = response && response.getResponseHeader ? response.getResponseHeader["Content-Type"] || "" : "";
     var request = {};
       
     if (ctype.indexOf('application/json')!=-1) { //Check if this is a json
         content = this.decode(content,{scope:scope || this.getScope()});
         //Check if we need to do a authenctication
         if (typeof(content)=='object') {
           switch (content.controlerAuthentication) {
             case 'logout'    :
               if(typeof(callback)=="function") {
                  request = callback.call(scope || window,content,requestName,requestParams) || {};
               }
               if (this.publish('unauthenticated'))
                 this.publish('authenticate',response,request.name,request.params,request.callback,request.scope);               
               return false;             
             case 'required' :
                //Broadcast authenticate and redirect the function
               this.publish('authenticate',response,requestName,requestParams,callback,scope);
               return false;
             case 'rejected' :
                //Broadcast,Fire then throw UnauthorizedrequestRequest
               if (!this.publish('unauthorizedrequestrequest',response,requestName,requestParams,callback,scope)) { 
                 var e = new SyntaxError('You are not allowed to exceuted request:' + requestName);                  
                 this.publish('error','requestcontent',e); 
               }
               return false;
           }
           if (content.controlerError)  {
             this.publish('error','requestcontent',new SyntaxError(content.controlerError),content);
             return false; //Skip callback
           }
         }
     } else if (ctype.indexOf('text/javascript')!=-1) { //Check if this is a script
        var head = document.getElementsByTagName("head")[0];
        var script = document.createElement("script");
        try {
          script.text = content;
        } catch (ex) {
          script.appendChild(content);
        }
        script.setAttribute("type", "text/javascript");
        script.setAttribute("id", "script_" + requestName);
        head.appendChild(script);
     }
     if(typeof(callback)=="function") {
       request = callback.call(scope || window,content,requestName,requestParams) || {};
       if (typeof(request)=='object' && request.name) {
         this.request(request.name,request.params,request.callback,request.scope);
         return false;
       } else {
         return request || false;
       }
     } else {
      return content;
     }
   },
   

   /**
    * Register a local request
    * @param {String} requestName The local request name
    * @param {Object/Function} content The content or function of the request
    */
   register : function(requestName,content,scope){
     this.requests.add(requestName,content);
     if (typeof(content)=='function') this.subscribe(requestName,content,scope || this);
   },
   
   /**
    * Unregister a local request
    * @param {String} requestName The local request name to remove
    * @returns {Object} The request removed
    */
   unregister : function(requestName){
     this.removeSubscriptionsFor(requestName);
     return this.requests.remove(requestName);
   }
   
});


//Create a default contoler
var WebApp = new Ext.ux.WebApp();