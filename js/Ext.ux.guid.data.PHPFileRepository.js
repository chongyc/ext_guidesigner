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

//The namespace
Ext.namespace('Ext.ux.guid.data');

/**
 * PHPFileRepository is a repository using phpFiles.php as a server side
 * file repository. Files relative to rootBase can be loaded, changed or deleted 
 * by this repository.
 */
Ext.ux.guid.data.PHPFileRepository = Ext.extend(Ext.ux.guid.data.Repository,{
  /**
   * The url to the php class implementing the repository callback functions
   * @type {String}
   @cfg */
  url : "phpFiles.php",  
  
  /**
   * Relative name used to make url for root item  (default json)
   * @type {String}
   @cfg */
  rootBase : "json",
  
  /**
   * Can a item be changed to url, used by getUrl. (default true)
   * @type {Boolean} 
   @cfg */
  urlSupport : true,

  /**
   * Refresh the repository
   * @param {function} callback A callback function called with parameter true or false
   * to indicated a succesfull refresh after refresh function is finished
   */    
  refresh : function (callback) {
    Ext.Ajax.request({
      url: this.url,
      params: {
         cmd: 'get_files',
         baseDir: this.rootBase
      },            
      callback: function(options, success, response) {
        this.items= success ? Ext.util.JSON.decode(response.responseText) : {};
        if(typeof callback == "function") callback(success);
      },            
      scope: this        
    });    
  },

  /**
   * Save the changes made to a repositoryId
   * @param {String} id The repositoryId to use
   * @param {String} action The action to perform 'remove', 'new' and 'save'
   * @param {String} callback The callback function with parameter true or false
   * to indicated a succesfull action.
   * @param {String} content The json as String to used (optional)
   */
  saveChanges : function(id,action,callback,content) {  
    Ext.Ajax.request({
       url: this.url,
       params: {
         cmd: 'save_changes',
         baseDir: this.rootBase,
         filename: id,
         action: action,
         content: content
       },
       callback: function(options, success, response) {
         if(success && response.responseText=='1') { 
           if(action=='remove') {
             delete this.items[id];
             if (id==this.last) this.last = null;
           } else {
             this.last = id;
           } 
         }
         if(typeof callback == "function") callback(response.responseText=='1');
       },
       scope: this        
    }); 
  },

  /**
   * Open a repository item by loading it and pasing the content back to the callback function
   * @param {String} id The repositoryId to use
   * @param {function} callback The callback function to use (boolean state,String content)
   * @param {String} content The content to use as default (optional)
   */
  open : function(id,callback,content) {
    Ext.Ajax.request({
      url: this.url,
      params: {
        cmd: 'get_content',
        baseDir: this.rootBase,
        filename: id 
      },
      callback: function(options, success, response) {
        if (success) this.last = id;
        if(typeof callback == "function") callback(success,response.responseText || content);
      },
      scope: this        
    }); 
  }    
});
