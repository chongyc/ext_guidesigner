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
Ext.ux.guid.grid.PropertyStore = Ext.extend(Ext.grid.PropertyStore, {
    jsonId : "__JSON__",

    getPropertyType : function (name) {
      if (this.grid && this.grid.getPropertyType)
         return this.grid.getPropertyType(name);
      return null;
    },

    // protected - should only be called by the grid.  Use grid.setSource instead.
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
                }
                  data.push(new Ext.grid.PropertyRecord({name: k, value: v || o[k], type : type }, k));
            }
        }
        this.store.loadRecords({records: data}, {}, true);
    },

    // private
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

    updateSource : function (key,value,type) {
      var propType = this.getPropertyType(key);
      if (!type && propType) type=propType.type;
      if (this.grid.fireEvent('propertyvalue',this.source,key,value,type,propType)) {
        this.source[key] = value;
      }
      return this.source[key];
    },

    setValue : function(prop, value){
        this.store.getById(prop).set('value', value);
        this.updateSource(prop,value);
    }

});


Ext.ux.guid.grid.PropertyColumnModel = function(grid, store){
    Ext.ux.guid.grid.PropertyColumnModel.superclass.constructor.call(this,grid,store);
    this.setConfig( [
        {header: this.nameText, width:40, resizable:true, sortable: true, dataIndex:'name', id: 'name', menuDisabled:true},
        {header: this.valueText, width:60, resizable:false, dataIndex: 'value', id: 'value', menuDisabled:true}
    ]);
    this.jsonId=grid.jsonId;
    Ext.apply(this.editors,{
        'regexp' : new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'new RegExp()',codePress:grid.codePress})),
        'function':new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'function(){}',codePress:grid.codePress})),
        'object':new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'{}',codePress:grid.codePress})),
        'object/array':new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'[{}]',codePress:grid.codePress})),
        'array': new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'[]',codePress:grid.codePress})),
        'template': new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',codePress:grid.codePress})),
        'mixed': new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',codePress:grid.codePress})),
        'html' : new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',language:'html',codePress:grid.codePress})),
        'css' : new Ext.grid.GridEditor(new Ext.ux.form.CodeField({defaultValue:'',language:'css',codePress:grid.codePress})),
        'editlist' :new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[],editable:true,customProperties:true})),
        'list':new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[],editable:true,customProperties:false})),
        'boolean':new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[[true,'true'],[false,'false']],editable:true,customProperties:true}))
    });
    this.valueRendererDelegate = this.valueRenderer.createDelegate(this);
    this.propertyRendererDelegate = this.propertyRenderer.createDelegate(this);
};

Ext.extend(Ext.ux.guid.grid.PropertyColumnModel,Ext.grid.PropertyColumnModel, {
    // private

    getPropertyType : function (name) {
      if (this.grid && this.grid.getPropertyType) return this.grid.getPropertyType(name);
      return null;
    },

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
        return value.substring(0,21) + "...";
      }
      return value;
    },

    propertyRenderer :  function(value, p) {
      var propType = this.getPropertyType(value);
      if (propType) {
        qtip = propType.desc || '';
        p.attr = 'qtip="' + qtip.replace(/"/g,'&quot;') + '"'; //'
      }
      return value;
    },

    getRenderer  : function(col){
       return col == 0 ? this.propertyRendererDelegate : this.valueRendererDelegate;
    }
});


Ext.ux.guid.grid.PropertyGrid = Ext.extend(Ext.grid.EditorGridPanel, {
    // private config overrides
    enableColumnMove:false,
    stripeRows:false,
    trackMouseOver: false,
    clicksToEdit:1,
    enableHdMenu : false,
    viewConfig : {
        forceFit:true
    },
    jsonId : '__JSON__',
    
    /**
     * Should it use codePress as code editor (defaults true)
     * @type {Boolean}
     @cfg */
    codePress : true, //codePress enabled

    getPropertyType : function (name) {
      if (this.propertyTypes) {
        var i = this.propertyTypes.find('name',name);
        if (i!=-1) return this.propertyTypes.getAt(i).data;
      }
      return null;
    },

    // private
    initComponent : function(){
        this.customEditors = this.customEditors || {};
        this.lastEditRow = null;
        var store = new Ext.ux.guid.grid.PropertyStore(this);
        store.jsonId=this.jsonId,
        this.propStore = store;
        var cm = new Ext.ux.guid.grid.PropertyColumnModel(this, store);
        store.store.sort('name', 'ASC');
        this.addEvents(
            'beforepropertychange',
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

    onRender : function(){
        Ext.ux.guid.grid.PropertyGrid.superclass.onRender.apply(this, arguments);
        this.getGridEl().addClass('x-props-grid');
    },

    afterRender: function(){
        Ext.ux.guid.grid.PropertyGrid.superclass.afterRender.apply(this, arguments);
        if(this.source){
            this.setSource(this.source);
        }
    },

    setSource : function(source){
        this.propStore.setSource(source);
    },

    getSource : function(){
        return this.propStore.getSource();
    }
});

//Is not registered but required by designer
Ext.reg('guidpropertygrid', Ext.ux.guid.grid.PropertyGrid);
