/* TODO: 
 -  Make toolbox global if required, so only one exits by screen
 -  Align toolbox, smaller text, smaller icons
 -  Create special property grid which support editing of code objects
 -  Element context menu width delete,resize ?
 -  When moving item change icon to move instead of append
 -  When moving item it cannot moved in it self
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

Ext.override(Ext.form.Label, {   
    onRender : function(ct, position){
        if(!this.el){
            this.el = document.createElement('label');
            this.el.innerHTML = this.text ? Ext.util.Format.htmlEncode(this.text) : (this.html || '');
            if(this.forId){
                this.el.setAttribute('htmlFor', this.forId);
            }
            //Swap the ids, so it becomes selectable in designer
            this.el.id = this.id;
            this.id = this.id + '-';
        }
        Ext.form.Label.superclass.onRender.call(this, ct, position);
    }
});


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
  this.initialConfig = config;
};

Ext.extend(Ext.ux.plugin.Designer, Ext.util.Observable, Ext.applyIf({  
  
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

  /**
   * Enable or disable the usage of customProperties (defaults false). 
   * When disabled only properties which are defined within Ext.ux.Designer.ComponentsDoc.json are available.
   * @type {Boolean}
   @cfg */    
  customProperties  : false, 
  
  
 //Menu buttons
  /**
   * Enable or disable the Copy menu button (defaults true).
   * @type {Boolean}
   @cfg */
  enableCopy : true,
  /**
   * Enable or disable the Show menu button (defaults true).
   * @type {Boolean}
   @cfg */
  enableShow : true,
  /**
   * Enable or disable the Edit Json menu button (defaults true).
   * @type {Boolean}
   @cfg */    
  enableEdit : true,
  /**
   * Enable or disable the Help/Version information menu button (defaults true).
   * @type {Boolean}
   @cfg */    
  enableVersion : true,
  /**
   * Enable or disable the Save file menu button (defaults false).
   * @type {Boolean}
   @cfg */    
  enableSave : false,
  /**
   * Enable or disable the Reload file menu button (defaults false).
   * @type {Boolean}
   @cfg */    
  enableReload: false,

  /**
   * When fullUpdate is set to true the all items changes are applied by creating new object
   * otherwise it will first try to apply changes by using the setMethod
   * @type {Boolean}
   @cfg */
  fullUpdate : false,
  
  //@private Whe tag each json object with a id
  jsonId :  '__JSON__',
  
  licenseText  :  "/* This file is created with Ext.ux.plugin.GuiDesigner */\n",
  
  //@private is the root field editable
  rootEditable : false,
 
  //@private The version of the designer
  version : '2.0.0-beta1',

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
         var cmp = this.selectElement(el);
         if (el.focus) el.focus();
      }, this);
      this.toolbox(this.autoShow);
      this.createConfig();
    }, this);
  },
  
  removeElement : function(source) {
    var own = this.getContainer(source.ownerCt);
    for (var i=0;i<own.items.length;i++) {
      if (own.items.items[i]==source) {
        if (own.codeConfig) own.codeConfig.items.splice(i,1);
        own.remove(source,true);
      }
    }    
  },
  
  /**
   * Append the config to the element
   * @param {Element} el The element to which the config would be added
   * @param {Object} config The config object to be added
   * @return {Component} The component added
   */
  appendConfig : function (el,config,select,dropLocation,source){
    if (!el) return false;

    //Custom function for adding stuff to a container
    var add =  function(src,comp,at,before){
      if(!src.items) src.initItems();
      var c = src.lookupComponent(src.applyDefaults(comp));
      var pos = src.items.length;
      for (var i=0;i<src.items.length;i++) {
        if (src.items.items[i]==at) {
          pos = (before) ? i : i+1;
          i=src.items.length;
        }
      }
      if(src.fireEvent('beforeadd', src, c, pos) !== false && src.onBeforeAdd(c) !== false){
        if (!src.codeConfig) src.codeConfig = this.getConfig(src);
        if (!src.codeConfig.items) src.codeConfig.items =  [];
        if (pos>src.codeConfig.items.length) 
          src.codeConfig.items.push(comp)
        else   
          src.codeConfig.items.splice(pos, 0, comp);
        src.items.insert(pos,c);
        c.ownerCt = src;
        src.fireEvent('add', src, c, pos);
      }
      return c;
    }.createDelegate(this);
    

    if (typeof config == 'function') {
      config.call(this,function(config) {
        this.appendConfig(el,config,true);
      }.createDelegate(this));
    } else if (this.canAppend(el,config)) {
     //Get the config of the items
     var ncmp,ccmp,cmp= this.getDesignElement(el,true);
     var items = this.editableJson(this.clone(config));
     //Find the container that should be changed
     ccmp = this.getContainer(cmp); 
     if (dropLocation == 'appendafter') {
       ncmp=add(ccmp,items,this.activeElement,false);      
     } else if (dropLocation == 'appendbefore') { 
       ncmp=add(ccmp,items,this.activeElement,true);
     } else if (dropLocation == 'moveafter') {
       this.removeElement(source);
       ncmp=add(ccmp,items,this.activeElement,false);      
     } else if (dropLocation == 'movebefore') { 
       this.removeElement(source);
       ncmp=add(ccmp,items,this.activeElement,true);
     } else if (dropLocation == 'move') {
       this.removeElement(source);
       ncmp=add(ccmp,items);
     } else // Append default behavior
        ncmp=add(ccmp,items);
     this.modified = true;     
     if (ccmp.rendered && ccmp.layout && ccmp.layout.layout) ccmp.doLayout();     
     if (select && ncmp) this.selectElement(ncmp);
    }
    return false;
  },
  
  /**
   * Can the config be appended to the element
   * @param {Element} el The element to which the config would be added
   * @param {Object} config The config object to be added
   */
  canAppend : function (el,config) {
    //TODO: Check if we do not add at root container twice
    return true;
  },
  
  /**
   * Create the codeConfig object and apply it to the field
   */
  createConfig : function() {
    if (this.field.items && this.field.items.first()) {
       var items = [];
       while (this.field.items.first()) {
          items.push(this.field.items.first());
          this.field.items.remove(this.field.items.first(), true);
       }       
       //Re create a panel with items from config editable root
       var config = { 'border' : false, 'layout' : this.field.getLayout(),'items' : this.editableJson(items)};
       config[this.jsonId]=Ext.id();
       var el = this.field.add(config);
       el.codeConfig = config;
    }
  },
  
  /** 
   * Get the config of the specified element
   * @param {Element} el The element for which to get the config object
   * @return {Object} The config object 
   */
  getConfig : function (el) {
    el = el || this.field.items.first();
    if (!el) return {};
    if (!el.codeConfig && el[this.jsonId]) {
      var findIn = function(items) {
        if (!items) return null;
        if (items[this.jsonId]==el[this.jsonId]) return items;
        if (items.items) {
          for (var i=0;i<items.items.length;i++) {
            var r = findIn(items.items[i]);
            if (r) return r;
          }
        }
        return null;
      }.createDelegate(this);
      el.codeConfig = findIn(this.codeConfig)
    } 
    return el.codeConfig || el.initialConfig;
  },
  
  /**
   * Set the config to the design element
   * @param {String/Object} json The json to be applied
   * @return {Boolean} true when succesfull applied
   */
  setConfig : function (json) {
    var id = this.activeElement ? this.activeElement[this.jsonId] : null;
    var items = (typeof(json)=='object' ? json : this.decode(json)) || {};
    this.field.codeConfig = this.editableJson(items);
    this.applyJson(items,this.field); //Recreate childs
    this.modified = true;
    this.selectElement(this.findByJsonId(id));
    return true;
  },
  
  /**
   * Refresh the content of the designer
   */
  refresh : function() {
    this.setConfig(this.getConfig());
  },

  //Find parent which is of type container  
  getContainer : function(el) {
    var p = el;
    while (p && p!=this.field && !this.isContainer(p)) p = p.ownerCt;
    return p;
  },
  
  /**
   * Update an element with the changed config
   * @param {Element} element The elmenent to update
   * @param {Object} config The config 
   * @return {Boolean} Indicator that update was applied
   */
  updateElement : function (element,config) {
    var el = element || this.activeElement;
    if (el && (el.modified || config)) {
      try {
        if (this.fullUpdate || this.isContainer(el) || !(config && this.jsonInit(config,el,true))) {
          Ext.apply(this.getConfig(el),config);
          var p = this.isContainer(el) ? this.getContainer(el.ownerCt): this.getContainer(el);
          this.applyJson(this.getConfig(p).items,p);
        }
      } catch (e) { Ext.Msg.alert('Failure', 'Failed to update element' + e); }
      el.modified = false;
      this.modified = true;
      return true;
    }
    return (element && element.modified ? false : true);
  },
  
  /**
   * Select a designElement
   * @param {Element} el The element of the item to select
   * @param {Boolean} fieldOnNull Use the designer field when element not found
   * @return {Component} The selected component
   */
  selectElement : function (el) {
    this.updateElement();
    var cmp = this.getDesignElement(el);
    this.highlightElement(cmp);
    if (cmp) {
      this.activeElement = cmp;
      if (this.propertyGrid) {
        this.propertyFilter();
        this.propertyGrid.enable();
        this.propertyGrid.setSource(this.getConfig(this.activeElement));
      }
    } else {
      if (this.propertyGrid) {
        this.activeConfig = null;
        this.propertyGrid.disable();
        this.propertyGrid.setSource({});
      }
    }
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
   * Check if a element is contained within a other element
   * @param {Element} cmp The component to search
   * @param {Element} container The component to search within
   * @return {Component} The ExtJs component found, false when not valid
   */  
  isElementOf : function(cmp,container) {
    container = container || this.field;
    var loops = 50,c = cmp,id = container.getId();
    while (loops && c) {
      if (c.id == id) return cmp;
      c = c.ownerCt;
      loops--;
    }
    return false;
  },
    
  /**
   * Find a designElement, this is a ExtJs component which is embedded within this.field
   * @param {Element} el The element to search the designelement for
   * @return {Component} The ExtJs component found, false when not valid
   */
  getDesignElement : function(el,allowField) {
    var cmp,loops = 10;
    while (loops && el) {
      cmp = Ext.getCmp(el.id);
      if (cmp) {
        if (!allowField && cmp == this.field) return false;
        return this.isElementOf(cmp,this.field) ? cmp : (allowField ? this.field : false);
      }
      el = el.parentNode;
      loops--;
    }
    return allowField ? this.field : false;
  },
  
  findByJsonId : function(id) {
     return this.field.findBy(function (c,p) {return (c[this.jsonId]==id ? true : false);},this)[0];
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
         clone:(e.shiftKey),
         internal : true,
         source   : cmp
       }; 
     }
  },
  
  /**
   * Check if the given component is a container which can contain other xtypes
   * @param {Component} cmp The component to validate if it is in the list
   * @return {Boolean} True indicates the xtype is a container capable of contain other elements
   */
  isContainer : function (cmp) {
    return cmp instanceof Ext.Container;
    /*var xtype = cmp ? cmp.xtype : null;
    return  (xtype && ['jsonpanel','panel','viewport','form','window','tabpanel','toolbar','fieldset'].indexOf(xtype) !== -1);*/
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
      var cmp = this.getDesignElement(this.getTarget(e),true);
      if (this.canAppend(cmp)) {
        this.selectElement(cmp);
        //"x-tree-drop-ok-above" "x-tree-drop-ok-between" "x-tree-drop-ok-below"        
        var el=cmp.getEl();
        if (data.internal && !data.clone) {
          //Only allow move if not within same container
          if (this.isElementOf(cmp,data.source,true)) return false;
          data.drop = this.isContainer(cmp) ? "move" : 
           (el.getX()+(el.getWidth()/2)>Ext.lib.Event.getPageX(e) ? "movebefore" : "moveafter");
          return (data.drop=='movebefore' ?  "icon-element-move-before" :
            (data.drop=='moveafter'  ? "icon-element-move-after"  : "icon-element-move"));
        } else {
          data.drop = this.isContainer(cmp) ? "append" : 
           (el.getX()+(el.getWidth()/2)>Ext.lib.Event.getPageX(e) ? "appendbefore" : "appendafter");
          return (data.drop=='appendbefore' ?  "icon-element-add-before" :
            (data.drop=='appendafter'  ? "icon-element-add-after"  : "icon-element-add"));
        }
      }
    }
    data.drop = null;
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
    if (data.config && !data.processed && data.drop) {
      this.appendConfig(el,data.config,true,data.drop,data.source);
      data.processed = true;
    }
    return true;  
  },
  
  /**
   * @private Function called to initalize the property editor which can be used to edit properties
   * @param {PropertyGrid} propertyGrid The property grid which is used to edit
   */
  setPropertyGrid : function(propertyGrid) {
    this.propertyGrid = propertyGrid;
    propertyGrid.store.on('update', function(s,r,t) {
      if (t == Ext.data.Record.EDIT) {
        var change = {}; change[r.id] = r.data.changeValue || r.data.value;
        this.updateElement(this.activeElement,change);
        this.selectElement(this.findByJsonId(this.activeElement[this.jsonId]));
      }
    }, this, {buffer:100});
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
        this.toolboxPath = path;
        this.toolboxJson = path + 'Ext.ux.plugin.Designer.json';
        this.properties = new Ext.data.JsonStore({
            url: this.toolboxPath + 'Ext.ux.plugin.Designer.Properties.json',
            sortInfo : {field:'name',order:'ASC'},
            root: 'properties',
            fields: ['name', 'type','default','desc','instance','editable','values']
        });
        this.properties.load();
        //Add Filter function based on instance
        var filterByFn = function(rec,id) {
          var i = rec.get('instance');
          if (i) return eval('this.activeElement instanceof ' +i);
          return true;
        }.createDelegate(this);
        this.propertyFilter = function (){
          this.properties.filterBy(filterByFn,this);
        };
      }
      var tools = 
      this.toolboxTarget = Ext.getCmp(this.toolboxTarget);
      if (this.toolboxTarget){
        this._toolbox = this.toolboxTarget;
        this._toolbox.add(new Ext.ux.JsonPanel({
            autoLoad:this.toolboxJson,
            disableCaching :this.disableCaching,
            scope   : this })
        );
      } else {
        this._toolbox = new Ext.ux.JsonWindow({
            autoLoad:this.toolboxJson,
            disableCaching :this.disableCaching,
            scope   : this,
            closable: false
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

},Ext.ux.JSON));
