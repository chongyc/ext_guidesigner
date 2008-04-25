/*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This extension adds Gui Designer  Support to ExtJs
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

Ext.namespace('Ext.ux.form');
Ext.SSL_SECURE_URL="images/default/s.gif"; 
Ext.BLANK_IMAGE_URL="images/default/s.gif";


/** 
 * Override the Ext.form.Label so that the id is selectable in guidesigner
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


/**
 * Override Ext.grid.PropertyColumnModel getCelleditor so it supports a defaultEditor 
 */
Ext.override(Ext.grid.PropertyColumnModel, {
    // @private
    getCellEditor : function(colIndex, rowIndex){
        var p = this.store.getProperty(rowIndex);
        var n = p.data['name'], val = p.data['value'];
        if(this.grid.customEditors[n]){
            return this.grid.customEditors[n];
        }
        if(Ext.isDate(val)){
            return this.editors['date'];
        }else if(typeof val == 'number'){
            return this.editors['number'];
        }else if(typeof val == 'boolean'){
            return this.editors['boolean'];
        }else{
            return this.defaultEditor || this.editors['string'];
        }
    }
});

/**
 * Used by designer when selecting a value from a ComponentDoc defined value property in the grid
 * @type component
 */  
Ext.ux.form.SimpleCombo = Ext.extend(Ext.form.ComboBox, {
    // @private Data is loaded localy
    mode           : 'local',
    // @private We trigger on all
    triggerAction  : 'all',
    // @private We allow type ahead
    typeAhead      : true,
    // @private The value field bound to field called value    
    valueField     : 'value',
    // @private The display name is called name
    displayField   : 'name',
    // @private Forceselection is by default enabled
    forceSelection : true,
    // @private The Combobox is by default editable
    editable       : true,
    // @private No charachters are required
    minChars       : 0,
    /**
     * Are customProperties (values) allowed to be entered (defaults false)
     * @type {Boolean}
     @cfg */
    customProperties : false,
    /**
     * @private Override the init of ComboBox so that local data store is used
     */
    initComponent  : function(){
        Ext.form.ComboBox.superclass.initComponent.call(this);
        if(!this.store && this.data){
            this.store = new Ext.data.SimpleStore({
                fields: ['value','name','cls'],
                data : this.data
            });
        }
        this.tpl = '<tpl for="."><div class="x-combo-list-item {cls}">{' + this.displayField + '}</div></tpl>';
    },
    
    /**
     * @private Override the getValue so that when customProperties is set
     * the rawValues is returned
     */
    getValue : function (){
      return Ext.form.ComboBox.superclass.getValue.call(this) || 
        (this.customProperties ? this.getRawValue() : '');
    }

});
Ext.reg('simplecombo', Ext.ux.form.SimpleCombo);

/**
 * Used by designer to edit javascript code. 
 * When codepress is installed it will used as the editor otherwise textarea
 * @type component
 */  
Ext.ux.form.ScriptEditor = Ext.extend(Ext.BoxComponent, {
  
  /**
   * The value used by the scripteditor (defaults null)
   * @type {String}
   */
  value : undefined,
  
  /**
   * Default language of scripteditor (defaults javascript)
   * @type {String}
   @cfg */
  language : 'javascript',
  
  /**
   * Should it use codePress as code editor (defaults true)
   * @type {Boolean}
   @cfg */
  codePress : true, //codePress enabled
  
  /**
   * @private overridde setValue so value property value is set
   */
  setValue : function(text){
    this.value =  text;
  },

  /**
   * @private overridde getValue so value property value is read
   */  
  getValue : function(){
    return this.value || "";
  },
  
  /**
   * @private The data is always valid
   */
  isValid : function(preventMark){
     return true;
  },
   
  /**
   * We open the scripteditor window on this event
   */
  onTriggerClick : function() {
    if(this.disabled){return;}
    if (!this.editorWin) {
      var tf = (this.codePress && Ext.ux.CodePress) 
             ?  new Ext.ux.CodePress({language: this.language ,autoResize:true,trim : true})
             :  new Ext.form.TextArea({resize:Ext.emptyFn});
      this.editorWin = new Ext.Window({
          title  : "ScriptEditor",
          iconCls: 'icon-editEl',
          closable:true,
          width:600,
          height:450,
          plain:true,
          modal: true,
          maximizable : true,          
          layout      : 'fit',
          items       : tf,
          closeAction : 'hide',
          keys: [{
              key: 27,
              scope: this,
              fn: function() {
                this.editorWin.hide();
                Ext.getCmp(this.editor).cancelEdit();
              }}],
          buttons: [{
             text    : "Close",
             scope   : this,
             handler : function() {             
               this.editorWin.hide(); 
               Ext.getCmp(this.editor).cancelEdit();  
             }
            },{
             text    : "Apply",
             scope   : this,
             handler : function() {       
               this.setValue(tf.getValue());
               this.editorWin.hide();
               this.editorWin.el.unmask(); 
               Ext.getCmp(this.editor).completeEdit();
             }
           }] 
        });
      this.editorWin.tf = tf;
      this.editorWin.doLayout();
      this.editorWin.on('resize',function () {tf.resize()});
      }
    this.editorWin.show();
    this.editorWin.tf.setValue(this.value || this.defaultValue);
  },
  
  /**
   * @private During render we create the the 'Click to edit' box
   * @param {Component} ct The component to render
   * @param {Object} position A object containing the position of the component
   */
  onRender : function(ct, position){
   this.editor = ct.id;
   Ext.ux.form.ScriptEditor.superclass.onRender.call(this, ct, position);
   this.el = ct.createChild({tag: "div",cls:'x-form-text'},position);
   this.trigger = this.el.createChild({tag: "div"});
   this.trigger.createChild({tag:"div", cls:"icon-scripteditor",html:"&nbsp;"});
   this.trigger.createChild({tag:"div",cls:"text-scripteditor",html:"Click to edit"});
   this.trigger.on("click", this.onTriggerClick, this, {preventDefault:true});
  }

});
Ext.reg('scripteditor', Ext.ux.form.ScriptEditor);

/**
 * Component implementing a complete visual designer.
 * <p>This component is intended to create or manipulate a JSON file contain a GUI design.
 * A design can be copied using clipboard function or maintained by the usages of a backend system.
 * We provide an example of a backend system using php.
 </p>
 * <p>Example using cookies and custom extentions:</p>
 * <pre><code>var win = new Ext.ux.Designer({
  customProperties : true,
  components : [
    ['Demo','Button','A button',{xtype:'button',text:'Ok'}]
  ],
  componentsDoc :{
    "Demo.js":{
      DemoField:{type:"function",desc:"Demo field not to be used."}
  }
});</code></pre>
* <p>Example using file:</p>
  <pre><code>var win = new Ext.ux.Designer({
      url:'index.php',
      filename:'myJson.json',
      enableReload: true,
      enabledSave:true
});</code></pre>
* <p>Example how to override html named propertyfields with textarea editor:</p>
 <pre><code>var win = new Ext.ux.Designer({
    editors :{'html': new Ext.grid.GridEditor(new Ext.form.TextArea())}
 });</code></pre>   
 * @type component
 */ 
