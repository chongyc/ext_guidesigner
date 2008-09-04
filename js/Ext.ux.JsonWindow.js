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
 * JsonWindow implements a way to load a json directly into a window
 * The window config elements of this window for example x,y can be set 
 * by specifing the values in the json tag
 */
Ext.ux.JsonWindow = Ext.extend(Ext.Window,{
 
 //@private Window is hidden by moving X out of screen
// x     : -1000,
 //@private Window is hidden by moving Y out of screen
// y     : -1000,
 
 //@private Layout is by default fit
 layout: 'fit',
 
 //@private Border is by default false
 border: false,
 
 //@private Whe only read a JSON file once
 single:true,  //only needed once
 
 //@private The json parser used is set in initComponent
 json : null, 
 /**
  * @private Init the JSON Panel making sure caching is set depending on disableCaching 
  */
 initComponent : function(){
   if (this.autoLoad) {
     if (typeof this.autoLoad !== 'object')  this.autoLoad = {url: this.autoLoad};
     if (typeof this.autoLoad['nocache'] == 'undefined') this.autoLoad['nocache'] = this.disableCaching;
   }                
   this.json = new Ext.ux.Json({scope:this.scope || this});   
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
   Ext.ux.JsonWindow.superclass.initComponent.call(this);
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
      if (this.ownerCt) this.ownerCt.el.unmask();
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
          //this.applyJson(response.responseText); 
          this.json.apply(this,response.responseText);
          this.fireEvent('afterjsonload');
          if(callback) {callback();}
        } catch (e) {
          alert(e);
          if (!this.fireEvent('afterjsonload',response,e))
             Ext.Msg.alert('Failure','Failed to decode load Json:' + e)
        }
      }.createDelegate(this)
    });  
  }

});

//Register the window
Ext.reg('jsonwindow', Ext.ux.JsonWindow);