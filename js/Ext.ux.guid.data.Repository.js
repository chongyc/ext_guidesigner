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
 * Repository
 */
Ext.ux.guid.data.Repository = function(config) {
  Ext.apply(this,config);
  Ext.ux.guid.data.Repository.superclass.constructor.call(this);
  this.init();
}

Ext.extend(Ext.ux.guid.data.Repository,Ext.util.Observable,{
  items : {},
  last  : null,
  //@private relative name used for root
  rootBase : null,
  urlSupport : false,
 
  init : function(){
    this.refresh();
  },
  
  getUrl : function(id){
    if (!id) id = this.last;
    return (id && this.urlSupport) ? (this.rootBase ? this.rootBase + "/" + id : id) : null;
  },

  refresh : function (callback) {
    this.items = this.items || {};
    if(typeof callback == "function") callback(true);
  },

  saveChanges : function(id,action,callback,content) {
    this.items[id] = id;
    if (action=='delete') {
      delete this.items[id];
      if (id==this.last) this.last = null;
    } else {
      this.last = id;
    }
    if(typeof callback == "function") callback(true);
  },

  open : function(id,callback,content) {
    this.last = id;
    if(typeof callback == "function") callback(true,content);
  },


  delete : function(id,callback){
    this.saveChanges(id,'delete',callback);
  },

  rename : function(from,to,callback){
    var last = this.last;
    this.open(from,function(success,content) {
      if (success) {
         this.saveChanges(to,'save',function(success){
           if (success) {
              this.delete(from,function(success){
                if (success && last==from) this.last=to;
                if(typeof callback == "function") callback(success,content);
              }.createDelegate(this));
           } else if(typeof callback == "function") callback(success,content);
         }.createDelegate(this),content);
      } else if(typeof callback == "function") callback(success,content);
    }.createDelegate(this));
  },

  save : function(id,content,callback){
    this.saveChanges(id,(this.items[id] ? 'save' : 'new' ),callback,content);
  }

});

