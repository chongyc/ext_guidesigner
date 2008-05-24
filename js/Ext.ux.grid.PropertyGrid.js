Ext.namespace('Ext.ux.grid');
Ext.namespace('Ext.ux.form');
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
    
    setList : function(list){
      data = [];
      if (list) {
        for (var i=0;i<list.length;i++) {data.push([list[i],list[i]])};
      }
      this.store.loadData(data,false);
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


Ext.ux.grid.PropertyStore = Ext.extend(Ext.grid.PropertyStore, {
    jsonId : "__JSON__",

    getPropertyType : function (name) {
      if (this.grid && this.grid.getPropertyType) return this.grid.getPropertyType(name);
      return null;
    },


    // protected - should only be called by the grid.  Use grid.setSource instead.
    setSource : function(o){
        this.source = o;
        this.store.removeAll();
        var data = [];
        for(var k in o){
            if(k.indexOf(this.jsonId)!=0 && ['items'].indexOf(k)==-1){
                if (typeof(o[k]) == 'function') {
                  data.push(new Ext.grid.PropertyRecord({name: k, value: o[this.jsonId + k] || String(o[k]) , type : 'function'}, k));
                } else if (typeof(o[k]) == 'object') {
                  data.push(new Ext.grid.PropertyRecord({name: k, value: o[this.jsonId + k] || String(Ext.ux.JSON.encode(o[k])), type : 'object'}, k));
                } 
                  data.push(new Ext.grid.PropertyRecord({name: k, value: o[this.jsonId + k] || o[k], type : o[this.jsonId + k] ? 'function' : '' }, k));
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
    
    updateSource : function (prop,value,type) {
      var propType = this.getPropertyType(prop);
      if (!type && propType) type=propType.type;
      if (typeof(this.source[this.jsonId + prop])!='undefined' || ['object','function'].indexOf(type)!=-1) {
         this.source[this.jsonId + prop] = value;
         try {
           var o = eval("( { data :" + value + "})");
           this.source[prop] = o.data;
         } catch (e) {Ext.Msg.alert('Exception','Could not set ' + prop + ' to ' + value + '/n' + e);}
      } else {
        this.source[prop] = value;
      }
      return this.source[prop];
    },

    setValue : function(prop, value){
        this.updateSource(prop,value);
        this.store.getById(prop).set('value', value);
    }
    
});


Ext.ux.grid.PropertyColumnModel = function(grid, store){
    Ext.ux.grid.PropertyColumnModel.superclass.constructor.call(this,grid,store);
    this.jsonId=grid.jsonId;
    Ext.apply(this.editors,{
        'regexp' : new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'new RegExp()'})),
        'function':new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'function(){}'})),
        'object':new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'{}'})),
        'object/array':new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'[{}]'})),
        'array': new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'[]'})),
        'template': new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:''})),
        'mixed': new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:''})),
        'html' : new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'',language:'html'})),
        'css' : new Ext.grid.GridEditor(new Ext.ux.form.ScriptEditor({defaultValue:'',language:'css'})),
        'editlist' :new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[],editable:true,customProperties:true})),
        'list':new Ext.grid.GridEditor(new Ext.ux.form.SimpleCombo({forceSelection:false,data:[],editable:true,customProperties:true}))      
    });
    this.valueRendererDelegate = this.valueRenderer.createDelegate(this);
    this.propertyRendererDelegate = this.propertyRenderer.createDelegate(this);
};

Ext.extend(Ext.ux.grid.PropertyColumnModel,Ext.grid.PropertyColumnModel, {
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
        if (!t && prop) {
          t=prop.type;
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
        }else{
            return this.defaultEditor || this.editors['string'];
        }
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

    
Ext.ux.grid.PropertyGrid = Ext.extend(Ext.grid.EditorGridPanel, {
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
        var store = new Ext.ux.grid.PropertyStore(this);
        store.jsonId=this.jsonId,
        this.propStore = store;
        var cm = new Ext.ux.grid.PropertyColumnModel(this, store);
        store.store.sort('name', 'ASC');
        this.addEvents(
            'beforepropertychange',
            'propertychange'
        );
        this.cm = cm;
        this.ds = store.store;
        Ext.ux.grid.PropertyGrid.superclass.initComponent.call(this);

        this.selModel.on('beforecellselect', function(sm, rowIndex, colIndex){
            if(colIndex === 0){
                this.startEditing.defer(200, this, [rowIndex, 1]);
                return false;
            }
        }, this);
    },

    onRender : function(){
        Ext.ux.grid.PropertyGrid.superclass.onRender.apply(this, arguments);
        this.getGridEl().addClass('x-props-grid');
    },

    afterRender: function(){
        Ext.ux.grid.PropertyGrid.superclass.afterRender.apply(this, arguments);
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
Ext.reg('uxpropertygrid', Ext.ux.grid.PropertyGrid);