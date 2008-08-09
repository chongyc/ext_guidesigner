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

Ext.ux.IFrameComponent = Ext.extend(Ext.BoxComponent, {
    onRender : function(ct, position){
        var url = this.url;
        url += (url.indexOf('?') != -1 ? '&' : '?') + '_dc=' + (new Date().getTime());
        this.el = ct.createChild({tag: 'iframe', id: 'iframe-'+ this.id, frameBorder: 0, src: url});
    }
});
Ext.reg('iframe', Ext.ux.IFrameComponent);

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
/**
 * FileControl
 */
Ext.ux.plugin.FileControl = function(config) {
  Ext.apply(this,config);
  Ext.ux.plugin.FileControl.superclass.constructor.call(this);
  this.init();
}

Ext.extend(Ext.ux.plugin.FileControl,Ext.util.Observable,{
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


/*
 * CookieFiles
 */
Ext.ux.plugin.CookieFiles = Ext.extend(Ext.ux.plugin.FileControl,{
  
  init : function(){
    this.cookies = new Ext.state.CookieProvider();     
    Ext.ux.plugin.CookieFiles.superclass.init.call(this);
  },
  
  refreshFiles : function (callback) {
    this.files = this.cookies.get('Designer.files');
    Ext.ux.plugin.CookieFiles.superclass.refreshFiles.call(this,callback);
  },

  saveChanges : function(id,action,callback,content) {  
    if (content) this.cookies.set('Designer/' + id,escape(content));
    if (action=='delete') this.cookies.clear('Designer.'+id);
    Ext.ux.plugin.CookieFiles.superclass.saveChanges.call(this,id,action,callback,content);
    this.cookies.set('Designer.files',this.files);
  },

  openFile : function(id,callback,content) {
    content = unescape(this.cookies.get('Designer/' + id));
    Ext.ux.plugin.CookieFiles.superclass.openFile.call(this,id,callback,content)
  }
    
});

/*
 * PHPFiles
 */
Ext.ux.plugin.PHPFiles = Ext.extend(Ext.ux.plugin.FileControl,{
    
  refreshFiles : function (callback) {
    Ext.Ajax.request({
      url: this.url || "backend.php",
      params: {
         cmd: 'get_files',
         baseDir: this.baseDir
      },            
      callback: function(options, success, response) {
        this.files= success ? Ext.util.JSON.decode(response.responseText) : {};
        if(typeof callback == "function") callback(success);
      },            
      scope: this        
    });    
  },

  saveChanges : function(id,action,callback,content) {  
    Ext.Ajax.request({
       url: this.url || "backend.php",
       params: {
         cmd: 'save_changes',
         baseDir: this.baseDir,
         filename: id,
         action: action,
         content: content
       },
       callback: function(options, success, response) {
         if(success && response.responseText=='1') { 
           if(action=='delete') {
             delete this.files[id];
             if (id==this.last) this.last = null;
           } else {
             this.last = id;
           } 
         }
         if(typeof callback == "function") callback(response.responseText=='1');
       },
       scope: this        
    }); 
  },

  openFile : function(id,callback,content) {
    Ext.Ajax.request({
      url: this.url || "backend.php",
      params: {
        cmd: 'get_content',
        baseDir: this.baseDir,
        filename: id 
      },
      callback: function(options, success, response) {
        if (success) this.last = id;
        if(typeof callback == "function") callback(success,response.responseText);
      },
      scope: this        
    }); 
  }    
});


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
   * An url specifing the json to load
   * @type {Url}
   @cfg */
  autoLoad :  false,
  
  //@private Whe tag each json object with a id
  jsonId :  '__JSON__',
  
  licenseText  :  "/* This file is created with Ext.ux.plugin.GuiDesigner */",
   
  //@private The version of the designer
  version : '2.0.6',
  
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
   * Init the plugin ad assoiate it to a field
   * @param {Component} field The component to connect this plugin to
   */
  init: function(field) {
    Ext.QuickTips.init();
    this.container = field;
    this.jsonScope = this.scope || this.container;
    
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
      
      'add' : true,
      
      'remove' : true,
      
      'change' : true,
      
      'newconfig': true,
      
      'select'   : true,

      /**
       * Fires after loadConfig fails
       * @event loadfailed
       * @param {Url} url The url tried to load
       * @param {Object} response Response object
       */      
      'loadfailed' : false
    });
        
    //Init the components drag & drop and toolbox when it is rendered
    this.container.on('render', function() {    
      this.drag = new Ext.dd.DragZone(this.container.el, {
        ddGroup:'designerddgroup',
        getDragData     : this.getDragData.createDelegate(this)
      });
      this.drop = new Ext.dd.DropZone(this.container.el, {
        ddGroup:'designerddgroup',
        notifyOver : this.notifyOver.createDelegate(this),
        notifyDrop : this.notifyDrop.createDelegate(this)
      });
      this.container.el.on('click', function(e,el) {
         var cmp = this.selectElement(el);
         if (el.focus) el.focus();
      }, this);
      this.toolbox(this.autoShow);
      this.createConfig();
      this.initContextMenu();
      // Check if whe have to load a external file
      if (this.autoLoad) {
       if (typeof this.autoLoad !== 'object')  this.autoLoad = {url: this.autoLoad};
       if (typeof this.autoLoad['nocache'] == 'undefined') this.autoLoad['nocache'] = this.disableCaching;
       this.loadConfig(this.autoLoad.url);
      } 
    }, this);
  },
    
  initContextMenu : function () {
    var contextMenu = new Ext.menu.Menu({items:[{
          text    : 'Delete this element',
          iconCls : 'icon-deleteEl',
          scope   : this,
          handler : function(item) {
              this.removeElement(contextMenu.element);
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
  
  removeElement : function(source,internal) {
    if (!source) return false;
    var own = this.getContainer(source.ownerCt);
    if (!internal) this.markUndo();
    for (var i=0;i<own.items.length;i++) {
      if (own.items.items[i]==source) {
        if (!own.codeConfig) own.codeConfig = this.getConfig(own);
        own.codeConfig.items.splice(i,1);
        if (own.codeConfig.items.length==0) delete own.codeConfig.items;
        if (!internal) {
          this.fireEvent('remove');
          this.redrawElement(own);
        } else {
          this.redrawContainer = true;
        }
        return true;
      }
    }    
    return false;
  },
  
  menuUpdate : function(){
    var menu = Ext.getCmp(this.undoBtnId);
    if (menu) if (this.undoHistoryMark>0) menu.enable(); else menu.disable();
    menu = Ext.getCmp(this.redoBtnId);
    if (menu) if (this.undoHistory.length>this.undoHistoryMark+1) menu.enable(); else menu.disable();
  },
  
  markUndo : function() {
    while (this.undoHistory.length>this.undoHistoryMark) this.undoHistory.pop();
    this.undoHistory.push(this.encode(this.getConfig(),0,true));
    while (this.undoHistory.length > this.undoHistoryMax) this.undoHistory.shift();
    this.undoHistoryMark = this.undoHistory.length;
    this.menuUpdate();
  },
  
  undo : function(){
    if (this.undoHistoryMark>0) {
      if (this.undoHistoryMark==this.undoHistory.length) {
        //Make sure whe have point to recover incase of redo
        this.undoHistory.push(this.encode(this.getConfig(),0,true));
        this.undoHistoryMark = this.undoHistory.length-1;
      }
      this.undoHistoryMark--;
      this.setConfig(this.undoHistory[this.undoHistoryMark]);
      this.menuUpdate();
    }
  },
  
  redo : function(){
    if (this.undoHistory.length>this.undoHistoryMark+1) {
      this.undoHistoryMark++;
      this.setConfig(this.undoHistory[this.undoHistoryMark]);
      this.menuUpdate();
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
      if (!src.codeConfig) src.codeConfig = this.getConfig(src);
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
        this.appendConfig(el,config,true);
      }.createDelegate(this),this);
    } else {
     //Get the config of the items
     var ccmp,cmp= this.getDesignElement(el,true);
     var items = this.editableJson(this.deleteJsonNull(this.clone(config)));
     //Find the container that should be changed
     ccmp = this.getContainer(cmp); 
     if (dropLocation == 'appendafter') {
       add(ccmp,items,this.activeElement,false);      
     } else if (dropLocation == 'appendbefore') { 
       add(ccmp,items,this.activeElement,true);
     } else if (dropLocation == 'moveafter') {
       this.removeElement(source,true);
       add(ccmp,items,this.activeElement,false);      
     } else if (dropLocation == 'movebefore') { 
       this.removeElement(source,true);
       add(ccmp,items,this.activeElement,true);
     } else if (dropLocation == 'move') {
       this.removeElement(source,true);
       add(ccmp,items);
     } else // Append default behavior
       add(ccmp,items);
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
       var config = { 'border' : false, 'layout' : this.container.getLayout(),'items' : this.editableJson(items)};
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
         this.setConfig(response.responseText);
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
   * Get the config of the specified element
   * @param {Element} el The element for which to get the config object
   * @return {Object} The config object 
   */
  getConfig : function (el) {
    el = el || this.container.items.first();
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
   * @return {Boolean} true when succesfull applied
   */
  setConfig : function (json) {
    var id = this.activeElement ? this.activeElement[this.jsonId] : null;
    var items = (typeof(json)=='object' ? json : this.decode(json)) || {};
    if (!this.container.codeConfig) this.container.codeConfig = this.getConfig(this.container);
    items = this.deleteJsonNull(items);
    this.container.codeConfig.items=[this.editableJson(items)];
    this.applyJson(items,this.container); //Recreate childs
    this.redrawContainer=false;
    this.modified = true;
    this.fireEvent('newconfig');
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
    while (p && p!=this.container && !this.isContainer(p)) p = p.ownerCt;
    return p;
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
        var id = selectId || (this.activeElement ? this.activeElement[this.jsonId] : null);
        var p = this.container; //Redraw whole canvas          
        if (!this.redrawContainer && el!=p) {
           //Check if whe can find parent which can be redraw
           var c = '';
           p = this.getContainer(el);
           //Search if whe find a layout capeble contianer
           while (p!=this.container && !c) {
             if (!p.codeConfig) p.codeConfig = this.getConfig(p);
             c = p.codeConfig.layout;
             if (!c || (p==el && c)) 
                p = this.getContainer(p.ownerCt);
           }
           p = c ? p : this.getContainer(el.ownerCt);
        }
        this.applyJson(this.getConfig(p).items,p);
        this.redrawContainer=false;
        this.selectElement(id);
      } catch (e) { Ext.Msg.alert('Failure', 'Failed to redraw element ' + e); }
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
    var cmp = this.getDesignElement(el);
    this.highlightElement(cmp);
    this.activeElement = cmp;
    if (cmp) {
      if (this.propertyGrid) {
        this.propertyFilter();
        this.propertyGrid.enable();
        this.propertyGrid.setSource(this.getConfig(this.activeElement));
      }
    } else {
      if (this.propertyGrid) {
        this.propertyGrid.disable();
        this.propertyGrid.setSource({});
      }
    }
    this.fireEvent('select',cmp);
    return cmp;
  },

  /**
   * Highlight a element within the component, removing old highlight
   * @param {Element} el The element to highlight
   * @return {Boolean} True when element highlighted
   */
  highlightElement : function (el) {
    //Remove old highlight and drag support
    this.container.el.removeClass('selectedElement');
    this.container.el.select('.selectedElement').removeClass('selectedElement');
    this.container.el.select('.designerddgroup').removeClass('designerddgroup');
    if (el) {
      el.addClass("selectedElement");
      if (el.id != this.container.id) el.addClass("designerddgroup");
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
     var cmp = this.selectElement(this.getTarget(e));
     var el = e.getTarget('.designerddgroup');
     if (el && cmp) { 
       return {
         ddel:el,
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
    var n,findNode = function(c) {
      if (c && c.getPosition && c.getSize) {
       var pos = c.getPosition();
       var size = c.getSize();
       if (event.xy[0] >= pos[0] && event.xy[0]<=pos[0] + size.width &&
           event.xy[1] >= pos[1] && event.xy[1]<=pos[1] + size.height) {
         n = c
         if(c.items){
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
      var cmp = this.getDesignElement(this.getTarget(e),true);
      this.selectElement(cmp);
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
    this.propertyGrid.jsonScope = this.getJsonScope();
    propertyGrid.on('beforepropertychange', function() {
        this.markUndo();
    },this);
    propertyGrid.on('propertychange', function() {
        this.redrawElement(this.activeElement);
    }, this);
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
          if (s.match(/Ext\.ux\.plugin\.Designer\.js(\?.*)?$/)) {
            path = s.replace(/Ext\.ux\.plugin\.Designer\.js(\?.*)?$/,'');
          }
        }
        this.toolboxPath = path;
        this.toolboxJson = path + 'Ext.ux.plugin.Designer.json';
        this.properties = new Ext.data.JsonStore({
            url: this.toolboxPath + 'Ext.ux.plugin.Designer.Properties.json',
            sortInfo : {field:'name',order:'ASC'},
            root: 'properties',
            fields: ['name', 'type','defaults','desc','instance','editable','values']
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
