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

/**
 * CookieRepository extends a repository and can be used to save desginer content
 * in a cookie.
 */
Ext.ux.guid.data.CookieRepository = Ext.extend(Ext.ux.guid.data.Repository,{

  /**
   * Init the cookieProvider
   */
  init : function(){
    this.cookies = new Ext.state.CookieProvider();     
    Ext.ux.guid.data.CookieRepository.superclass.init.call(this);
  },
  
  /**
   * Reload all items from the cookie
   * @param {function} callback A callback function called with parameter true or false
   * to indicated a succesfull refresh after refresh function is finished
   */
  refresh : function (callback) {
    this.items = this.cookies.get('repository.files');
    Ext.ux.guid.data.CookieRepository.superclass.refresh.call(this,callback);
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
    if (content) this.cookies.set('repository/' + id,escape(content));
    if (action=='remove') this.cookies.clear('repository/'+id);
    Ext.ux.guid.data.CookieRepository.superclass.saveChanges.call(this,id,action,callback,content);
    this.cookies.set('repository.files',this.items);
  },

  /**
   * Open a repository item by loading it and pasing the content back to the callback function
   * @param {String} id The repositoryId to use
   * @param {function} callback The callback function to use (boolean state,String content)
   * @param {String} content The content to use as default (optional)
   */
  open : function(id,callback,content) {
    content = unescape(this.cookies.get('repository/' + id)) || content;
    Ext.ux.guid.data.CookieRepository.superclass.open.call(this,id,callback,content);
  }
    
});