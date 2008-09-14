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
Ext.namespace('Ext.ux.guid.data');  

/*
 * CookieFiles
 */
Ext.ux.guid.data.CookieFiles = Ext.extend(Ext.ux.guid.data.FileControl,{
  
  init : function(){
    this.cookies = new Ext.state.CookieProvider();     
    Ext.ux.guid.data.CookieFiles.superclass.init.call(this);
  },
  
  refreshFiles : function (callback) {
    this.files = this.cookies.get('Designer.files');
    Ext.ux.guid.data.CookieFiles.superclass.refreshFiles.call(this,callback);
  },

  saveChanges : function(id,action,callback,content) {  
    if (content) this.cookies.set('Designer/' + id,escape(content));
    if (action=='delete') this.cookies.clear('Designer.'+id);
    Ext.ux.guid.data.CookieFiles.superclass.saveChanges.call(this,id,action,callback,content);
    this.cookies.set('Designer.files',this.files);
  },

  openFile : function(id,callback) {
    var content = unescape(this.cookies.get('Designer/' + id));
    Ext.ux.guid.data.CookieFiles.superclass.openFile.call(this,id,callback,content)
  }
    
});