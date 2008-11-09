 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This file implements a property grid which is used on the edit panel of designer
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
Ext.namespace('Ext.ux.guid.grid');

/**
 * The propertyrecord used by the property grid.
 * Name is the key of a property, Value is the value of the property and
 * type is type of element. This type flag will control which editor is loaded
 */
 Ext.ux.guid.grid.PropertyRecord = Ext.data.Record.create([
    {name:'name',type:'string'}, 'value' , 'type'
]);

/**
 * The constructor of property store
 */
Ext.ux.guid.grid.PropertyStore = function(grid, source){
    Ext.ux.guid.grid.PropertyStore.superclass.constructor.call(this,grid,source);
    this.store = new Ext.data.Store({
        recordType : Ext.ux.guid.grid.PropertyRecord
    });
    this.store.on('update', this.onUpdate,  this);
};

/**
 * Constructor used to create a store used to store designer data
 */
Ext.extend(Ext.ux.guid.grid.PropertyStore, Ext.grid.PropertyStore, {
    //@private The json id  
    jsonId : "__JSON__",

    /**
     * Get a property type for given name
     * @param {string} name The property to look fore
     */
    getPropertyType : function (name) {
      if (this.grid && this.grid.getPropertyType)
         return this.grid.getPropertyType(name);
      return null;
    },

    /**
     * protected  - should only be called by the grid.  Use grid.setSource instead.
     * Based on source object a property record is created
     * @param {object} o The source object 
     */
    setSource : function(o){
        this.source = o;
        this.store.removeAll();
        var data = [];
        for(var k in o){
            var orgKey = (k.indexOf(this.jsonId)==0 && k!=this.jsonId) ?
                 k.substring(this.jsonId.length) : null;
            if (orgKey && o[orgKey]==undefined) k =orgKey;
            if(k.indexOf(this.jsonId)!=0 && ['items'].indexOf(k)==-1){
                var v = o[this.jsonId + k];
                var type = null;
                if (typeof(v)=='object') {
                   type = v.type || type;
                   v = v.display || v.value;
                }
                if (typeof(o[k]) == 'function') {
                  data.push(new Ext.grid.PropertyRecord({name: k, value: v || String(o[k]) , type : 'function'}, k));
                } else if (typeof(o[k]) == 'object') {
                  data.push(new Ext.grid.PropertyRecord({name: k, value: v || String(Ext.ux.JSON.encode(o[k])), type : 'object'}, k));
                } else {
                  data.push(new Ext.grid.PropertyRecord({name: k, value: v || o[k], type : type }, k));
                }
            }
        }
        this.store.loadRecords({records: data}, {}, true);
    },

    /**
     * @private Update the data and fire beforepropetychange and propertychange events
     * @param {object} ds The datastore
     * @param {object} record The record
     * @param {String} The edit mode
     */
    onUpdate : function(ds, record, type){
        if(type == Ext.data.Record.EDIT){
            var v = record.data['value'];
            var oldValue = record.modified['value'];
            if(this.grid.fireEvent('beforepropertychange', this.source, record.id, v, oldValue) !== false){
                record.data.changeValue = this.updateSource(record.id,v,record.data.type);
                record.commit();
                this.grid.fireEvent('propertychange', this.source, record.id, v, oldValue);
            }else{
                record.reject();
            }
        }
    },

    /**
     * @private Update a source value property
     * @param {String} key The property key to change
     * @param {String} value The value to change
     * @param {String} type The property type
     */
    updateSource : function (key,value,type) {
      var propType = this.getPropertyType(key);
      if (!type && propType) type=propType.type;
      if (this.grid.fireEvent('propertyvalue',this.source,key,value,type,propType)) {
        this.source[key] = value;
      }
      return this.source[key];
    },

    /**
     * Set the value of a property
     * @param {String} prop The property to set
     * @param {String} value The value to be set
     */
    setValue : function(prop, value){
        this.store.getById(prop).set('value', value);
        this.updateSource(prop,value);
    }

});


