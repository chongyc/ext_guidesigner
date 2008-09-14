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
 * FileControl
 */
Ext.ux.guid.data.FileControl = function(config) {
  Ext.apply(this,config);
  Ext.ux.guid.data.FileControl.superclass.constructor.call(this);
  this.init();
}

Ext.extend(Ext.ux.guid.data.FileControl,Ext.util.Observable,{
  files : {},
  last  : null,
  activeNode : null,
  
  init : function(){
    this.refreshFiles();
  },
  
  refreshFiles : function (callback) {
    this.files = this.files || {};
    if(typeof callback == "function") callback(true);
  },
  
  saveChanges : function(id,action,callback,content) {
    this.files[id] = id;
    if (action=='delete') {
      delete this.files[id];
      if (id==this.last) this.last = null;
    } else {
      this.last = id;
    }
    if(typeof callback == "function") callback(true);
  },

  openFile : function(id,callback,content) {
    this.last = id;
    if(typeof callback == "function") callback(true,content);
  },
  
  
  deleteFile : function(id,callback){
    this.saveChanges(id,'delete',callback);
  },
  
  renameFile : function(fileFrom,fileTo,callback){
    var last = this.last;
    this.openFile(fileFrom,function(success,content) {
      if (success) {
         this.saveChanges(fileTo,'save',function(success){          
           if (success) {              
              this.deleteFile(fileFrom,function(success){
                if (success && last==fileFrom) this.last=fileTo;
                if(typeof callback == "function") callback(success);
              }.createDelegate(this));
           } else if(typeof callback == "function") callback(success);
         }.createDelegate(this),content);
      } else if(typeof callback == "function") callback(success);
    }.createDelegate(this));
  },
  
  saveFile : function(id,content,callback){
    this.saveChanges(id,'save',callback,content);
  },
  
  newFile  : function(id,content,callback){
    this.saveChanges(id,'new',callback,content);
  },
  
  load : function(node, callback,refresh){ 
   if (refresh) {
     this.refreshFiles(function(){
        this.loadNodes(node,false,callback);
      }.createDelegate(this));
   } else {
     this.loadNodes(node,false,callback);
   }
  },
  
  loadNodes : function(node,append,callback){
    this.activeNode = null;
    if (!append) while(node.firstChild) node.removeChild(node.firstChild);
    node.beginUpdate();
    for (var f in this.files){
        var file = this.files[f];
        var path = f.split('/');
        var name = '';
        var cnode = node;
        var n;
        for (var i=0;i<path.length;i++) {
           name += path[i];
           n=null;
           for (var j=0,c=cnode.childNodes;j<c.length && !n;j++) {
             if (c[j].attributes.text==path[i]) n = c[j];
           }
           if (!n) {
             var leaf = (i==path.length-1);             
             n = new Ext.tree.TreeNode({
                     text: (name==this.last ? '<B>' + path[i] + '</B>' : path[i]),
                     cls:  leaf ? 'file' : 'folder' , 
                     leaf : leaf,
                     id  : name
             }); 
             cnode.appendChild(n);
             if (name==this.last) this.activeNode = n;
           }
           cnode = n;
           name += '/' 
        }
    }
    node.endUpdate();
    if(typeof callback == "function")  callback(this.activeNode);   
    return this.activeNode;      
  }

});

