/* TODO: 
 -  Make toolbox global if required, so only one exits by screen
 -  Align toolbox, smaller text, smaller icons
 -  Fit the add combo box over screen  
 -  Build new decode,encode removing attribute trick and _node
 */  

 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This plugin used to edit a panel
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

Ext.namespace('Ext.ux.tree');
Ext.ux.tree.JsonTreeLoader = Ext.extend(Ext.tree.TreeLoader,{
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

Ext.namespace('Ext.ux.plugin');

//Is not registered but required by designer
Ext.reg('propertygrid', Ext.grid.PropertyGrid);

/*
Ext.ux.plugin.DesignerWizard = function(json){
  var cache = {};
  return function(callback) {
     if (!cache[json]) {  
      cache[json] = new Ext.ux.JsonPanel({autoLoad:json,updateOwner:true});
     }
     cache[json].callback = callback;
     (new Ext.Window(cache[json])).show();
  }
}
*/

/** Create a desginer */
Ext.ux.plugin.Designer = function(config){
  Ext.apply(this, config);
  Ext.ux.plugin.Designer.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.plugin.Designer, Ext.util.Observable, {  
  
  /**
   * When true the toolbox is show on init
   * @type {Boolean}
   @cfg */
  autoShow : true,
  
  /** 
   * Should caching be disabled when JSON are loaded (defaults false).   
   * @type {Boolean} 
   @cfg */
  disableCaching: false, 
  
  /**
   * When toolboxTarget is set, this will be used to render toolbox to not window
   * @type {String/Element}
   @cfg */
  toolboxTarget : false, 
  
  /**
   * Url used to load toolbox json from defaults to <this.file>/Ext.ux.plugin.Designer.json
   * @type {String} 
   @cfg */
  toolboxJson   : false,
 
  //@private The version of the designer
  version : '0.1.0',

  /**
   * Init the plugin ad assoiate it to a field
   * @param {Component} field The component to connect this plugin to
   */
  init: function(field) {
    Ext.QuickTips.init();
    this.field = field;
    
    this.addEvents({
      /**
       * Fires before the toolbox is shown, returning false will disable show
       * @event beforeshow
       * @param {Object} toolbox The toolbox window
       */
      'beforeshow' : true,
      /**
       * Fires before the toolbox is hidden, returning false will cancel hide
       * @event beforehide
       * @param {Object} toolbox The toolbox window
       */
      'beforehide' : true
    });
    
    
    //Init the components drag & drop and toolbox when it is rendered
    this.field.on('render', function() {    
      this.drag = new Ext.dd.DragZone(this.field.el, {
        ddGroup:'designerddgroup',
        getDragData     : this.getDragData.createDelegate(this)
      });
      this.drop = new Ext.dd.DropZone(this.field.el, {
        ddGroup:'designerddgroup',
        notifyOver : this.notifyOver.createDelegate(this),
        notifyDrop : this.notifyDrop.createDelegate(this)
      });
      this.field.el.on('click', function(e,el) {
         var cmp = this.selectElement(el,true);
         if (el.focus) el.focus();
      }, this);
      this.toolbox(this.autoShow);
    }, this);
  },
  
  /**
   * Append the config to the element
   * @param {Element} el The element to which the config would be added
   * @param {Object} config The config object to be added
   * @return {Component} The component added
   */
  appendConfig : function (el,config,highlight){
    if (typeof config == 'function') {
      config.call(this,function(config) {
        this.appendConfig(el,config,true);
      }.createDelegate(this));
    } else if (this.canAppend(el,config)) {
     var cmp = this.getDesignElement(el);
     config = this.tools.clone(config);
     alert(this.tools.encode(config));
     if (highlight) this.highlightElement(cmp);
    }
    return null;
  },
  
  /**
   * Can the config be appended to the element
   * @param {Element} el The element to which the config would be added
   * @param {Object} config The config object to be added
   */
  canAppend : function (el,config) {
    return true;
  },
  
  /**
   * Select a designElement
   * @param {Element} el The element of the item to select
   * @param {Boolean} fieldOnNull Use the designer field when element not found
   * @return {Component} The selected component
   */
  selectElement : function (el,fieldOnNull) {
    var cmp = this.getDesignElement(el,fieldOnNull);
    this.highlightElement(cmp);
    return cmp;
  },

  /**
   * Highlight a element within the component, removing old highlight
   * @param {Element} el The element to highlight
   * @return {Boolean} True when element highlighted
   */
  highlightElement : function (el) {
    //Remove old highlight and drag support
    this.field.el.removeClass('selectedElement');
    this.field.el.select('.selectedElement').removeClass('selectedElement');
    this.field.el.select('.designerddgroup').removeClass('designerddgroup');
    if (el) {
      el.addClass("selectedElement");
      if (el.id != this.field.id) el.addClass("designerddgroup");
      return true;
    }
    return false;
  },
    
  /**
   * Check component is child of the designer
   * @param {Component} cmp The component to check if this is within field
   * @return {Component} The component when is is within the field otherwise null
   */
  isChildOfDesigner : function (cmp) {
    var c = cmp,loops = 100;
    var id = this.field.getId();
    while (loops && c) {
      if (c.id == id) return cmp;
      c = c.ownerCt;
      loops--;
    }
    return null;
  },

  /**
   * Find a designElement, this is a ExtJs component which is embedded within this.field
   * @param {Element} el The element to search the designelement for
   * @return {Component} The ExtJs component found, null when not valid
   */
  getDesignElement : function(el,fieldOnNull) {
    var cmp,loops = 10;
    while (loops && el) {
      cmp = Ext.getCmp(el.id);
      if (cmp) return this.isChildOfDesigner(cmp);
      el = el.parentNode;
      loops--;
    }
    return (fieldOnNull ? this.field  : null);
  },
  
  /**
   * Create the drag data for a element on designerpanel
   * @param {Event} e The drag event
   * @return {Object} the drag data
   */
  getDragData : function(e) {
     var cmp = this.selectElement(e.getTarget());
     var el = e.getTarget('.designerddgroup');
     if (el && cmp) { 
       return {
         ddel:el,
         config : cmp.initialConfig,
         clone:(e.shiftKey)
       }; 
     }
  },
  
  /**
   * Check if the given component is a container which can contain other xtypes
   * @param {Component} cmp The component to validate if it is in the list
   * @return {Boolean} True indicates the xtype is a container capable of contain other elements
   */
  isContainer : function (cmp) {
    var xtype = cmp ? cmp.xtype : null;
    return  (xtype && ['jsonpanel','panel','viewport','form','window','tabpanel','toolbar','fieldset'].indexOf(xtype) !== -1);
  },
  
  /**
   * @private Fix a problem in firefox with drop getTarget by finding a component 
   * using xy coordinates. 
   * @param {Event} event The event for which a node should be searched
   * @return {Node} The node that is located by xy coordinates or null when none.
   */
  getTarget : function (event) {
    if (!event) return;
    if (!Ext.isGecko) event.getTarget();
    var n,findNode = function(c,p) {
      if (c && c.getPosition && c.getSize) {
       var pos = c.getPosition();
       var size = c.getSize();
       if (event.xy[0] >= pos[0] && event.xy[0]<=pos[0] + size.width &&
           event.xy[1] >= pos[1] && event.xy[1]<=pos[1] + size.height) {
         n = c
         if (c.findBy) c.findBy(findNode);
       }
      }
    };
    findNode(this.field);
    return n;
  },
  
  /**
   * Called when a element is dragged over the component
   * @param {Object} src The source element
   * @param {Event} e The drag event 
   * @param {Object} data The dataobject of event
   * @return {Boolean} return true to accept or false to reject 
   */
  notifyOver : function (src,e,data) {
    if (data.config) {
      var cmp = this.getDesignElement(this.getTarget(e));
      if (this.canAppend(cmp)) {
        this.selectElement(cmp);
        //"x-tree-drop-ok-above" "x-tree-drop-ok-between" "x-tree-drop-ok-below"        
        var el=cmp.getEl();
        data.drop = this.isContainer(cmp) ? "append" : 
           (el.getX()+(el.getWidth()/2)>Ext.lib.Event.getPageX(e) ? "before" : "after");
        //TODO: Find Child to add, incase of append
        return (data.drop=='before' ?  "x-tree-drop-ok-above" :
               (data.drop=='after'  ? "x-tree-drop-ok-below"  : "x-tree-drop-ok-append"));
      }
    }
    return false;
  },
  
  /**
   * Called when a element is dropped on the component
   * @param {Object} src The source element
   * @param {Event} e The drag event 
   * @param {Object} data The dataobject of event
   * @return {Boolean} return true to accept or false to reject 
   */
  notifyDrop : function (src,e,data) {
    var el=this.getTarget(e);
    if (data.config && !data.processed) {
      this.appendConfig(el,data.config,true);
      data.processed = true;
    }
    return true;  
  },
  
  /**
   * Show or hide the toolbox
   * @param {Boolean} visible Should toolbox be hidden or shown (defaults true)
   */
  toolbox : function(visible){
    if (!this._toolbox) {
      if (!this.toolboxJson) {
        //Locate the designer javascript file
        var elements = document.getElementsByTagName("script");
        var path ='';
        for (var i=0;i<elements.length;i++) {
          var s = elements[i].src ? elements[i].src : elements[i].id;
          if (s.match(/Ext.ux.plugin.Designer\.js(\?.*)?$/)) {
            path = s.replace(/Ext.ux.plugin.Designer\.js(\?.*)?$/,'');
          }
        }
        this.toolboxJson = path + 'Ext.ux.plugin.Designer.json';
      }
      this.tools = new Ext.ux.JsonPanel({ autoLoad:this.toolboxJson,
                                       disableCaching :this.disableCaching,
                                       scope   : this });
      this.toolboxTarget = Ext.getCmp(this.toolboxTarget);
      if (this.toolboxTarget){
        this._toolbox = this.toolboxTarget;
        this._toolbox.add(this.tools);
      } else {
       this._toolbox = new Ext.Window({
         closeAction: 'hide', 
         title : 'Designer Toolbox',
         layout: 'fit',
         border: false,
         width : 215,
         height: 350,
         items : this.tools
       });
      }
    }
    //Now show or hide the toolbox
    if (visible || visible === true) {
      if (this.fireEvent('beforeshow',this._toolbox)) this._toolbox.show();
    } else {
      if (this.fireEvent('beforehide',this._toolbox)) this._toolbox.hide();
    }
  }

});