/**
 * Constructior which extends default PropertyColumnModel in so that 
 * we implement other editors
 */
Ext.ux.guid.grid.PropertyColumnModel = function(grid, store){
    Ext.ux.guid.grid.PropertyColumnModel.superclass.constructor.call(this,grid,store);
    this.setConfig( [
        {header: this.nameText, width:40, resizable:true, sortable: true, dataIndex:'name', id: 'name', menuDisabled:true},
        {header: this.valueText, width:60, resizable:false, dataIndex: 'value', id: 'value', menuDisabled:true}
    ]);
    this.jsonId=grid.jsonId;
    Ext.apply(this.editors,{
        'regexp' : new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'new RegExp()',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'function':new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'function(){}',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'object':new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'{}',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'object/array':new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'[{}]',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'array': new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'[]',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'template': new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'mixed': new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'html' : new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',language:'html',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'css' : new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',language:'css',codePress:grid.codePress,codePressPath:grid.codePressPath})),
        'editlist' :new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[],editable:true,customProperties:true})),
        'list':new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[],editable:true,customProperties:false})),
        'boolean':new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[[true,'true'],[false,'false']],editable:true,customProperties:true}))
    });
    this.valueRendererDelegate = this.valueRenderer.createDelegate(this);
    this.propertyRendererDelegate = this.propertyRenderer.createDelegate(this);
};

/**
 * Extend the default PropertyColumnModel in so that we implement other editors
 */
