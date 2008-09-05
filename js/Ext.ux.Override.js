/*global Ext document */
 /*  
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A set with overrides for ExtJs
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

/**
 * TODO: Make a function that checks current version of ExtJs 
 *       and checks if the override should be applied
 */

/**
 * Override Ext.Panel so that scope of keymap is always set to object when not set, 
 * instead of window 
 */
Ext.override(Ext.Panel,{
   // private
    getKeyMap : function(){
      if(!this.keyMap){
        if(Ext.isArray(this.keys)){          
          for(var i = 0, len = this.keys.length; i < len; i++){
            this.keys[i].scope = this.keys[i].scope || this;
          }
        } else if (this.keys && !this.keys.scope) this.keys.scope = this;
        this.keyMap = new Ext.KeyMap(this.el, this.keys);
      }
      return this.keyMap;
    }
});


/**
 * Override Ext.FormPanel so that in case whe create a form without items from a json
 * it still has a item list.
 */
Ext.override(Ext.FormPanel, {
    // private
    initFields : function(){
        //BEGIN FIX It can happend that there is a form created without items (json)
        this.initItems(); 
        //END FIX
        var f = this.form;
        var formPanel = this;
        var fn = function(c){
            if(c.doLayout && c != formPanel){
                Ext.applyIf(c, {
                    labelAlign: c.ownerCt.labelAlign,
                    labelWidth: c.ownerCt.labelWidth,
                    itemCls: c.ownerCt.itemCls
                });
                if(c.items){
                    c.items.each(fn);
                }
            }else if(c.isFormField){
                f.add(c);
            }
        }
        this.items.each(fn);
    }
});


//Ext.apply(Ext.ComponentMgr, {
//	
//	isTypeAvailable : function (xtype) {
//		
//		try {
//			return !!Ext.ComponentMgr.create( { xtype : xtype } ); //toBoolean
//		} catch (e) {
//			return false;
//		}
//	}
//	
//});


Ext.ComponentMgr = function(){
    var all = new Ext.util.MixedCollection();
    var types = {};

    return {
        register : function(c){
            all.add(c);
        },
        unregister : function(c){
            all.remove(c);
        },
        get : function(id){
            return all.get(id);
        },
        onAvailable : function(id, fn, scope){
            all.on("add", function(index, o){
                if(o.id == id){
                    fn.call(scope || o, o);
                    all.un("add", fn, scope);
                }
            });
        },
        all : all,
        registerType : function(xtype, cls){
            types[xtype] = cls;
            cls.xtype = xtype;
        },
        create : function(config, defaultType){
            return new types[config.xtype || defaultType](config);
        },
        
        isTypeAvailable : function (xtype) {
        	return !!types[xtype];
		}
    };
}();
Ext.reg = Ext.ComponentMgr.registerType; // this will be called a lot internally, shorthand to keep the bytes down

Ext.reg('box', Ext.BoxComponent);
Ext.reg('button', Ext.Button);
Ext.reg('colorpalette', Ext.ColorPalette);
Ext.reg('component', Ext.Component);
Ext.reg('container', Ext.Container);
Ext.reg('cycle', Ext.CycleButton);
Ext.reg('dataview', Ext.DataView);
Ext.reg('datepicker', Ext.DatePicker);
Ext.reg('editor', Ext.Editor);
Ext.reg('editorgrid', Ext.grid.EditorGridPanel);
Ext.reg('grid', Ext.grid.GridPanel);
Ext.reg('paging', Ext.PagingToolbar);
Ext.reg('panel', Ext.Panel);
Ext.reg('progress', Ext.ProgressBar);
Ext.reg('propertygrid', Ext.grid.PropertyGrid);

var minor_version = Ext.version.match(/^2\.(\d)/);
minor_version = minor_version[1];

if (minor_version >= 1) {
	Ext.reg('slider', Ext.Slider);
	Ext.reg('statusbar', Ext.StatusBar);
}

if (minor_version >= 2) {
//	Ext.reg('slider', Ext.Slider);
//	Ext.reg('statusbar', Ext.StatusBar);
}

Ext.reg('splitbutton', Ext.SplitButton);
Ext.reg('tabpanel', Ext.TabPanel);
Ext.reg('treepanel', Ext.tree.TreePanel);
Ext.reg('viewport', Ext.Viewport);
Ext.reg('window', Ext.Window);
Ext.reg('toolbar', Ext.Toolbar);
Ext.reg('tbbutton', Ext.Toolbar.Button);
Ext.reg('tbfill', Ext.Toolbar.Fill);
Ext.reg('tbitem', Ext.Toolbar.Item);
Ext.reg('tbseparator', Ext.Toolbar.Separator);
Ext.reg('tbspacer', Ext.Toolbar.Spacer);
Ext.reg('tbsplit', Ext.Toolbar.SplitButton);
Ext.reg('tbtext', Ext.Toolbar.TextItem);
Ext.reg('form', Ext.FormPanel);
Ext.reg('checkbox', Ext.form.Checkbox);
Ext.reg('combo', Ext.form.ComboBox);
Ext.reg('datefield', Ext.form.DateField);
Ext.reg('field', Ext.form.Field);
Ext.reg('fieldset', Ext.form.FieldSet);
Ext.reg('hidden', Ext.form.Hidden);
Ext.reg('htmleditor', Ext.form.HtmlEditor);
Ext.reg('label', Ext.form.Label);
Ext.reg('numberfield', Ext.form.NumberField);
Ext.reg('radio', Ext.form.Radio);
Ext.reg('textarea', Ext.form.TextArea);
Ext.reg('textfield', Ext.form.TextField);
Ext.reg('timefield', Ext.form.TimeField);
Ext.reg('trigger', Ext.form.TriggerField);