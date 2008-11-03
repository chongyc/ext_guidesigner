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
Ext.namespace('Ext.ux.guid.tree');

/**
 * Create a tree based on the content of a json file
 * When attr of json item is false a dynamic node is created
 * otherwhise a static tree node is created.
 * If json contains a list called childeren this list will be walked
 * to create childeren in tree
 * By default the treeNodes are not draggable
 */
Ext.ux.guid.tree.JsonTreeLoader = Ext.extend(Ext.tree.TreeLoader,{

  //@private Should caching of pages be disabled
  nocache : false,

 /**
  * Create node but enabling childeren from Json
  * @param {object} attr The attributes from which to created nodes.
  * When attr.childeren also for these childeren nodes are created
  */
  createNode : function(attr){
    var childeren = attr.childeren;
    delete attr.childeren;
    if(this.baseAttrs){
        Ext.applyIf(attr, this.baseAttrs);
    }
    if(this.applyLoader !== false){
        attr.loader = this;
    }
    if(typeof attr.uiProvider == 'string'){
       attr.uiProvider = this.uiProviders[attr.uiProvider] || eval(attr.uiProvider);
    }
    if (!childeren) {
      return(attr.leaf===false ?
            new Ext.tree.AsyncTreeNode(attr) :
            new Ext.tree.TreeNode(attr) );
    } else {
      var node = new Ext.tree.TreeNode(Ext.applyIf(attr,{draggable:false}));
      var self = this;
      for(var i = 0, len = childeren.length; i < len; i++){
       if (Ext.isVersion(childeren[i].isVersion)) {
         if (childeren[i].wizard) { //Check if whe should create a wizard config
           childeren[i]['config'] = function(callback) {
             var w = new Ext.ux.JsonWindow({
                x     : -1000, // Window is hidden by moving X out of screen
                y     : -1000, //Window is hidden by moving Y out of screen
                autoLoad : this.wizard,
                callback : callback,
                modal    : true,
                nocache  : self.nocache 
             });
             w.json.on('error',function(type,exception){
                  Ext.Msg.alert('Wizard Load Error',type +" " + (typeof(exception)=='object' ? exception.message || exception : exception));
                  this.close();
                  return false;
               },w);
             w.show();
           }.createDelegate(childeren[i]);
         }
         var n = this.createNode(childeren[i]);
         if(n) node.appendChild(n);
       }
      }
      return node;
    }
  },

  /**
   * Allow dataUrl to be an  array of URLs to be loaded
   * @param {treeNode} node The treeNode for which to request the data
   * @param {function} callback The callback function
   */
  requestData : function(node, callback){
    if (this.dataUrl instanceof Array) {
       var allUrl = this.dataUrl;
       for (var i=0;i<allUrl.length;i++) {
         this.dataUrl = allUrl[i];
         Ext.ux.guid.tree.JsonTreeLoader.superclass.requestData.call(this,node,callback);
       }
       this.dataUrl = allUrl;
    } else {
       Ext.ux.guid.tree.JsonTreeLoader.superclass.requestData.call(this,node,callback);
    }
  }
});
