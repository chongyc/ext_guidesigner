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
 /**
  * Create node but enabling childeren from Json
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
      for(var i = 0, len = childeren.length; i < len; i++){
       var n = this.createNode(childeren[i]);
       if(n) node.appendChild(n);
      }
      return node;
    }
  }
});