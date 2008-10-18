 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Contributions by : SamuraiJack
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

Ext.namespace('Ext.ux.guid.plugin');

/**
 * Create a desginer
 */
Ext.ux.guid.plugin.Designer = function(config){
  Ext.ux.guid.plugin.Designer.superclass.constructor.call(this,config);
  this.initialConfig = config;
};

Ext.extend(Ext.ux.guid.plugin.Designer, Ext.ux.Json, {

  /**
   * When true the toolbox is show on init
   * @type {Boolean}
   @cfg */
  autoShow : true,

  /**
   * Should caching be disabled when JSON are loaded (defaults false).
   * @type {Boolean}
   @cfg */
   nocache : false,

  /**
   * When toolboxTarget is set, this will be used to render toolbox to not window
   * @type {String/Element}
   @cfg */
  toolboxTarget : false,

  /**
   * Url used to load toolbox json from defaults to <this.file>/Ext.ux.guid.plugin.Designer.json
   * @type {String}
   @cfg */
  toolboxJson   : 'js/Ext.ux.guid.plugin.Designer.json',

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
   * An array of property defintion to add to default (propertyDefinitions)
   * @type {Array}
   @cfg */
  propertyDefinitionFiles : null,

  /**
   * @private Internal array with all files with property defintions to load
   */
  propertyDefinitions : ['js/Ext.ux.guid.plugin.Designer.Properties.json'],

  /**
   * An array of files with additional components
   */
  componentFiles : null,

  /**
   *@private Internal array with all files with components to load
   */
  components : ['js/Ext.ux.guid.plugin.Designer.Components.json'],

  /**
   * An url specifing the json to load
   * @type {Url}
   @cfg */
  autoLoad :  false,

  //@private Whe tag each json object with a id
  jsonId :  '__JSON__',

  
  //@private The version of the designer
  version : '2.1.0-RC1',

  //@private The licenseText used
  licenseText  :  "/* This file is created or modified with \n * Ext.ux.guid.plugin.GuiDesigner (v{0}) \n */",

  //@private The id for button undo
  undoBtnId  : Ext.id(),

  //@private The id for button undo
  redoBtnId  : Ext.id(),

  //@private The maximum number of undo histories to keep
  undoHistoryMax : 20,
  //@private The history for undo
  undoHistory : [],
  //@private The marker for active undo
  undoHistoryMark : 0,

  /**
   * A file control config item
   */
  fileControl : null,
  
  /**
   * Should it use codePress as code editor (defaults true)
   * @type {Boolean}
   @cfg */
  codePress : !Ext.isSafari, //codePress enabled by default when not Safari/Chrome

  /**
   * Called from within the constructor allowing to initialize the parser
   */
  initialize: function() {
    Ext.ux.guid.plugin.Designer.superclass.initialize.call(this);
    this.licenseText=String.format(this.licenseText,this.version);
    Ext.QuickTips.init();
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
      'beforehide' : true,
      /**
       * Fires after a item is added to designer
       * @event add
       */
      'add' : true,
      /**
       * Fires after a item is removed from designer
       * @event remove
       */
      'remove' : true,
      /**
       * Fires after a item is changed in designer
       * @event change
       */
      'change' : true,
      /**
       * Fires after a new configuration is loaded into the designer
       * @event newconfig
       */
      'newconfig': true,
      /**
       * Fires after a item is selected in designer
       * @event add
       */
      'selectelement'   : true,
      /**
       * Fires after loadConfig fails
       * @event loadfailed
       * @param {Url} url The url tried to load
       * @param {Object} response Response object
       */
      'loadfailed' : false
    });
   },

  /**
   * Init the plugin ad assoiate it to a field
   * @param {Component} field The component to connect this plugin to
   */
  init: function(field) {
    this.container = field;
    this.container.codeConfig={};

    //Init the components drag & drop and toolbox when it is rendered
    this.container.on('render', function() {
      //Drag Drop
      this.drag = new Ext.dd.DragZone(this.container.el, {
        ddGroup:'designerddgroup',
        getDragData     : this.getDragData.createDelegate(this)
      });
      this.drop = new Ext.dd.DropZone(this.container.el, {
        ddGroup:'designerddgroup',
        notifyOver : this.notifyOver.createDelegate(this),
        notifyDrop : this.notifyDrop.createDelegate(this)
      });
      //Focus element
      this.container.el.on('click', function(e,el) {
         var cmp = this.selectElement(el);
         if (el.focus) el.focus();
      }, this);
      //Visual resize
      this.resizeLayer = new Ext.Layer({cls:'resizeLayer',html:'Resize me'});
      this.resizeLayer.setOpacity(0.7);
      this.resizeLayer.resizer = new Ext.Resizable(this.resizeLayer, {
         handles:'se,s,e',
         draggable:true,
         dynamic:true,
         pinned:true});
      this.resizeLayer.resizer.dd.lock();
      this.resizeLayer.resizer.on('resize', this.resizeElement,this);
      this.resizeLayer.resizer.dd.endDrag = this.moveElement.createDelegate(this);
      //Toolbox
      this.toolbox(this.autoShow);
      //Empty desinger
      this.createConfig();
      //Context Menu
      this.initContextMenu();
      // Check if whe have to load a external file
      if (this.autoLoad) {
       if (typeof this.autoLoad !== 'object')  this.autoLoad = {url: this.autoLoad};
       if (typeof this.autoLoad['nocache'] == 'undefined') this.autoLoad['nocache'] = this.nocache;
       this.loadConfig(this.autoLoad.url);
      }
    }, this);
  },


  /**
   * Create the context menu for a selected element
   */
  initContextMenu : function () {
    var contextMenu = new Ext.menu.Menu({items:[{
          text    : 'Delete this element',
          iconCls : 'icon-deleteEl',
          scope   : this,
          handler : function(item) {
              this.removeElement(contextMenu.element);
            }
        },{
        text    : 'Visual resize / move',
        tooltip : 'Visual resize the element.<br/>You can move it too if in an <b>absolute</b> layout',
        iconCls : 'icon-resize',
        scope   : this,
        handler : function(item) {
            this.visualResize(contextMenu.element);
          }
        }]});
      this.container.el.on('contextmenu', function(e) {
          e.preventDefault();
          var el = this.getDesignElement(this.getTarget(e));
          if (el) {
            contextMenu.element = el;
            contextMenu.showAt(e.getXY());
          }
      }, this);
  },

  /**
   * Start resize of an element, it will become active element
   * @param {Element} element The element to resize
   */
  visualResize : function(element) {
    var cmp= this.selectElement(element);
    if (!cmp) return;
    var own = this.getContainer(cmp.ownerCt);
    var layout = own.codeConfig ? own.codeConfig.layout : null;
    if (layout=='fit') {
     this.fireEvent('error','visualResize','Cannot resize element within fit layout');
    } else {
      //Incase of absolute layout enable movement within element
      if (layout=='absolute') {
        this.resizeLayer.resizer.dd.unlock();
        this.resizeLayer.resizer.dd.constrainTo(own.body);
      } else {
        this.resizeLayer.resizer.dd.lock();
      }
      this.resizeLayer.setBox(cmp.el.getBox());
      this.resizeLayer.show();
    }
  },

  /**
   * Move a element within absolute layout based on drag event of the resize layer
   */
  moveElement : function() {
    var cmp = this.activeElement;
    var pos = this.resizeLayer.getXY();
    var oPos = this.getContainer(cmp.ownerCt).body.getXY();
    this.markUndo();
    cmp.codeConfig.x = pos[0] - oPos[0];
    cmp.codeConfig.y = pos[1] - oPos[1];
    this.redrawElement();
  },

  /**
   * resize an element based on the resize of resizelayer
   * @param {} r
   * @param {int} w New width of element
   * @param {int] h New height of element
   */
  resizeElement : function(r,w,h) {
    var cmp = this.activeElement;
    var s = cmp.el.getSize();
    this.markUndo();
    if (s.width != w) {
      cmp.codeConfig.width = w;
      delete cmp.codeConfig.columnWidth;
    }
    if (s.height !=h) {
      cmp.codeConfig.height = h;
      delete cmp.codeConfig.autoHeight;
    }
    this.redrawElement();
  },

  /**
   * Remove an element
   * @param {Element} source The element to remove
   * @param {Boolean\String} internal When true no remove event and redraw is fired,
   * when "noundo" no undo is created (defaults false)
   * @return {Boolean} Indicator telling element was removed
   */
  removeElement : function(source,internal) {
    if (!source) return false;
    var own = this.getContainer(source.ownerCt);
    if (!internal) this.markUndo();
    for (var i=0;i<own.items.length;i++) {
      if (own.items.items[i]==source) {
        own.codeConfig.items.splice(i,1);
        if (own.codeConfig.items.length==0) delete own.codeConfig.items;
        if (!internal || internal=="noundo") {
          this.redrawElement(own);
          this.fireEvent('remove');
        } else {
          this.redrawContainer = true;
        }
        return true;
      }
    }
    return false;
  },

  /**
   * Update the menu buttons for undo and redo
   */
  menuUpdate : function(){
    var menu = Ext.getCmp(this.undoBtnId);
    if (menu) if (this.undoHistoryMark>0) menu.enable(); else menu.disable();
    menu = Ext.getCmp(this.redoBtnId);
    if (menu) if (this.undoHistory.length>this.undoHistoryMark+1) menu.enable(); else menu.disable();
  },

  /**
   * Mark a configuration for undo
   */
  markUndo : function() {
    while (this.undoHistory.length>this.undoHistoryMark) this.undoHistory.pop();
    this.undoHistory.push({config : this.encode(this.getConfig(),0,true),activeId: this.getJsonId()});
    while (this.undoHistory.length > this.undoHistoryMax) this.undoHistory.shift();
    this.undoHistoryMark = this.undoHistory.length;
    this.menuUpdate();
  },

  /**
   * Undo a configuration
   */
  undo : function(){
    if (this.undoHistoryMark>0) {
      if (this.undoHistoryMark==this.undoHistory.length) {
        //Make sure whe have point to recover incase of redo
        this.undoHistory.push({config:this.encode(this.getConfig(),0,true),activeId : this.getJsonId()});
        this.undoHistoryMark = this.undoHistory.length-1;
      }
      this.undoHistoryMark--;
      var undoObj =this.undoHistory[this.undoHistoryMark];
      this.setConfig(undoObj.config,true);
      this.selectElement(undoObj.activeId);
      this.menuUpdate();
    }
  },

  /**
   * Redo an undo configuration
   */
  redo : function(){
    if (this.undoHistory.length>this.undoHistoryMark+1) {
      this.undoHistoryMark++;
      var redoObj = this.undoHistory[this.undoHistoryMark];
      this.setConfig(redoObj.config,true);
      this.selectElement(redoObj.activeId);
      this.menuUpdate();
    }
  },

  /**
   * Append the config to the element
   * @param {Element} el The element to which the config would be added
   * @param {Object} config The config object to be added
   * @param {Boolean} select Should item be selected
   * @param {String} dropLocation The operation to perform
   * @param {Object} source The source used to perform operation
   * @param {Object} extraConfig A extra config that should be added to config
   * @return {Component} The component added
   */
  appendConfig : function (el,config,select,dropLocation,source,extraConfig){
    if (!el) return false;
    this.markUndo();

    //Custom function for adding stuff to a container
    var add =  function(src,comp,at,before){
      if(!src.items) src.initItems();
      var pos = src.items.length;
      for (var i=0;i<src.items.length;i++) {
        if (src.items.items[i]==at) {
          pos = (before) ? i : i+1;
          i=src.items.length;
        }
      }
      if (!src.codeConfig.items || !(src.codeConfig.items instanceof Array))
          src.codeConfig.items =  [];
      delete src.codeConfig.html; //items and html go not together in IE
      if (pos>src.codeConfig.items.length)
        src.codeConfig.items.push(comp)
      else
        src.codeConfig.items.splice(pos, 0, comp);
    }.createDelegate(this);


    if (typeof config == 'function') {
      config.call(this,function(config) {
        this.appendConfig(el,config,true,dropLocation,source,extraConfig);
      }.createDelegate(this),this);
    } else {
     //Get the config of the items
     var ccmp,cmp= this.getDesignElement(el,true);
     var items = this.editable(Ext.applyIf(this.clone(config),extraConfig || {}));
     //Transform a config to prevent errors
     var transformAppend = function(cmp,last){
       if (!cmp) return;
       //Transform form to layout if allready contained
       if (items.xtype=='form' && cmp instanceof Ext.form.FormPanel) {
         delete items.xtype;
         items.layout='form';
       }
       transformAppend(this.getContainer(cmp.ownerCt),cmp);
     }.createDelegate(this);
     transformAppend(cmp);
     //Find the container that should be changed
     ccmp = this.getContainer(cmp);
     switch (dropLocation) {
       case 'abovecode' :
       case 'belowcode' :
         ccmp = this.isContainer(cmp) ? this.getContainer(cmp.ownerCt) : ccmp;
       case 'appendcode' :
         this.removeElement(source,true);
         add(ccmp,items,cmp,dropLocation=='abovecode');
         break;
       case  'appendafter' :
         add(ccmp,items,cmp,false);
         break;
       case 'appendbefore' :
         add(ccmp,items,cmp,true);
         break;
       case 'moveafter' :
         this.removeElement(source,true);
         add(ccmp,items,cmp,false);
         break;
       case 'movebefore' :
         this.removeElement(source,true);
         add(ccmp,items,cmp,true);
         break;
       case 'move' :
         this.removeElement(source,true);
         add(ccmp,items);
         break;
       default :
        add(ccmp,items);
     }
     this.modified = true;
     this.fireEvent('add');
     this.redrawElement(ccmp,items[this.jsonId]);
    }
    return false;
  },

  /**
   * Create the codeConfig object and apply it to the field
   */
  createConfig : function() {
    if (this.container.items && this.container.items.first()) {
       var items = [];
       while (this.container.items.first()) {
          items.push(this.container.items.first());
          this.container.items.remove(this.container.items.first());
       }
       //Re create a panel with items from config editable root
       var config = { 'border' : false, 'layout' : this.container.getLayout(),'items' : this.editable(items)};
       config[this.jsonId]=Ext.id();
       var el = this.container.add(config);
       el.codeConfig = config;
    }
  },

  /**
   * Load a config from URL
   * @param {Element} el The url to load
   */
  loadConfig : function (url) {
    if (this.loadMask && this.container.ownerCt)
      this.container.ownerCt.el.mask(this.loadMsg, this.msgCls);
     Ext.Ajax.request({
      url: url,
      method : 'GET',
      callback: function(options, success, response){
        if (success) {
         this.setConfig(response.responseText,false);
         this.modified = false;
        } else {
         if (!this.fireEvent('loadfailed',url,response))
            Ext.Msg.alert('Failure','Failed to load url :' + url);
        }
        if (this.loadMask && this.container.ownerCt)
           this.container.ownerCt.el.unmask();
      },
      scope: this
     });
  },

  /**
    * Get the config as string of the specified element
    * @param {Element} el The element for which to get the config object
    * @return {String} The config string
    */
  getCode : function(el) {
   return this.encode(this.getConfig(el));
  },

 /**
   * Function require is used to checks if the required files are loaded
   * when not the files are loaded. Loaded files are added to required_js and required_css
   * @param {Mixed} packages An array or ; seperated string with packages to load
   * @param {Mixed} options An object with options to used, when string then basedir is assumed
   * options[basedir] The default directory to use for all files
   * options[cssdir] The directory to be used for stylesheets
   * options[async] When set to true required will return directly
   * options[callback] Callback function after all required files are loaded
   * options[reload] When reload is set packages are reloaded
   * options[cachingOff] When set the object caching is turned off
   * @return {Object} a object with keys js and css contain an array with full path of items
   */
  require : function(packages,options){
    var ret = Ext.ux.guid.plugin.Designer.superclass.require.call(this,packages,options);
    if (ret.js.length || ret.css.length) {
      var cfg = (this.container.items && this.container.items.items.length==1) ?
             this.getConfig(this.container.items.items[0]) : {};
      //Check if root is a array with more then one element, if so skip
       if (!cfg.json) cfg.json = {};
       //Parse original so if can be reused as base
       var myEncoder = new Ext.ux.Json({jsonId : this.jsonId});
       var o = myEncoder.decode(cfg[this.jsonId + "json"]) || {};
       var a = cfg.json && cfg.json.required_js ? cfg.json.required_js.split(';') :[];
       for (var i=0;i<a.length;i++) if (ret.js.indexOf(a[i])==-1) ret.js.push(a[i]);
       if (ret.js.length!=0) o.required_js=cfg.json.required_js=ret.js.join(';');
       a = cfg.json && cfg.json.required_css ? cfg.json.required_css.split(';') :[];
       for (var i=0;i<a.length;i++) if (ret.css.indexOf(a[i])==-1) ret.css.push(a[i]);
       if (ret.css.length!=0) o.required_css=cfg.json.required_css=ret.css.join(';');
       cfg[this.jsonId+"json"]=myEncoder.encode(o);
       if (!(this.container.items && this.container.items.items.length==1)) ret['cfg']=cfg;
    }
    return ret;
  },

  /**
   * Get the config of the specified element
   * @param {Element} el The element for which to get the config object
   * @return {Object} The config object
   */
  getConfig : function (el) {
    if (!el && this.container.items) {
      el = this.container.items.items;
      //Check if root is a array with more then one element, if so return array
      if (el.length>1) {
        var arr = [];
        for (var i=0;i<el.length;i++) {
          arr.push(this.getConfig(el[i]));
        }
        return arr;
      }
      el = el[0];
    }
    if (!el) return {};
    if (!el.codeConfig && el[this.jsonId]) {
      var findIn = function(o) {
        if (!o) return null;
        if (o[this.jsonId]==el[this.jsonId]) return o;
        if (o.items) {
          for (var i=0;i<o.items.length;i++) {
            var r = findIn(o.items[i]);
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
   * @param {Boolean} noUndo When true no undo will be created
   * @return {Boolean} true when succesfull applied
   */
  setConfig : function (json,noUndo) {
    if (!noUndo) this.markUndo();
    var items = (typeof(json)=='object' ? json : this.decode(json)) || null;
    this.container.codeConfig.items= (items instanceof Array ? this.editable(items) : [this.editable(items)]);
    this.redrawElement(this.container);
    this.modified = true;
    this.fireEvent('newconfig');
    return true;
  },

  /**
   * Refresh the content of the designer
   */
  refresh : function() {
    this.redrawElement(this.container);
  },

  /**
   * Find parent which is of type container
   * @param {Element} el The element for which to find the contrainer
   * @return {Container} The container found
   */
  getContainer : function(el) {
    var p = el;
    while (p && p!=this.container && !this.isContainer(p)) p = p.ownerCt;
    if (p && !p.codeConfig) p.codeConfig = this.getConfig(p);
    return p;
  },

  /**
   * Get the json id of the (active) element
   * @param {Element} el The element (default to activeElement)
   * @return {String} The json id of the active element
   */
  getJsonId : function(el) {
    el = el || this.activeElement;
    if (!el) return null;
    return el[this.jsonId] ? el[this.jsonId] : null;
  },

  /**
   * redraw an element with the changed config
   * @param {Element} element The elmenent to update
   * @param {Object} config The config
   * @return {Boolean} Indicator that update was applied
   */
  redrawElement : function (element,selectId) {
    var el = element || this.activeElement;
    if (el) {
      try {
        var id = selectId || this.getJsonId();
        var p = this.container; //Redraw whole canvas
        if (!this.redrawContainer && el!=p) {
           //Check if whe can find parent which can be redraw
           var c = '';
           p = this.getContainer(el);
           //Search if whe find a layout capable contianer
           while (p!=this.container && !c) {
             c = p.codeConfig.layout;
             p = this.getContainer(p.ownerCt);
           }
        }
        this.apply(p,this.getConfig(p).items);
        this.redrawContainer=false;
        this.selectElement(id);
      } catch (e) {
         if (this.fireEvent('error','redrawElement',e))
              Ext.Msg.alert('Failure', 'Failed to redraw element ' + e);
         return false;
      }
      this.fireEvent('change',el);
      this.modified = true;
      return true;
    }
    return  false;
  },


  /**
   * Select a designElement
   * @param {Element} el The element of the item to select
   * @param {Boolean} fieldOnNull Use the designer field when element not found
   * @return {Component} The selected component
   */
  selectElement : function (el) {
    if (typeof(el)=='string') el = this.findByJsonId(el);
    var cmp = this.highlightElement(this.getDesignElement(el));
    this.resizeLayer.hide();
    this.resizeLayer.resizer.dd.lock();
    if (cmp && cmp==this.activeElement) return;
    this.activeElement = cmp;
    if (cmp) {
      //Search parent and select tabpanel
      var selectParent = function(cmp,last) {
        if (!cmp) return;
        //TabPanel check
        var tab = (cmp instanceof Ext.TabPanel) ? cmp : null
        if (tab) {
           if (last && last!=tab.getActiveTab()) tab.setActiveTab(last);
           for (var i=0;i<tab.items.items.length;i++) {
             if (tab.items.items[i]==tab.getActiveTab() && tab.codeConfig.activeTab!=i) {
              tab.codeConfig.activeTab=i;
              tab.doLayout();
            }
          }
        }
       selectParent(this.getContainer(cmp.ownerCt),cmp);
      }.createDelegate(this);
      selectParent(cmp,null);
      if (this.propertyGrid) {
        this.propertyFilter();
        this.propertyGrid.enable();
        this.propertyGrid.setSource(cmp.codeConfig);
      }
    } else {
      if (this.propertyGrid) {
        this.propertyGrid.disable();
        this.propertyGrid.setSource({});
      }
    }
    this.fireEvent('selectelement',cmp);
    return cmp;
  },

  /**
   * Highlight a element within the component, removing old highlight
   * @param {Element} el The element to highlight
   * @return {Element} The element highlighted
   */
  highlightElement : function (el) {
    //Remove old highlight and drag support
    this.container.el.removeClass('selectedElement');
    this.container.el.select('.selectedElement').removeClass('selectedElement');
    this.container.el.select('.designerddgroup').removeClass('designerddgroup');
    if (el) {
      el.addClass("selectedElement");
      if (el.id != this.container.id) el.addClass("designerddgroup");
      return el;
    }
    return el;
  },

  /**
   * Check if a element is contained within a other element
   * @param {Element} cmp The component to search
   * @param {Element} container The component to search within
   * @return {Component} The ExtJs component found, false when not valid
   */
  isElementOf : function(cmp,container) {
    container = container || this.container;
    var loops = 50,c = cmp,id = container.getId();
    while (loops && c) {
      if (c.id == id) return cmp;
      c = c.ownerCt;
      loops--;
    }
    return false;
  },

  /**
   * Find a designElement, this is a ExtJs component which is embedded within this.container
   * @param {Element} el The element to search the designelement for
   * @return {Component} The ExtJs component found, false when not valid
   */
  getDesignElement : function(el,allowField) {
    var cmp,loops = 10;
    while (loops && el) {
      cmp = Ext.getCmp(el.id);
      if (cmp) {
        if (!cmp.codeConfig) cmp.codeConfig = this.getConfig(cmp);
        if (!allowField && cmp == this.container) return false;
        return this.isElementOf(cmp,this.container) ? cmp : (allowField ? this.container : false);
      }
      el = el.parentNode;
      loops--;
    }
    return allowField ? this.container : false;
  },

  findByJsonId : function(id) {
     return this.container.findBy(function (c,p) {return (c[this.jsonId]==id ? true : false);},this)[0];
  },

  /**
   * Create the drag data for a element on designerpanel
   * @param {Event} e The drag event
   * @return {Object} the drag data
   */
  getDragData : function(e) {
     var cmp = this.highlightElement(this.getDesignElement(this.getTarget(e)));
     var el = e.getTarget('.designerddgroup');
     if (cmp && el) {
        var d = el.cloneNode(true);
        d.id = Ext.id();
       return {
         ddel:d,
         config : cmp.initialConfig,
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
  },

  /**
   * @private Fix a problem in firefox with drop getTarget by finding a component
   * using xy coordinates.
   * @param {Event} event The event for which a node should be searched
   * @return {Node} The node that is located by xy coordinates or null when none.
   */
  getTarget : function (event) {
    if (!event) return;
    if (!Ext.isGecko || Ext.isGecko3) event.getTarget();
    var n,findNode = function(c) {
      if (c && c.el && c.getPosition && c.getSize) {
       var pos = c.getPosition();
       var size = c.getSize();
       if (event.xy[0] >= pos[0] && event.xy[0]<=pos[0] + size.width &&
           event.xy[1] >= pos[1] && event.xy[1]<=pos[1] + size.height) {
         n = c
         if(c.items && c.items.items){
            var cs = c.items.items;
            for(var i = 0, len = cs.length; i < len  && !findNode(cs[i]); i++) {}
         }
         return true;
       }
      }
      return false;
    };
    findNode(this.container);
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
      var cmp = this.highlightElement(this.getDesignElement(this.getTarget(e),true));
      var el=cmp.getEl();
      if (data.internal && !e.shiftKey) {
        //Only allow move if not within same container
        if (this.isElementOf(cmp,data.source,true)) return false;
        data.drop = this.isContainer(cmp) ? "move" :
         (el.getX()+(el.getWidth()/2)>Ext.lib.Event.getPageX(e) ? "movebefore" : "moveafter");
        return (data.drop=='movebefore' ?  "icon-element-move-before" :
          (data.drop=='moveafter'  ? "icon-element-move-after"  : "icon-element-move"));
      } else { //Clone
        data.drop = this.isContainer(cmp) ? "append" :
         (el.getX()+(el.getWidth()/2)>Ext.lib.Event.getPageX(e) ? "appendbefore" : "appendafter");
        return (data.drop=='appendbefore' ?  "icon-element-add-before" :
          (data.drop=='appendafter'  ? "icon-element-add-after"  : "icon-element-add"));
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
      this.appendConfig(el,data.config,true,data.drop,data.source,this.require(data.require).cfg);
      data.processed = true;
    }
    return true;
  },

  /**
   * Overwrite the jsonparser to check if a xtype exists, when not save it for editing
   * and convert it into a panel.
   * @param {Object} object The object array used to assing
   * @param {String} key The key of the element within then object
   * @param {Object} value The value of the element within the object
   * @retrun {Object} The value assigned
   */
  setObjectValue : function (object,key,value,rawValue,scope) {
    if (key=='xtype' && this.jsonId) {
      if (!Ext.ComponentMgr.isTypeAvailable(value)) {
        rawValue = {value: value,encode : true};
        value = 'panel';
        this.fireEvent('error','setObjectValue',new SyntaxError('xtype ' + rawValue.value + ' does not exists'));
      } else rawValue=null;
    }
    return Ext.ux.guid.plugin.Designer.superclass.setObjectValue.call(this,object,key,value,rawValue,scope);
  },

  /**
   * @private Function called to initalize the property editor which can be used to edit properties
   * @param {PropertyGrid} propertyGrid The property grid which is used to edit
   */
  setPropertyGrid : function(propertyGrid) {
    this.propertyGrid = propertyGrid;
    this.propertyGrid.jsonScope = this.getScope();
    propertyGrid.on('beforepropertychange', function(source,id,value,oldvalue) {
        this.markUndo();
    },this);
    propertyGrid.on('propertyvalue',function(source,key,value,type,property){
      if (['object','function','mixed'].indexOf(type)!=-1 ||
          typeof(source[this.jsonId + key])=='string' || !property) {
        this.setObjectValue(source,key,this.codeEval(value),value);
      } else  {
        this.setObjectValue(source,key,value);
      }
      return false; //We have set value
    },this);
    propertyGrid.on('propertychange', function(source,id,value,oldvalue) {
        //When somebody changed the json, then make sure we init the changes
        switch (id) {
          case 'json' : this.jsonInit(this.decode(value));break
        }
        this.redrawElement.defer(200,this,[this.activeElement]);
    }, this);
  },

  /**
   * Show or hide the toolbox
   * @param {Boolean} visible Should toolbox be hidden or shown (defaults true)
   */
  toolbox : function(visible){
    if (!this._toolbox) {
      //Build the url array used to load the property list
      for (var i=0;this.propertyDefinitionFiles && i<this.propertyDefinitionFiles.length;i++) {
         if (this.propertyDefinitions.indexOf(this.propertyDefinitionFiles[i])==-1)
            this.propertyDefinitions.push(this.propertyDefinitionFiles[i]);
      }
      for (var i=0;this.componentFiles && i<this.componentFiles.length;i++) {
        if (this.components.indexOf(this.componentFiles[i])==-1)
          this.components.push(this.componentFiles[i]);
      }

      var proxy = new Ext.ux.data.HttpMergeProxy(this.propertyDefinitions);
      this.properties = new Ext.data.JsonStore({
          proxy : proxy, //Needed for Ext2.2
          sortInfo : {field:'name',order:'ASC'},
          root: 'properties',
          fields: ['name', 'type','defaults','desc','instance','editable','values','editor']
      });
      if (Ext.isVersion('2.0','2.1.9')) //Fix for ExtJS versions <= 2.1
         this.properties.proxy = proxy;
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
      this.toolboxTarget = Ext.getCmp(this.toolboxTarget);
      if (this.toolboxTarget){
        this._toolbox = this.toolboxTarget;
        //Override JsonPanel when setting title we update container title
        this._toolbox.add(new Ext.ux.JsonPanel({
            autoLoad:this.toolboxJson,
            nocache :this.nocache,
            scope   : this,
            setTitle : function(title,optional){
              this.scope.toolboxTarget.setTitle(title,optional)
            }
         })
       );
      } else {
        this._toolbox = new Ext.ux.JsonWindow({
            x     : -1000, // Window is hidden by moving X out of screen
            y     : -1000, //Window is hidden by moving Y out of screen
            autoLoad:this.toolboxJson,
            nocache :this.nocache,
            scope   : this,
            closable: false
        });
      }
    }
    //Now show or hide the toolbox
    if (visible || visible === true) {
      if (this.fireEvent('beforeshow',this._toolbox)) {
        this._toolbox.show();
        this._toolbox.doLayout();
      }
    } else {
      if (this.fireEvent('beforehide',this._toolbox)) this._toolbox.hide();
    }
  }

});

/**
 * Override the label is such a way that it can be selected in designer
 * This override should not go outside the designer
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
            this.id = this.id;
        }
        Ext.form.Label.superclass.onRender.call(this, ct, position);
    },

    /**
     * Updates the label's innerHTML with the specified string.
     * @param {String} text The new label text
     * @param {Boolean} encode (optional) False to skip HTML-encoding the text when rendering it
     * to the label (defaults to true which encodes the value). This might be useful if you want to include
     * tags in the label's innerHTML rather than rendering them as string literals per the default logic.
     * @return {Label} this
     */
    setText: function(t, encode){
        this.text = encode!==false ? t : '';
        this.html = encode!==false ? ''  : t;
        if(this.rendered){
            this.el.dom.innerHTML = encode !== false ? Ext.util.Format.htmlEncode(t) : t;
        }
        return this;
   }

});