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

Ext.namespace('Ext.ux.guid.data');

/*
 * PHPFiles
 */
Ext.ux.guid.data.PHPFiles = Ext.extend(Ext.ux.guid.data.FileControl,{
  url : "phpFiles.php",  
  baseDir : "json",
    
  refreshFiles : function (callback) {
    Ext.Ajax.request({
      url: this.url,
      params: {
         cmd: 'get_files',
         baseDir: this.baseDir
      },            
      callback: function(options, success, response) {
        this.files= success ? Ext.util.JSON.decode(response.responseText) : {};
        if(typeof callback == "function") callback(success);
      },            
      scope: this        
    });    
  },

  saveChanges : function(id,action,callback,content) {  
    Ext.Ajax.request({
       url: this.url,
       params: {
         cmd: 'save_changes',
         baseDir: this.baseDir,
         filename: id,
         action: action,
         content: content
       },
       callback: function(options, success, response) {
         if(success && response.responseText=='1') { 
           if(action=='delete') {
             delete this.files[id];
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

  openFile : function(id,callback) {
    Ext.Ajax.request({
      url: this.url,
      params: {
        cmd: 'get_content',
        baseDir: this.baseDir,
        filename: id 
      },
      callback: function(options, success, response) {
        if (success) this.last = id;
        if(typeof callback == "function") callback(success,response.responseText);
      },
      scope: this        
    }); 
  }    
});