Ext.extend(Ext.ux.guid.grid.PropertyColumnModel,Ext.grid.PropertyColumnModel, {
    /**
     * Get a property type for given name
     * @param {string} name The property to look fore
     */  
    getPropertyType : function (name) {
      if (this.grid && this.grid.getPropertyType) return this.grid.getPropertyType(name);
      return null;
    },

    /**
     * Get the celleditor by row and colIndex
     * @param {int} colIndex The column index
     * @param {int} rowIndex The row index
     * @returns {Object} The cellEditor
     */
    getCellEditor : function(colIndex, rowIndex){
        var p = this.store.getProperty(rowIndex);
        var n = p.data['name'], val = p.data['value'], t = p.data['type'];
        if(this.grid.customEditors[n]){
            return this.grid.customEditors[n];
        }
        var prop = this.getPropertyType(n);
        //Check if there is a property and if there is a editor
        if (prop) {
          if (prop.editor) {
            if (typeof(prop.editor)!='string') {
               return prop.editor;
            }
            t = prop.editor;
          }
          t = t || prop.type;
          if (!t && prop.values) {
            var editor =  prop.editable ? this.editors['editlist'] : this.editors['list'];
            editor.field.setList(prop.values);
            return editor;
          }
        }

        if (t && this.editors[t]) {
          return this.editors[t];
        } else if(Ext.isDate(val)){
            return this.editors['date'];
        }else if(typeof val == 'number'){
            return this.editors['number'];
        }else if(typeof val == 'boolean'){
            return this.editors['boolean'];
        }
        return this.defaultEditor || this.editors[prop ? 'string' : 'mixed'];
    },

    /**
     * Format the value of cell
     * @param {object} The value to be formated
     * @param {Element} The element
     * @param {Record} The record
     */
    valueRenderer  : function(value, p, r) {
      if (typeof value == 'boolean') {
        p.css = (value ? "typeBoolTrue" : "typeBoolFalse");
        return (value ? "True" : "False");
      }
      var propType = this.getPropertyType(r.id);
      if (propType && ['object','array','object/array'].indexOf(propType.type)!=-1) {
        p.css = "typeObject";
      }
      if (typeof(value)=="string" && value.length>24) {
        value = value.substring(0,21) + "...";
      }
      //Decode the value for html
      var div = document.createElement('div');
      div.appendChild(document.createTextNode(value));
      return div.innerHTML;
    },

    /**
     * @private Implement a tooltip
     */
    propertyRenderer :  function(value, p) {
      var propType = this.getPropertyType(value);
      if (propType) {
        qtip = propType.desc || '';
        p.attr = 'qtip="' + qtip.replace(/"/g,'&quot;') + '"'; //'
      }
      return value;
    },

    /**
     * @private Return one of the property renders
     */
    getRenderer  : function(col){
       return col == 0 ? this.propertyRendererDelegate : this.valueRendererDelegate;
    }
});


/**
 * Create a property gird by extending a Grid
 * @type component
 */
Ext.ux.guid.grid.PropertyGrid = Ext.extend(Ext.grid.EditorGridPanel, {
    // @private columns cannot be moved
    enableColumnMove:false,
    // @private Rows will not be stripped
    stripeRows:false,
    // @private Mouse over events are not tracked
    trackMouseOver: false,
    // @private Single click will start edit
    clicksToEdit:1,
    // @private noHD menu
    enableHdMenu : false,
    // @private Grid is forced to fit space
    viewConfig : {forceFit:true},
    // @private The internal jsonId used
    jsonId : '__JSON__',

    /**
     * Should it use codePress as code editor (defaults true)
     * @type {Boolean}
     @cfg */
    codePress : true, //codePress enabled

    /**
     * Location of CodePress
     * @type {String}
     @cfg */
    codePressPath : undefined,

    /**
     * Get a property type for given name
     * @param {string} name The property to look fore
     */   
    getPropertyType : function (name) {
      if (this.propertyTypes) {
        var i = this.propertyTypes.find('name',name);
        if (i!=-1) return this.propertyTypes.getAt(i).data;
      }
      return null;
    },

    /**
     * @private The component and events
     */
    initComponent : function(){
        this.customEditors = this.customEditors || {};
        this.lastEditRow = null;
        var store = new Ext.ux.guid.grid.PropertyStore(this);
        store.jsonId=this.jsonId,
        this.propStore = store;
        var cm = new Ext.ux.guid.grid.PropertyColumnModel(this, store);
        store.store.sort('name', 'ASC');
        this.addEvents(
            /**
              * Event fired before value changes
              * @param {Source} source The source object
              * @param {String} key The key changed
              * @param {String} value The value to be set
              * @param {String} type The type of value
              * @return {Boolean} False will assume custom assignment
              */
            'beforepropertychange',
            /**
             * Event fired when propery changed
             * @param {Source} source The source object
             * @param {String} key The key changed
             * @param {String} value The value to be set
             * @param {String} type The type of value
             * @return {Boolean} False will assume custom assignment
             */
            'propertychange',
            /**
             * Event fired to allow custom change of value
             * @param {Source} source The source object
             * @param {String} key The key changed
             * @param {String} value The value to be set
             * @param {String} type The type of value
             * @return {Boolean} False will assume custom assignment
             */
            'propertyvalue'
        );
        this.cm = cm;
        this.ds = store.store;
        Ext.ux.guid.grid.PropertyGrid.superclass.initComponent.call(this);

        this.selModel.on('beforecellselect', function(sm, rowIndex, colIndex){
            if(colIndex === 0){
                this.startEditing.defer(200, this, [rowIndex, 1]);
                return false;
            }
        }, this);
    },

    /**
     * @private Apply the property grid style
     */
    onRender : function(){
        Ext.ux.guid.grid.PropertyGrid.superclass.onRender.apply(this, arguments);
        this.getGridEl().addClass('x-props-grid');
    },

    /**
     * @private After render the source is set
     */
    afterRender: function(){
        Ext.ux.guid.grid.PropertyGrid.superclass.afterRender.apply(this, arguments);
        if(this.source){
            this.setSource(this.source);
        }
    },

    /**
     * Set the source of the grid
     * @param {Object} The source object
     */
    setSource : function(source){
        this.propStore.setSource(source);
    },

    /**
     * Get the datasource of the grid
     * @returns {Object} The datasource object
     */
    getSource : function(){
        return this.propStore.getSource();
    }
});

//Is not registered but required by designer
Ext.reg('guidpropertygrid', Ext.ux.guid.grid.PropertyGrid);
