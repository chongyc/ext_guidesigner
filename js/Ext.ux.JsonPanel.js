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
 * Component extending a panel giving it the capability to read or create a JSON file.
 * When using Json file created with designer this JsonPanel will also evaluate the special items 
 * under Json root called <b>json</b>. The JsonPanel currently evaluates two special window items 
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
Ext.ux.JsonPanel = Ext.extend(Ext.Panel,{
 
 //@private Layout is by default fit
 layout: 'fit',
 
 //@private Border is by default false
 border: false,
 
 //@private bodyBorder is by default false
 bodyBorder : false,
 
 //@private Whe only read a JSON file once
 single:true,  //only needed once
 
 //@private The json parser used is set in initComponent
 json : null,
 
 //@private Should caching of pages be disabled
 nocache : false,
  
 /**
  * @private Init the JSON Panel making sure caching is set depending on nocache 
  */
 initComponent : function(){
   if (this.autoLoad) {
     if (typeof this.autoLoad !== 'object')  this.autoLoad = {url: this.autoLoad};
     if (typeof this.autoLoad['nocache'] == 'undefined') this.autoLoad['nocache'] = this.nocache;
   }                
   Ext.ux.JsonPanel.superclass.initComponent.call(this);
   this.json = new Ext.ux.Json({scope: this.scope || this, nocache: this.nocache});      
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
  * Add support for listeners form the json
  * @param {Array} listeners A array of objects containing the listeners to connect
  */
 setListeners : function(listeners) {
   this.on(listeners);
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
       if (this.ownerCt) this.ownerCt.el.unmask();
       if (this.json.fireEvent('error','failedjsonload','url in autoLoad not valid')) {
        this.fireEvent('failedjsonload',response);
       }
     }.createDelegate(this));
     um.on('beforeupdate',function(el, url, params) {
      if (this.loadMask && this.ownerCt)
        this.ownerCt.el.mask(this.loadMsg, this.msgCls);
   }.createDelegate(this));
 
   um.setRenderer({render:
        function(el, response, updater, callback){
          this.apply(response.responseText,callback);
        }.createDelegate(this)
     });
   },
   
  /**
   * Apply a json configuration to this window
   * @param {String} cfg A string containing a json configuration
   * @param {Function} callback A callback function called after succesfull apply
   * @returns {Boolean} True when apply was successfull otherwise false
   */
  apply : function(cfg,callback) {
    this.fireEvent('beforejsonload', cfg);
    try {
      this.json.apply(this,cfg);
      this.fireEvent('afterjsonload');
      if(callback) {callback();}
      return true;
    } catch (e) {
      if (this.json.fireEvent('error','failedjsonload',e) &&
          this.fireEvent('failedjsonload',cfg,e))
         Ext.Msg.alert('Failure','Failed to decode load Json:' + e.message)
      return false;
    }
  }

});
//Register the panel
Ext.reg('jsonpanel', Ext.ux.JsonPanel);