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
 * Constructor of the RepositoryLoader
 */
Ext.ux.guid.tree.RepositoryLoader = function(repository,config) {
  Ext.apply(this,config);
  this.repository = repository;
  Ext.ux.guid.tree.RepositoryLoader.superclass.constructor.call(this);
}

/**
 * Repostiory loader is used to load a repository class into a tree
 */
Ext.extend(Ext.ux.guid.tree.RepositoryLoader,Ext.tree.TreeLoader,{

 /**
  * Load a tree by loading nodes
  * @param {treeNode} node The root node to load data to
  * @param {function} callback Function to be called after loading of nodes finished
  * @param {boolean} refresh When true the underling repository is refresh (default true)
  */
 load : function(node, callback,refresh){
   if (refresh!==false && this.repository) {
     this.repository.refresh(function(){
        this.loadNodes(node,false,callback);
      }.createDelegate(this));
   } else {
     this.loadNodes(node,false,callback);
   }
  },

  /**
   * Internal callback function used load function for items from repository
   * @param {treeNode} node The root node to load data to
   * @param {boolean} append Should data be appended to node
   * @param {function} callback Function to be called after loading of nodes finished
   */
  loadNodes : function(node,append,callback){
    this.activeNode = null;
    if (!append) while(node.firstChild) node.removeChild(node.firstChild);
    node.beginUpdate();
    for (var f in this.repository.items){
        var file = this.repository.items[f];
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
                     text: (name==this.repository.last ? '<B>' + path[i] + '</B>' : path[i]),
                     cls:  leaf ? 'file' : 'folder' ,
                     leaf : leaf,
                     id  : name
             });
             cnode.appendChild(n);
             if (name==this.repository.last) this.activeNode = n;
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