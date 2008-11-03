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
 * Constructor for Repository
 */
Ext.ux.guid.data.Repository = function(config) {
  Ext.apply(this,config);
  Ext.ux.guid.data.Repository.superclass.constructor.call(this);
  this.init();
}

/**
 * Abstract class used by designer to connect to a repository.
 * A repository can contain json objects which can be load, saved or appended
 * by the desginer.
 */
Ext.extend(Ext.ux.guid.data.Repository,Ext.util.Observable,{
  //@private The items of the repository
  items : {},
  //@private The last used item within repository
  last  : null,
  /**
   * Relative name used to make url for root item  (default null)
   * @type {String}
   @cfg */
  rootBase : null,
  /**
   * Can a item be changed to url, used by getUrl. (default false)
   * @type {Boolean} 
   @cfg */
  urlSupport : false,
 
  /**
   * Init is called by constructor to init the respository it will call refresh
   */
  init : function(){
    this.refresh();
  },
  
  /**
   * Convert a repositoryId into an url, urlSupport needs to be true
   * @param {String} id The repositoryId to use (default last)
   * @returns {String} The created url or null when not supported
   */
  getUrl : function(id){
    if (!id) id = this.last;
    return (id && this.urlSupport) ? (this.rootBase ? this.rootBase + "/" + id : id) : null;
  },

  /**
   * Refresh the repository
   * @param {function} callback A callback function called with parameter true or false
   * to indicated a succesfull refresh after refresh function is finished
   */
  refresh : function (callback) {
    this.items = this.items || {};
    if(typeof callback == "function") callback(true);
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
    this.items[id] = id;
    if (action=='remove') {
      delete this.items[id];
      if (id==this.last) this.last = null;
    } else {
      this.last = id;
    }
    if(typeof callback == "function") callback(true);
  },

  /**
   * Open a repository item by loading it and pasing the content back to the callback function
   * @param {String} id The repositoryId to use
   * @param {function} callback The callback function to use (boolean state,String content)
   * @param {String} content The content to use as default (optional)
   */
  open : function(id,callback,content) {
    this.last = id;
    if(typeof callback == "function") callback(true,content);
  },

  /**
   * Remove a repository item
   * @param {String} id The repositoryId to use
   * @param {function} callback The callback function to use
   */
  remove : function(id,callback){
    this.saveChanges(id,'remove',callback);
  },

  /**
   * Rename a repository item, by loading from and saving it to and then remove it
   * @param {String} from The source repositoryId
   * @param {String} to The target repositoryId
   * @param {function} callback the callback function
   */
  rename : function(from,to,callback){
    var last = this.last;
    this.open(from,function(success,content) {
      if (success) {
         this.saveChanges(to,'save',function(success){
           if (success) {
              this.remove(from,function(success){
                if (success && last==from) this.last=to;
                if(typeof callback == "function") callback(success,content);
              }.createDelegate(this));
           } else if(typeof callback == "function") callback(success,content);
         }.createDelegate(this),content);
      } else if(typeof callback == "function") callback(success,content);
    }.createDelegate(this));
  },

  /**
   * Save the content to the repository
   * @param {String} id The repositoryId to use
   * @param {String} content The content to store in repository
   * @param {function} callback The callback function to use
   */
  save : function(id,content,callback){
    this.saveChanges(id,(this.items[id] ? 'save' : 'new' ),callback,content);
  }

});