Ext.ux.Designer = Ext.extend(Ext.ux.JsonPanel, {
 /** 
  * Enable auto update of designer screen (defaults true).   
  * @type {Boolean} 
  @cfg */
  autoUpdate : true,
 /**
  * When enabled design changes are stored in cookie (defaults true). Is automaticly disabled when using url config.
  * @type {Boolean}
  @cfg */
  cookies    : true,
  /**
   * Enable the usage of CodePress code editor (defualts true)
   * @type {Boolean}
   @cfg */
  codePress  : true,
  /**
   * The url used to load and save designs. When set the filename is passed as parameter
   * @type {String}
   @cfg */
  url        : false,
  /**
   * The filename used as a parameter in combination with url when loading and saving a file.
   * @type {String}
   @cfg */
  filename   : false,
  
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
   * Enable or disable the Javascript menu button (defaults true).
   * @type {Boolean}
   @cfg */  
  enableJavascript : true,
  /**
   * Enable or disable the Edit Json menu button (defaults true).
   * @type {Boolean}
   @cfg */    
  enableEdit : true,
  /**
   * Enable or disable the Timing menu button (defaults true).
   * @type {Boolean}
   @cfg */  
  enableTime : true,
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
   * Enable or disable the usage of customProperties (defaults false). 
   * When disabled only properties which are defined within Ext.ux.Designer.ComponentsDoc.json are available.
   * @type {Boolean}
   @cfg */    
  customProperties  : false, 
  
  /**
   * Array of additional components that will added to componentpanel
   * @type {Array}
   @cfg */
  components : [],
  
  /**
   * An object array with documentation for component propertyfields
   * @type {Object}
   @cfg */
  componentsDoc : {}, 
  
  /** 
   * An object array with named GridEditors which override the default editors. 
   * @type {Object}
   @cfg */
  editors : {},
  
  /**
   * Indicator of the state of the design has been modified. 
   * @type {Boolean}
   */
  modified : false,
  
  /**
   * Number of undo events to keep (defaults 20). 
   * @type {Int}
   */
  undoHistoryMax : 20,
  
  //@private Internal property used to disable editor when used within designer
  embedded : false, 

  //@private Internal boolean used to switch of javascipt support in GUI elements
  javascriptEnabled : true,
  
  //@private The version of the designer
  version : '1.9',
  
  /**
   * @private Function used to initialize the components of designer
   */
  initComponent : function(){
   //Accessor to static designer functions
    this.static  = Ext.ux.Designer.Static;
    var self = this;
    if (this.embedded) this.setDisabled(true);
    if (!this.embedded && this.cookies && !this.url) this.cookies = new Ext.state.CookieProvider(); else this.cookies=false;   
    this.initFields();
    this.initResizeLayer();
    this.initUndoHistory();
    this.initTreePanel();
    this.initEditPanel();
    this.initComponentsPanel();
    var builderPanelId= Ext.id();
    this.FBRenderingTimeBtn = Ext.id();
    this.FBSaveBtn=Ext.id();
    this.FBUndoBtn = Ext.id();
    this.FBmenuMessage = Ext.id();
    Ext.apply(this,{
      layout : 'border',
      items: [{
          region  : 'north',
          height  : 27,
          tbar    : [{
              text : 'Save',
              tooltip : 'Save the design file: ' + (this.filename || this.url),
              iconCls:'icon-save',
              disabled : true,
              id : this.FBSaveBtn,
              scope: this,
              handler: this.saveConfig,
              hidden : !this.enableSave || !this.url
            },{
              text : 'Reload',
              iconCls:'icon-reload',
              tooltip : 'Reload the design file: ' + (this.filename || this.url),
              scope: this,
              handler: function (){
                this.markUndo("Reload");
                this.loadConfig();
                Ext.getCmp(this.FBSaveBtn).disable();
              },
              hidden : !this.enableReload || !this.url
            },{
              text : 'Clear All',
              tooltip : 'Remove all elements from design',
              iconCls:'icon-reset',
              scope: this,
              handler:function() {
                this.markUndo("Reset All");
                this.resetAll();
              }
            },'-',{
              hidden: !this.enableCopy,
              text:'Copy JSON',
              tooltip : 'Copy JSON to clipboard',
              iconCls:'icon-designcopy',
              scope:this,
              handler: function () {
                var text = self.getConfig();  
                if (window.clipboardData) { // Internet Explorer
                   window.clipboardData.setData("Text", ""+ text); // stupid IE... won't work without the ""+ ?!?!?
                } else if (window.netscape) { // Mozilla
                    try {
                      netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');       
                      var gClipboardHelper = Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper);            
                      gClipboardHelper.copyString(text);
                    } catch(e) {
                      return Ext.Msg.alert('Information',e +'\n\nPlease type: "about:config" in your address bar.\nThen filter by "signed".\nChange the value of "signed.applets.codebase_principal_support" to true.\nYou should then be able to use this feature.');
                    }
                } else { 
                  return Ext.Msg.alert('Information',"Your browser does not support this feature");
                }
              }
            },{
              hidden : !this.enableEdit,
              text:'Edit JSON',
              tooltip : 'Edit the generated JSON using a text area',
              iconCls:'icon-editEl',
              scope:this,
              handler:this.editConfig
            },{
              hidden  : !this.enableShow,
              iconCls : 'icon-show',
              text    : 'Show',
              tooltip : 'Show design in window',
              scope   : this,
              handler : this.showConfig
            },'-',{
              iconCls : 'icon-update',
              text    : 'Update',
              tooltip : 'Apply changes',
              scope   : this,
              handler : function() { this.updateForm(true); }
            },{
              xtype    : 'checkbox',
              boxLabel : 'Auto',
              tooltip  : 'Auto update the form if checked. Disable it if rendering is too slow',
              checked  : this.autoUpdate,
              listeners : {check : function(c) {self.autoUpdate = c.checked;}}
            },'-',{
              hidden  : !this.enableTime,
              iconCls : 'icon-time',
              text    : 'Rendering time : <i>unknown</i>',
              scope   : this,
              id      : this.FBRenderingTimeBtn,
              tooltip : 'Click to update form and display rendering time',
              handler : function() {this.updateForm(true);}
            },'-',{
              hidden   : !this.enableJavascript,
              xtype    : 'checkbox',
              boxLabel : 'JavaScript',
              tooltip  : 'Enable usage of javascript function in designer',
              checked  : this.javascriptEnabled,
              listeners : {check : function(c) {self.javascriptEnabled = c.checked;if (self.builderPanel._node) self.updateForm(true);}}
            },'-',{
              id      : this.FBUndoBtn,
              iconCls : 'icon-undo',
              text    : 'Undo',
              disabled: true,
              tooltip : "Undo last change",
              handler : this.undo,
              scope   : this
            },'->',{
              id      : this.FBmenuMessage,
              disabled: true
            },{
              hidden  : !this.enableVersion,
              text    : 'Help',
              iconCls : 'icon-help',
              handler : function() {
                Ext.Msg.alert('Information',
                  "<i>Author  :</i><b> Sierk Hoeksma</b> based on original from Christophe Badoit<br/>" +
                  '<i>Version :</i> ' + self.version);}
              }
          ]
        },{
          region: 'west',
          border: false,
          width : 255,
          split : true,
          xtype : 'panel',
          layout: 'border',
          items : [
            this.treePanel,
            this.editPanel
          ]
        }, Ext.apply(
            { region: 'east',
              hidden:true,
              border: true,
              width : 180,
              collapsible:true,
              layout: 'fit'
            },this.eastPanel)
        ,{
          region:'center',
          layout:'fit',
          border:false,
          bodyBorder:false,
          style:'padding:3px 3px;background:black',
          items:{
             id:builderPanelId,
             border:false,
             bodyBorder:false,
             bodyStyle:'background:black;border:dashed green 1px;',
             layout:'fit',
             listeners : {'render' : function(){try {self.initElements();} catch(e){}}}
           }
        },
         this.componentsPanel
        ]
      });  
     Ext.ux.Designer.superclass.initComponent.call(this); 
     this.builderPanel = Ext.getCmp(builderPanelId);
    },
   
   /**
    * @private Init the DOM element functions like drag and drop and context menu called when builder panel is renderd
    */
   initElements : function (){
    if (this.builderPanel._node) return;        
    var self = this;    
    var root = this.treePanel.root;
    root.fEl = this.builderPanel;
    root.elConfig = {};
    this.builderPanel._node = root;
    //Disabled drag/drop on embedded designer
    var drop = new Ext.dd.DropZone(this.builderPanel.el, {
        ddGroup:'designcomponent',
        notifyOver : function(src,e,data) {
          if (data.compData) {
            var node =this.getNodeForEl(e.getTarget(),e);
            if (this.canAppend({}, node) === true) {
              node.select();
              this.highlightElement(node.fEl.el);
              return true;
            }
           } else {
            //This means it is treepanel item move
           }
           return false;
          }.createDelegate(this),
        notifyDrop : function(src,e,data) {
            var node=this.getNodeForEl(e.getTarget(),e);
            if (!node) { return; }
            if (data.compData && !data.processed) {
              var c = data.compData.config;
              if (typeof c == 'function') {
                c.call(this,function(config) {
                  var n = this.appendConfig(config, node, true, true);
                  this.setCurrentNode(n, true);
                }, node.elConfig);
              } else {
                var n = this.appendConfig(this.cloneConfig(c), node, true, true);
                this.setCurrentNode(n, true);
              }
              //Remove the data so no double event is fired
              data.processed = true;
            } else {
             //This is treepanel drop. Drop item before selected item
            }
            return true;
          }.createDelegate(this)
      });
    this.builderPanel.drop = drop;
    
    this.treePanel.el.on('contextmenu', function(e) {
      e.preventDefault();
    });
    // select elements on form with single click
    this.builderPanel.el.on('click', function(e,el) {
        e.preventDefault();
        var node = this.getNodeForEl(el);
        if (!node) { node = this.treePanel.root; }
        this.tabPanelNode(node);
        this.highlightElement(node.fEl.el);
        this.setCurrentNode(node, true);        
      }, this);
    // menu on form elements
    this.builderPanel.el.on('contextmenu', function(e,el) {
        e.preventDefault();
        var node = this.getNodeForEl(el);
        if (!node) { return; }
        this.highlightElement(node.fEl.el);
        this.setCurrentNode(node, true);
        this.contextMenu.node = node;
        this.contextMenu.showAt(e.getXY());
      }, this);  
    if (!this.loadConfig()) { this.resetAll(); }      
  },
  
  /** 
   * @private Init the builder panel (center)
   */
  initBuilderPanel : function() {
    var panel = new Ext.Panel({
          region:'center',
          layout:'fit',
          border:false,
          bodyBorder:false,
          style:'padding:3px 5px;background:black',
          items:{border:false,bodyBorder:false,bodyStyle:'background:black;border:dashed green 1px;',layout:'fit',id:'FBBuilderPanel'}
      });
    this.builderPanel = panel;
  },   


  /** 
   * @private Init the tree panel, listing elements
   */
  initTreePanel : function() {
    var tree = new Ext.tree.TreePanel({
      region          : 'north',
      title           : "Elements Tree",
      iconCls         : "icon-el",
      collapsible     : true,
      floatable       : false,
      autoScroll      : true,
      height          : 200,
      split           : true,
      animate         : false,
      enableDD        : true,
      ddGroup         : 'designcomponent',
      containerScroll : true,
      selModel        : new Ext.tree.DefaultSelectionModel(),
      bbar            : [{
        text    : 'Expand All',
        tooltip : 'Expand all elements',
        scope   : this,
        handler : function() { this.treePanel.expandAll(); }
      },{
        text    : 'Collapse All',
        tooltip : 'Collapse all elements',
        scope   : this,
        handler : function() { this.treePanel.collapseAll(); }
      }]
    });

    var root = new Ext.tree.TreeNode({
        text      : 'GUI Builder elements',
        id        : Ext.id(),
        draggable : false
    });
    tree.setRootNode(root);

    tree.on('click', function(node, e) {
      e.preventDefault();
      this.tabPanelNode(node);
      if (!node.fEl || !node.fEl.el) { return; }
      this.highlightElement(node.fEl.el);
      this.setCurrentNode(node);
    }, this);

    // clone a node
    var cloneNode = function(node) {
      var config = Ext.apply({}, node.elConfig);
      delete config.id;
      var newNode = new Ext.tree.TreeNode({id:Ext.id(),text:this.configToText(config)});
      newNode.elConfig = config;

      // clone children
      for(var i = 0; i < node.childNodes.length; i++){
        n = node.childNodes[i];
        if(n) { newNode.appendChild(cloneNode(n)); }
      }
      return newNode;
    }.createDelegate(this);
    
    // assert node drop
    tree.on('nodedragover', function(de) {
      var p = de.point, t= de.target;
      if(t && (p == "above" || p == "below")) {
          t = t.parentNode;
      }
      if (!t) { return false; }
      this.highlightElement(t.fEl.el);
      return (this.canAppend({}, t) === true);
    }, this);

    // copy node on 'ctrl key' drop
    tree.on('beforenodedrop', function(de) {
        var ns = de.dropNode, p = de.point, t = de.target;
        if (!t || !ns) return false;
        if (!de.rawEvent.ctrlKey) {
          this.markUndo("Moved " + de.dropNode.text);
          return true;
        }
        this.markUndo("Copied " + de.dropNode.text);
        if(!(ns instanceof Array)){
            ns = [ns];
        }
        var n;
        for(var i = 0, len = ns.length; i < len; i++){
            n = cloneNode(ns[i]);
            if(p == "above"){
                t.parentNode.insertBefore(n, t);
            }else if(p == "below"){
                t.parentNode.insertBefore(n, t.nextSibling);
            }else{
                t.appendChild(n);
            }
        }
        n.ui.focus();
        if(de.tree.hlDrop){ n.ui.highlight(); }
        t.ui.endDrop();
        de.tree.fireEvent("nodedrop", de);
        return false;
      }, this);

    // update on node drop
    tree.on('nodedrop', function(de) {
      var node = de.target;
      if (de.point != 'above' && de.point != 'below') {
        node = node.parentNode || node;
      }
      this.updateForm(false, node);
    }, this, {buffer:100});

    // get first selected node
    tree.getSelectedNode = function() {
      return this.selModel.getSelectedNode();
    };

    // context menu to delete / duplicate...
    var contextMenu = new Ext.menu.Menu({items:[{
        text    : 'Delete this element',
        iconCls : 'icon-deleteEl',
        scope   : this,
        handler : function(item) {
            this.removeNode(contextMenu.node);
          }
      },{
        text    : 'Add new element as child',
        iconCls : 'icon-addEl',
        scope   : this,
        handler : function(item) {
            var node = this.appendConfig({}, contextMenu.node, true, true);
            this.treePanel.expandPath(node.getPath());
          }
      },{
        text    : 'Add new element under',
        iconCls : 'icon-addEl',
        scope   : this,
        handler : function(item) {
            var node = this.appendConfig({}, contextMenu.node.parentNode, true, true);
            this.treePanel.expandPath(node.getPath());
          }
      },{
        text    : 'Duplicate this element',
        iconCls : 'icon-dupEl',
        scope   : this,
        handler : function(item) {
            var node = contextMenu.node;
            this.markUndo("Duplicate " + node.text);
            var newNode = cloneNode(node);
            if (node.isLast()) {
              node.parentNode.appendChild(newNode);
            } else {
              node.parentNode.insertBefore(newNode, node.nextSibling);
            }
            this.updateForm(false, node.parentNode);
          }
      },{
        text    : 'Visual resize / move',
        tooltip : 'Visual resize the element.<br/>You can move it too if in an <b>absolute</b> layout',
        iconCls : 'icon-resize',
        scope   : this,
        handler : function(item) {
            this.visualResize(contextMenu.node);
          }
      }]});
    tree.on('contextmenu', function(node, e) {
        e.preventDefault();
        if (node != this.treePanel.root) {
          contextMenu.node = node;
          contextMenu.showAt(e.getXY());
        }
      }, this);
    this.contextMenu = contextMenu;

    this.treePanel = tree;
  },

  /**
   * @private Init the layer used for selection resize
   */
  initResizeLayer : function() {
    this.resizeLayer = new Ext.Layer({cls:'resizeLayer',html:'Resize me'});
    this.resizeLayer.setOpacity(0.5);
    this.resizeLayer.resizer = new Ext.Resizable(this.resizeLayer, {
      handles:'all',
      draggable:true,
      dynamic:true});
    this.resizeLayer.resizer.dd.lock();
    this.resizeLayer.resizer.on('resize', function(r,w,h) {
        var n = this.editPanel.currentNode;
        if (!n || !n.elConfig) { return false; }
        this.markUndo("Resize element to " + w + "x" + h);
        var s = n.fEl.el.getSize();
        if (s.width != w) {
          n.elConfig.width = w;
          if (n.parentNode.elConfig.layout == 'column') {
            delete n.elConfig.columnWidth;
          }
        }
        if (s.height != h) {
          n.elConfig.height = h;
          delete n.elConfig.autoHeight;
        }
        this.updateForm(true, n.parentNode);
        this.setCurrentNode(n);
        this.highlightElement(n.fEl.el);
      }, this);
    this.resizeLayer.resizer.dd.endDrag = function(e) {
        var n = this.editPanel.currentNode;
        if (!n || !n.elConfig) { return false; }
        var pos = this.resizeLayer.getXY();
        var pPos = n.parentNode.fEl.body.getXY();
        var x = pos[0] - pPos[0];
        var y = pos[1] - pPos[1];
        this.markUndo("Move element to " + x + "x" + y);
        n.elConfig.x = x;
        n.elConfig.y = y;
        this.updateForm(true, n.parentNode);
        this.setCurrentNode(n);
        this.highlightElement(n.fEl.el);
    }.createDelegate(this);
  },

  /** 
   * @private Init the editor pannel with customized property grid for attributes
   */
  initEditPanel : function() {
    var fields = [];
    var self = this;
    //Copy all names for docFields
    for (var i in this.docFields) {fields.push([i,i]);}
    var newPropertyField = new Ext.form.ComboBox({
        mode           : 'local',
        valueField     : 'value',
        displayField   : 'name',
        store          : new Ext.data.SimpleStore({
            sortInfo : {field:'name',order:'ASC'},
            fields   : ['value','name'],
            data     : fields
          })});
    newPropertyField.on('specialkey', function(tf,e) {
      var name = tf.getValue() || (self.customProperties ? newPropertyField.getRawValue() : '');
      var ds = this.editPanel.store;
      if (e.getKey() == e.ENTER && name != '' && !ds.getById(name)) {
        ds.add(new Ext.grid.PropertyRecord({name:name}, name));
        this.editPanel.startEditing(ds.getCount()-1, 1);
        tf.setValue('');
      }
    }, this);
    
    var grid = new Ext.grid.PropertyGrid({
        title            : 'Parameters',
        height           : 300,
        split            : true,
        region           : 'center',
        source           : {},
        bbar             : ['Add :', newPropertyField ],
        customEditors    : this.getEditors(),
        newPropertyField : newPropertyField
      });
    //Set default editor to code  
     grid.colModel.defaultEditor=new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'',codePress:self.codePress}));  

    var valueRenderer = function(value, p, r) {
      if (typeof value == 'boolean') {
        p.css = (value ? "typeBoolTrue" : "typeBoolFalse");
        return (value ? "True" : "False");
      } else if (this.attrType(r.id) == 'object' || this.attrType(r.id) == 'array') {
        p.css = "typeObject";
        return value;
      } else {
        return value;
      }
    }.createDelegate(this);

    var propertyRenderer = function(value, p) {
      var t = self.docFields[value];
      qtip = (t ? t.desc : '');
      p.attr = 'qtip="' + qtip.replace(/"/g,'&quot;') + '"'; //'
      return value;
    };
    grid.colModel.getRenderer = function(col){
      return (col == 0 ? propertyRenderer : valueRenderer);
    };
    var FBMenuPropertyDelete = Ext.id();
    var contextMenu = new Ext.menu.Menu({items:[{
        id      : FBMenuPropertyDelete,
        iconCls : 'icon-delete',
        text    : 'Delete this property',
        scope   : this,
        handler : function(item,e) {
            this.markUndo('Delete property <i>' + item.record.id + '</i>');
            var ds = grid.store;
            delete grid.getSource()[item.record.id];
            ds.remove(item.record);
            delete item.record;
            this.updateNode(grid.currentNode);
            var node = grid.currentNode.parentNode || grid.currentNode;
            this.updateForm.defer(200, this, [false, node]);
          }
      }]});

    // property grid contextMenu
    grid.on('rowcontextmenu', function(g, idx, e) {
        e.stopEvent();
        var r = this.store.getAt(idx);
        if (!r) { return false; }
        var i = contextMenu.items.get(FBMenuPropertyDelete);
        i.setText('Delete property "' + r.id + '"');
        i.record = r;
        contextMenu.showAt(e.getXY());
      }, grid);


    // update node text & id
    grid.store.on('update', function(s,r,t) {
      if (t == Ext.data.Record.EDIT) {
        this.markUndo('Set <i>' + r.id + '</i> to "' +
          Ext.util.Format.ellipsis((String)(r.data.value), 20) + '"');
        var node = grid.currentNode;
        this.updateNode(grid.currentNode);
        this.updateForm(false, node.parentNode || node);
      }
    }, this, {buffer:100});
    this.editPanel = grid;
  },

  /**
   * @private Init the Components panel
   */
  initComponentsPanel : function() {
    // components; config is either an object, or a function called with the adding function and parent config
    var data = this.getComponents();
    var ds = new Ext.data.SimpleStore({
      fields: ['category','name','description','config'],
      data : data
    });
    var tpl = new Ext.XTemplate(
      '<ul class="DesignerComponentSelector">',
      '<tpl for=".">',
        '<li class="designcomponent" qtip="{description}">{name}</li>',
      '</tpl>',
      '<div class="x-clear"></div>',
      '</ul>');
    var view = new Ext.DataView({
      store        : ds,
      tpl          : tpl,
      overClass    : 'over',
      selectedClass: 'selected',
      singleSelect : true,
      itemSelector : '.designcomponent'
    });
    view.on('dblclick', function(v,idx,node,e) {
        e.preventDefault();
        var n = this.editPanel.currentNode;
        if (!n) { return false; }
        var c = view.store.getAt(idx).data.config;
        if (!c) { return false; }
        if (typeof c == 'function') {
          c.call(this,function(config) {
            var newNode = this.appendConfig(config, n, true, true);
            if (this.isContainer(config.xtype)) this.setCurrentNode(newNode, true);
          }, n.elConfig);
        } else {
          var newNode = this.appendConfig(this.cloneConfig(c), n, true, true);
          if (this.isContainer(c.xtype)) this.setCurrentNode(newNode, true);
        }
      }, this);
    view.on('render', function() {
        var d = new Ext.dd.DragZone(view.el, {
            ddGroup         : 'designcomponent',
            containerScroll : true,
            getDragData     : function(e) {
                view.onClick(e);
                var r = view.getSelectedRecords();
                if (r.length == 0) { return false; }
                var el = e.getTarget('.designcomponent');
                if (el) { return {ddel:el,compData:r[0].data}; }
              },
            getTreeNode : function(data, targetNode) {
                if (!data.compData) { return null; }
                var c = data.compData.config;
                if (typeof c == 'function') {
                  c.call(this,function(config) {
                    var n = this.appendConfig(config, targetNode, true, true);
                    this.setCurrentNode(n, true);
                  }, targetNode.elConfig);
                } else {
                  var n = this.appendConfig(this.cloneConfig(data.compData.config), targetNode, true, true);
                  this.setCurrentNode(n, true);
                  return n;
                }
                return null;

              }.createDelegate(this)
          });
        view.dragZone = d;
      }, this);

    var filter = function(b) { ds.filter('category', new RegExp(b.text)); };
    var tb = ['<b>Components categories : </b>', {
        text         : 'All',
        toggleGroup  : 'categories',
        enableToggle : true,
        pressed      : true,
        scope        : ds,
        handler      : ds.clearFilter
      }, '-'];
    var cats = [];
    ds.each(function(r) {
      var tokens = r.data.category.split(",");
      Ext.each(tokens, function(token) {
        if (cats.indexOf(token) == -1) {
          cats.push(token);
        }
      });
    });
    Ext.each(cats, function(v) {
      tb.push({
          text         : v,
          toggleGroup  : 'categories',
          enableToggle : true,
          handler      : filter
        });
      });

    var panel = new Ext.Panel({
      region:'south',
      height:100,
      layout:'fit',
      autoScroll:true,
      items:[view],
      tbar:tb
    });

    panel.view = view;
    this.componentsPanel = panel;
  },

  /**
   * @private Init the undo history list
   */
  initUndoHistory : function() {
    this.undoHistoryMax = this.undoHistoryMax || 20;
    this.undoHistory = [];
  },

 /**
  * Array with types that should been threaded as a TabPanel.
  * @type {Array of string} 
  */  
  tabPanelXtype : ['tabpanel'],

 /**
  * Check if the node or parent is one of the types in tabPanelXtype. 
  * If so activate the tabpanel for this node and return the node of this tabpanel
  * @param {Node} node The node to be checked
  * @param {Node} childNode The original node used when called recursive
  * @return {Node} The the select node of tabPanel or the original node
  */
  tabPanelNode : function(node,childNode) {
    if (node.elConfig && this.tabPanelXtype.indexOf(node.elConfig.xtype) != -1) {
      var el = node.fEl.getActiveTab(); 
      if (childNode) el = childNode.fEl;
      for (var i=0,len=node.fEl.items.items.length;i<len;i++) {
        if (node.fEl.items.items[i]==el) {
          node.elConfig.activeTab=i;
          if (childNode) node.fEl.setActiveTab(el);
          return node.childNodes[i];
        }
      }
    } else if (node.parentNode && !childNode) {
      this.tabPanelNode(node.parentNode,node);
    }
    return node;
  },
  

 /**
  * Show a message on the right side of the screen in the menubar just beside the help/version button.
  * @param {String} msg The message to be shown
  */
  menuMessage : function(msg){
    Ext.getCmp(this.FBmenuMessage).setText(msg);   
  },


  /**
   * @private Update undo button according to undo history
   */
  updateUndoBtn : function() {
    if (this.undoHistory.length == 0) {
      Ext.getCmp(this.FBUndoBtn).disable().setText('Undo');
    } else {
      Ext.getCmp(this.FBUndoBtn).enable().setText('<b>Undo</b> : ' +
        this.undoHistory[this.undoHistory.length-1].text);
    }
  },
  
  /**
   * Create a undo point for the configuration change.
   * @param {String} text The text shown in menubar belowing to change
   */
  markUndo : function(text) {
    this.undoHistory.push({text:text,config:this.getConfig()});
    if (this.undoHistory.length > this.undoHistoryMax) {
      this.undoHistory.remove(this.undoHistory[0]);
    }
    this.updateUndoBtn();
    this.modified = true;
    Ext.getCmp(this.FBSaveBtn).enable();
  },

  /**
   * Undo last change
   */
  undo : function() {
    var undo = this.undoHistory.pop();
    this.updateUndoBtn();
    if (!undo || !undo.config) { return false; }
    this.setConfig(undo.config);
    this.modified = true;
    Ext.getCmp(this.FBSaveBtn).enable();
    return true;
  },
  
  /**
   * @private Find a node for a event using xy coordinates
   * @param {Event} event The event for which a node should be searched
   * @param {Node} container The container search within (defaults builderPanel)
   * @return {Node} The node that is located by xy coordinates or null when none.
   */
  getNodeForEvent : function(event,container) {
    if (!event) return;
    var n;
    var findNode = function(c,p) {
      if (c && c.getPosition && c.getSize) {
       var pos = c.getPosition();
       var size = c.getSize();
       if (event.xy[0] >= pos[0] && event.xy[0]<=pos[0] + size.width &&
           event.xy[1] >= pos[1] && event.xy[1]<=pos[1] + size.height) {
         if (c._node) n = c._node; else if (container) n=c;  
         if (c.findBy) c.findBy(findNode);
       }
      }
    };
    (container || this.builderPanel).findBy(findNode);
    return n;
  },
  
  /**
   * Search for a node specified by element
   * @param {Element} el The element for which to find a node
   * @param {Event} event the event causing the search
   * @return {Node} The node corresponding to an element
   */
  getNodeForEl : function(el,event) {
    var search = 0;
    var target = null;
    while (search < 10 && el) {
      target = Ext.getCmp(el.id);
      if (target && target._node) {
        return target._node;
      }
      el = el.parentNode;
      if (!el) { break; }
      search++;
    }
    //BugFix for FireFox first item not working
    return this.getNodeForEvent(event) || this.editPanel.currentNode || this.treePanel.root;
  },

  /**
   * Show the layer to visual resize / move element 
   * @param {Node} the node to be resize / moved
   */
  visualResize : function(node) {
    if (node == this.treePanel.root || !node || !node.fEl) { return; }
    if (node.parentNode && node.parentNode.elConfig && node.parentNode.elConfig.layout == 'fit') {
      Ext.Msg.alert("Error", "You won't be able to resize an element" +
        " contained in a 'fit' layout.<br/>Update the parent element instead.");
    } else {
      if (node.parentNode && node.parentNode.elConfig && node.parentNode.elConfig.layout == 'absolute') {
        this.resizeLayer.resizer.dd.unlock();
        this.resizeLayer.resizer.dd.constrainTo(node.parentNode.fEl.body);
      } else {
        this.resizeLayer.resizer.dd.lock();
      }
      this.resizeLayer.setBox(node.fEl.el.getBox());
      this.resizeLayer.show();
    }
  },

  /**
   * @private Hide select layers on event
   * @param {Event} e The click event
   */
  hideHighlight : function(e) {
    if (e) { e.preventDefault(); }
    this.builderPanel.el.select('.selectedElement').removeClass('selectedElement');
    this.builderPanel.el.select('.selectedElementParent').removeClass('selectedElementParent');
  },

  /**
   * Set the current editing node and selects it in treepanel if required
   * @param {Node} node The node to set as current Node, when null root is taken
   * @param {Boolean} select Should the node be selected in treepanel
   */
  setCurrentNode : function(node, select) {
    var p = this.editPanel;
    p.enable();
    if (!node) {
      node = this.treePanel.root;
      select = true;
    }
    p.setSource(node.elConfig);
    p.currentNode = node;
    if (select) {
      this.treePanel.expandPath(node.getPath());
      node.select();
    }
  },

  /**
   * Update node text & id of the treepanel and loads javascript and stylesheet in case of root item
   * @param {Node} node The node to update in treepanel 
   */
  updateNode : function(node) {
    if (!node) { return; }
    if (node==this.treePanel.root) {    
     node.setText(node.elConfig.title?this.configToText(node.elConfig):this.configToText(node));
     this.required_js(node.elConfig.required_js);
     this.required_css(node.elConfig.required_css);                    
    } else {
      node.setText(this.configToText(node.elConfig));
      if (node.elConfig.id && node.elConfig.id != node.id) {
        node.id = node.elConfig.id;
      }
    }
  },
  
  /**
   * @private Search upware for a container to update, 
   * @see updateForm
   */
  searchForContainerToUpdate : function(node) {
      // search for a parent with border or column layout
      var found = null;
      var root = this.treePanel.root;
      var n = node;
      while (n && n != root) {
        if (n && n.elConfig &&
            !(n.elConfig.layout == 'auto' ||
              n.elConfig.layout == 'fit')
            ) {
          found = n;
        }
        n = n.parentNode;
      }
      if (found !== null) { return found.parentNode; }
  
      // no column parent, search for first container with items
      n = node;
      while (n != root) {
        if (!n.fEl || !n.fEl.items) {
          n = n.parentNode;
        } else {
          break;
        }
      }
      return n;
  },

  /**
   * Update the builderform at the specified node
   * @param {Boolean} force Should update of node always take place, or only when option autoUpdate is true
   * @param {Node} node The node to update
   */
  updateForm : function(force, node) {
      node = node || this.treePanel.root;
      var time = null;
      // search container to update, upwards
      node = this.searchForContainerToUpdate(node);
      if (force === true || this.autoUpdate) {
        var config = this.getTreeConfig(node, true);
        delete config.window;
        time = this.setFormConfig(config, node.fEl);        
        this.updateTreeEls(node.fEl);
        this.hideHighlight();
        // save into cookies
        if (this.cookies) 
          this.cookies.set('Designerconfig',escape(this.getConfig()));
      }
      if (time) {
        Ext.getCmp(this.FBRenderingTimeBtn).setText(
          'Rendering time : <i>' + time + 'ms</i>');
      }
  },  

  /**
   * Load config from cookies or url
   * @see Config item url and filename
   * @return {Boolean} Indicator that load was succesfull   
   */
  loadConfig : function() {
      if (this.url) {
         var params = this.filename ? {filename:this.filename} : {};
         Ext.Ajax.request({
              url: this.url,
              method : 'GET',
              params : params,
              callback: function(options, success, response){
                if (success) {
                 this.fireEvent('beforejsonload',response);
                 this.setConfig(response.responseText);
                 this.fireEvent('afterjsonload');
                 this.modified = false;
                } else {
                  if (this.fireEvent('failedjsonload',response))
                     Ext.Msg.alert('Failure','Failed to load url :' + this.url + ' ' + this.filename);
                }     
              },
              scope: this
          });
      } else if (this.cookies) {
         return this.setConfig(unescape(this.cookies.get('Designerconfig')));
      }  
    //Default we reject 
    return false;
  },
  
  /**
   * Save config to url
   * @see Config item url and filename
   */
  saveConfig : function() {
    if (this.url) {
      var self = this;
      var params = this.filename ? {filename:this.filename} : {};
       params['data']=this.getConfig(),
       Ext.getCmp(this.FBSaveBtn).disable();
       Ext.Ajax.request({
            url: this.url,
            method : 'POST',
            params : params,
            callback: function(options, success, response){
              if (!success) {
               Ext.getCmp(this.FBSaveBtn).enable();
               Ext.Msg.alert('Failure','Failed to save url :' + this.url + ' ' + this.filename);
              } else {
                self.modified = false;
              }
            },
            scope: this
        });
    } else Ext.Msg.alert('Failure','No save url specified');    
  },

  /**
   * Highlight an element on the builderPanel
   * @param {Element} el The element to highlight
   */
  highlightElement : function(el) {
      this.resizeLayer.hide();
      if (el == this.builderPanel.el) { return; }
      if (el) {
        var elParent = el.findParent('.x-form-element', 5, true);
        this.hideHighlight();
        if (elParent) { elParent.addClass("selectedElementParent"); }
        el.addClass("selectedElement");
      }
  },

  /**
   * Get the tree config at the specified node
   * @param {Node} node The node to get the config from, defaults root of treepanel
   * @param {Boolean} addNodeInfos Should builderpanel (_node) info be added to config
   * @return {Object} The config object created
   */
  getTreeConfig : function(node, addNodeInfos) {
    if (!node) { node = this.treePanel.root; }
    var config = Ext.apply({}, node.elConfig);
    if (!config.id && addNodeInfos && node!=this.treePanel.root) { config.id = node.id; }
    if (addNodeInfos) { config._node = node; }
    var items = [];
    node.eachChild(function(n) {
      items.push(this.getTreeConfig(n, addNodeInfos));
    }, this);
    if (items.length > 0) {
      config.items = items;
    } else if (config.xtype == 'form') {
      config.items = {};
    } else {
      delete config.items;
    }
    return config;
  },

  /**
   * @private update node.fEl._node associations
   * @param {Element} el The element to update
   */
  updateTreeEls : function(el) {
    if (!el) { el = this.builderPanel; }
    if (el._node) {
      el._node.fEl = el;
      // workaround for fieldsets
      if (el.xtype == 'fieldset') {
        el.el.dom.id = el.id;
      }
    }
    if (!el.items) { return; }
    try {
      el.items.each(function(i) { this.updateTreeEls(i); }, this);
    } catch (e) {}
  },

  /**
   * Create a text form a configobject as shown in the treepanel
   * @param {Object} c The config object for which to create a text
   * @return {String} A html text string for the config item
   */
  configToText : function(c) {
    var txt = [];
    c = c || {};
    if (c.xtype)      { txt.push(c.xtype); }
    if (c.fieldLabel) { txt.push('[' + c.fieldLabel + ']'); }
    if (c.boxLabel)   { txt.push('[' + c.boxLabel + ']'); }
    if (c.layout)     { txt.push('<i>' + c.layout + '</i>'); }
    if (c.title)      { txt.push('<b>' + c.title + '</b>'); }
    if (c.text)       { txt.push('<b>' + c.text + '</b>'); }
    if (c.region)     { txt.push('<i>(' + c.region + ')</i>'); }
    return (txt.length == 0 ? "Element" : txt.join(" "));
  },

  /**
   * Determin the attribute type of a field used during encoding of javascript
   * @param {String} name The name of the field to check
   * @return {String} The type of field (mixed,object,array,string,boolean,....)
   */
  attrType : function(name) {
    if (!this.docFields[name]) { return 'mixed'; }
    return this.docFields[name].type;
  },

  /**
   * Clone a config object
   * @param {Object} config The config object to be cloned
   * @return {Object} The cloned config object
   */
  cloneConfig : function(config) {
    if (!config) { return null; }
    var newConfig = {};
    for (i in config) {
      if (typeof config[i] == 'object') {
        newConfig[i] = this.cloneConfig(config[i]);
      } else if (typeof config[i] != 'function') {
        newConfig[i] = config[i];
      }
    }
    return newConfig;
  },

  /**
   * Reset the current configation by clearing the internal configuration file.
   */
  resetAll : function() {
    this.setConfig('{}');
    this.setCurrentNode();
  },
  
  /**
   * Check if the given xtype is a container which can contain other xtypes
   * @param {String} xtype The xtype to validate if it is in the list
   * @return {Boolean} True indicates the xtype is a container capable of contain other elements
   */
  isContainer : function (xtype) {
    return  (xtype && ['jsonpanel','panel','viewport','form','window','tabpanel','toolbar','fieldset'].indexOf(xtype) !== -1);
  },

  /** 
   * Check if the config can be appended to the specified treenode
   * @param {Object} config The configuration object to append
   * @param {Node} node The treenode to which to configuration should be appended
   * @return {Boolean/String} True if config can be added to node, or an error message if it cannot
   */
  canAppend : function(config, node) {
    var ctype = config.xtype;
    if (node == this.treePanel.root && this.treePanel.root.hasChildNodes()) {
      return "Only one element can be directly under the GUI Designer";
    }
    var xtype = node.elConfig.xtype;
    if (xtype && !this.isContainer(xtype)) {
      return 'You cannot add element under xtype "'+xtype+'"';
    }
    if (xtype && ['form'].indexOf(xtype) !=-1 && 
        ctype && ['viewport','form','window','tabpanel','toolbar'].indexOf(ctype) != -1) {
      return 'You cannot add element "' +ctype + '" under "'+xtype+'"';
    }
    return true;
  },

  /**
   * Add a config to the tree element
   * @param {Object} config The configuration object to append
   * @param {Node} appentTo The treenode used to appendTo (defaults treeroot)
   * @param {Boolean} doUpdate Should builderform be updated (defaults true)
   * @param {Boolean} markUndo Should change be marked as a undo
   * @return {Node} The treenode that has been created
   */
  appendConfig : function(config, appendTo, doUpdate, markUndo) {
    if (!appendTo) {
      appendTo = this.treePanel.getSelectedNode() ||
        this.treePanel.root;
    }
    if (appendTo==this.treePanel.root) {
       if (config.window) appendTo.elConfig = config.window;
       delete config.window;
       var c = 0; //Check if there are other elements to add
       for(var k in config) c++;
       if (c==0) return appendTo;
    }
    var canAppend = this.canAppend(config,appendTo);
    if (canAppend !== true) {
      Ext.Msg.alert("Unable to add element", canAppend);
      return appendTo;
    }
    var items = config.items;
    delete config.items;    
    var id = config.id||(config._node ? config._node.id : Ext.id());
    var newNode = new Ext.tree.TreeNode({id:id,text:this.configToText(config)});
    for(var k in config) { 
      if (config[k]===null) {delete config[k];}
    }
    newNode.elConfig = config;

    if (markUndo === true) {
      this.markUndo("Add " + newNode.text);
    }
    appendTo.appendChild(newNode);

    if (items && items.length) {
      for (var i = 0; i < items.length; i++) {
          this.appendConfig(items[i], newNode, false);
      }
    }
    
    if (doUpdate !== false) {
      this.updateForm(false, newNode);
    }
    return newNode;    
  },

  /**
   * Remove a node from the treepanel
   * @param {Node} node The node to remove
   */
  removeNode : function(node) {
      if (!node || node == this.treePanel.root) { return; }
      this.markUndo("Remove " + node.text);
      var nextNode = node.nextSibling || node.parentNode;
      var pNode = node.parentNode;
      pNode.removeChild(node);
      this.updateForm(false, pNode);
      this.setCurrentNode(nextNode, true);
  },
  
  /**
   * Update the builderform with the configuration
   * @param {Object} config The configuration object to apply
   * @param {Element} el The element used to apply config (defaults builderPanel)
   * @param {Int} The time it spend in ms to apply the config
   */
  setFormConfig : function(config, el) {
    var start = new Date().getTime();
    el = el || this.builderPanel;
    // empty the element
    if (el.items) while (el.items.first()) {el.remove(el.items.first(), true);}
    //if (el.getLayoutTarget) el.getLayoutTarget().update(); else  el.update();
    // adding items, enabling functions by recoding the functions
    if (config.items) {
      try {
        var items = this.applyCode(config.items);
        if(items instanceof Array) {
          el.add.apply(el,items);
        } else {
          el.add(items);
        }
      } catch (e) {
        Ext.Msg.alert('Information','Could not add configuration item because of error '  + e.name + '<br/>' + e.message);
      }
    }
    if (el.rendered && el.layout && el.layout.layout) el.doLayout();
    var time = new Date().getTime() - start;
    return time;
  },

  /**
   * Show a modal window with the result of design
   */
  showConfig : function() {
    var config = Ext.decode(this.getConfig());
    var window = config.window;
    delete config.window;
    var self = this;
    //Disable the designer so tabindex is disabled
    this.disable();
    var showWindow = new Ext.Window(Ext.apply({
          title  : 'Show Config',
          width:600,
          height: 400,
          layout:'fit',
          iconCls: 'icon-show',
          items : config,
          modal       : true,
          maximizable : true,
          closeAction : 'close',
          listeners   : { 'beforeclose' : function(){
                            self.enable();
                        }} 
          },window));
    showWindow.show();
  },

  /**
   * Show a modal window with the JSON in plain text. 
   * When using the apply function, the JSON will be reapply to the designer
   */
  editConfig : function() {
    var size = this.getSize();
    if (!this.jsonWindow) {
      var tf = new Ext.form.TextArea();
      this.jsonWindow = new Ext.Window({
          title       : "Edit JSON",
          width       : size.width-100,
          height      : size.height - 50,
          autoScroll  : true,
          layout      : 'fit',
          maximizable : true,
          items       : tf,
          modal       : true,
          closeAction : 'hide'
        });
      this.jsonWindow.tf = tf;

      this.jsonWindow.addButton({
          text    : "Close",
          scope   : this.jsonWindow,
          handler : function() { this.hide(); }
        });
      this.jsonWindow.addButton({
          text    : "Apply",
          scope   : this,
          handler : function() {
            var config = null;
            this.jsonWindow.el.mask("Please wait...");
            this.markUndo("Edit JSON changes");
            if (!this.setConfig(tf.getValue()))  {
                this.jsonWindow.el.unmask();
                return;
            }
            if (this.cookies) 
              this.cookies.set('Designerconfig',escape(this.getConfig()));
            Ext.getCmp(this.FBSaveBtn).enable();
            this.jsonWindow.el.unmask();
            this.jsonWindow.hide();
          }
        });
    }
    this.jsonWindow.tf.setValue(this.getConfig());
    this.jsonWindow.show();
  },

  /**
   * Set a new desgin config object. This will remove previous design
   * @param {String/Object} config The config as Json string or Json Object
   * @return {Object/Boolean} Returns root object or False when there was an error
   */
  setConfig : function(config) {
   try {
      if (typeof config == 'object') {
       config = (config.items?config.items[0]||{}:{});
       config = this.encode(config);    
      }
      config = this.decode(config);      
      if (!config) return false;  
      if (config.window) {
        this.required_js(config.window.required_js);
        this.required_css(config.window.required_css);   
      }
      config = ({items:[config]});
      var root = this.treePanel.root;
      // delete all items
      while(root.firstChild){
        root.removeChild(root.firstChild);
      }
      var root = this.treePanel.root;
      root.beginUpdate();

      // add all items
      root.elConfig = {};
      for (var i = 0; i < config.items.length; i++) {
        if (config.items[i]) this.appendConfig(config.items[i], root,false);
      }
      this.updateForm(true, root);
      this.updateNode(root);
      this.setCurrentNode(root, true);
      root.endUpdate();      
      return root;
    } catch(e) {
       Ext.Msg.alert("Error", "Loading config : " + e.name + "<br/>" + e.message);
       return false;
    }
  },
  
  /**
   * Get the JSON configuration created
   * @return {String} The encode JSON of the current design
   */
  getConfig : function(){
   var cleanConfig = this.getTreeConfig();
   cleanConfig = (cleanConfig.items?cleanConfig.items[0]||{}:{});
   var w = this.treePanel.root.elConfig;
   var c = 0;
   for (k in w) if (w[k]===null) delete w[k]; else c++;
   if (c!=0) cleanConfig.window = w
   return this.encode(cleanConfig);
  },

  /**
   * Init all the editors and fields used by the designer
   */
  initFields : function() {
    if (!this.docFields) {
      this.docFields=this.static.getDocFields(this.componentDocs);
      this.editors=Ext.apply(this.static.getEditors(this.docFields),this.editors);
    }
  },
  
  /**
   * Get the customer editors
   * @return {Object} A object array with all grid editors
   */
  getEditors  : function() {
    this.initFields();
    return this.editors;
  },
  

  /**
   * Get the components of the Editor combining the static with config Components
   * @return {Object} A object array with all components
   */
  getComponents : function() {  
    return this.static.getComponents(this.components);
  },  
  
  /**
   * Change the javacode saved as strings to the real objects used so the can be executed
   * @param {Object} o The config object that should be convert to real code
   * @param {Object} The convert config object
   */
  applyCode : function(o) {   
    if (typeof o == "object") {
      for (i in o) {
        if (i === "_node") { continue; }
        var v = o[i];
        if (i === "id" && /^form-gen-/.test(o[i])) { continue; }
        if (i === "id" && /^ext-comp-/.test(o[i])) { continue; }
        if (i === "tabIndex") {o[i] = o[i] + 900000;continue;}
        if (i === "xtype" && v=='designer') {o['embedded']=true;}
        if (['function','regexp'].indexOf(this.attrType(i))!=-1  && typeof v === 'string') {
          if (this.javascriptEnabled)
            o[i] = eval('o[i] = ' + v);
          else
            delete o[i];
        } else if (['object','array','mixed'].indexOf(this.attrType(i))!=-1 && typeof v === 'string') {
            try {  o[i] = eval('o[i] = ' + v); } catch (e) {}
            if (!this.javascriptEnabled && typeof o[i] == 'function')
              delete o[i];
        } else {
          switch (typeof v) {
           case "undefined":
           case "function":
           case "unknown":
              break;
           default:
             o[i] = this.applyCode(v);
          }
        }
      }
    }    
    return o;
  }
});
Ext.reg('designer', Ext.ux.Designer);

/**
 * Implement the static functions required by designer to increase performance 
 * @return {Object} The object contains the following functions
 * getComponents, getEditors, getFields, toFields
 */
Ext.ux.Designer.Static = function(){
   var gridFields, gridEditors, edComponents;
   var loaded = false;
   
   //Init QuickTips
   Ext.QuickTips.init();
 
   /**
    * @private Internal function to load jsonfiles synchrone
    * @param {String} filename The file of the json to read
    * @return {Object} The decode Json as an object
    */
   function jsonLoader(filename) {
      var result = Ext.ux.SyncLoader(filename,false);
      if (result===false) {
        Ext.Msg.alert('Failure','Failed to load designer json file '+ filename);
        return {};
      }
      return Ext.decode(result);
    }  
  
   /**
    * @private Convert documentation into gridFields
    * @param {Object} componentDoc The componentDoc object array to be convert into fields
    * @return {Object} A object array containing fields
    */
   function toDocFields(componentDoc) {
     var fileName,infos,type,desc,myFields = {};
     if (componentDoc) {
       for (fileName in componentDoc) {
         for (key in componentDoc[fileName]) {
           infos = componentDoc[fileName][key];
           desc = "<i>"+fileName+"</i><br/><b>"+infos.type+"</b> "+infos.desc;
           if (!myFields[key]) {
             myFields[key] = Ext.apply(infos,{ desc:desc});
             if (infos.type == "Boolean") {
               type = "boolean";        
             } else if (infos.type == "RegExp") {
               type = "regexp";
             }  else if (infos.type == "Number") {
               type = "number";
             } else if (infos.type == "Array") {  
               type = "array";
             } else if (infos.type == "Object") {
               type = "object";
             } else if (infos.type == "HTML") {
               type = "html";
             } else if (infos.type == "Function") {
               type = "function";
             } else if (infos.type == "String") {
               type = "string";
             } else {
               type = "mixed";
             }
             myFields[key].type = type;
           } else {
             myFields[key].desc += "<hr/>" + desc;
           }
         }
       }
     }
     return myFields;
   }

  /**
   * @private Create and add gridEditors for the specified gridFields 
   * @param {Object} gridFields The list of Fields for which to create editors
   * @param {Object} Return the gridEditors
   */
  function getEditors(gridFields) {
   var gridEditors = {};
   if (gridFields){
    var cmEditors =   Ext.apply(new Ext.grid.PropertyColumnModel().editors,
            { 'regexp' : new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'new RegExp()'})),
              'function':new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'function(){}'})),
              'object':new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'{}'})),
              'array': new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'[]'})),
              'mixed': new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:''})),
              'html' : new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'',language:'html'})),
              'css' : new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'',language:'css'}))
            });   
    for (i in gridFields) {
        if (gridFields[i].values) {
          var values = gridFields[i].values;
          var data = [];
          for (j=0;j<values.length;j++) { 
            data.push([values[j],values[j]]); 
          }
          gridEditors[i] = new Ext.grid.GridEditor(
            new Ext.ux.form.SimpleCombo({forceSelection:false,data:data,editable:true,customProperties:gridFields[i].editable}));
        } else if (gridFields[i].editor && cmEditors[gridFields[i].editor]) {
           gridEditors[i] = cmEditors[gridFields[i].editor]
        } else if (cmEditors[gridFields[i].type]) {
          gridEditors[i]= cmEditors[gridFields[i].type];
        } else {        
          gridEditors[i] = cmEditors['string'];
        }
      }
    }
    return gridEditors;
  }
  
   /**
    * @private Init the global designer components 
    */
   function init(){
     if (loaded) return;
     loaded = true;
     
     //Locate the designer javascript file
     var elements = document.getElementsByTagName("script");
     var path;
     for (var i=0;i<elements.length;i++) {
       var s = elements[i].src ? elements[i].src : elements[i].id;
       if (s.match(/Ext.ux.Designer\.js(\?.*)?$/)) {
         path = s.replace(/Ext.ux.Designer\.js(\?.*)?$/,'');
         var includes = s.match(/\?.*load=([a-z,]*)/);
         var files = includes ? includes[1] : [];
         for (var f=0;f<files.length;f++) {
            Ext.ux.ScriptLoader(path+files[f],false);
         }
       }
     }

     //Load the default components
     edComponents  = jsonLoader(path+'Ext.ux.Designer.Components.json');
     //Create the gridFields based on default component documentation
     gridFields = Ext.apply({layout:{},vtype:{},defaults:{},defaultType:{}},
              toDocFields(jsonLoader(path+'Ext.ux.Designer.ComponentsDoc.json')));
     gridFields.layout.values = [];
     for (i in Ext.Container.LAYOUTS) { gridFields.layout.values.push(i); }
     gridFields.vtype.values = [];
     for (i in Ext.form.VTypes) { gridFields.vtype.values.push(i); }
     gridFields.defaultType.values = gridFields.defaults.xtype;   
   }
   
 return {
    /**
     * Get the components which can be used within the designer
     * @param {Object} components A object array containing additional components (defaults null)
     * @return {Object} A object with all components
     */
    getComponents : function(components) {
                     init();
                     return Ext.applyIf(components || {},edComponents); 
                    },
    /**
     * Get the editors used within the property Grid
     * @param {Object} fields A object array containing additional fields for which the editors should be created (defaults null)
     * @param {Object} A object with all editors
     */
    getEditors    : function(docFields){
                      init();
                      return getEditors(docFields || gridFields);
                    },
    /**
     * A array with all grid Fields loaded
     */     
    getDocFields  : function (componentDoc) {
                       init();
                       return Ext.applyIf(toDocFields(componentDoc || {}),gridFields);
                    },
    /**
     * Init the static fields
     */
    init          : init
  }  
}();

//Call init method
Ext.onReady(Ext.ux.Designer.Static.init);