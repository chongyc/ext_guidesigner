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
 * Check if ExtJS version is between from and to version
 * @param {String} fromVersion The version which is at least required
 * @param {String} toVersion The version which is used as end (default ExtJS version)
 * @return {Boolean} True when ExtJS version is between from and to version
 */
Ext.isVersion = function(fromVersion,toVersion) {
  if (fromVersion instanceof Array) {
    toVersion = formVersion[1];
    fromVersion = formVersion[0];
  }
  var getVersion = function(ver) {
    var major = ver.match(/^(\d)\.\d/);
    major = major ? major[1] : 0;
    var minor = ver.match(/^\d\.(\d)/);
    minor = minor ? minor[1] : 0;
    var revision = ver.match(/^\d\.\d\.(\d)/);
    revision = revision ? revision[1] : 0;
    return (major*1) + (minor*0.1) + (revision*0.001);
  }
  var f = getVersion(fromVersion || Ext.version);
  var t = getVersion(toVersion || Ext.version);
  var e = getVersion(Ext.version);
  return (e>=f && e<=t);
}

/**
 * Override a class when the version matches according to isVersion
 * @param {Class} cl The class to override
 * @param {Object} obj The object containing the function to be overwritten
 * @param {String} fromVersion The version which is at least required
 * @param {String} toVersion The version which is used as end (default ExtJS version)
 */
Ext.overrideIf = function(cl,obj,fromVersion,toVersion) {
  if (Ext.isVersion(fromVersion,toVersion)) {
    return Ext.override(cl,obj);
  }
  return cl;
};

/**
 * Apply object to source when version matches
 * @param {Object} source The source object
 * @param {Object} obj The object to apply
 * @param {String} fromVersion The version which is at least required
 * @param {String} toVersion The version which is used as end (default ExtJS version)
 */
Ext.applyVersion = function(source,obj,fromVersion,toVersion) {
  if (Ext.isVersion(fromVersion,toVersion)) {
    return Ext.apply(source,obj);
  }
  return source;
};

/**
 * Apply object to source when version matches
 * @param {Object} source The source object
 * @param {Object} obj The object to apply
 * @param {String} fromVersion The version which is at least required
 * @param {String} toVersion The version which is used as end (default ExtJS version)
 */
Ext.applyIfVersion = function(source,obj,fromVersion,toVersion) {
  if (Ext.isVersion(fromVersion,toVersion)) {
    return Ext.applyIf(source,obj);
  }
  return source;
};

/**
 * Override Ext.Panel so that scope of keymap is always set to object when not set,
 * instead of window
 */
Ext.overrideIf(Ext.Panel,{
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
},'2.0');


/**
 * Override Ext.FormPanel so that in case whe create a form without items from a json
 * it still has a item list.
 */
Ext.overrideIf(Ext.FormPanel, {
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
},'2.0');


/**
 * Add setTooltip function to button
 */
Ext.overrideIf(Ext.Button, {
    setTooltip: function(qtipText) {
        var btnEl = this.getEl().child(this.buttonSelector)
        Ext.QuickTips.register({
            target: btnEl.id,
            text: qtipText
        });
    }
},'2.0');


/**
 * Add firefox3 flags to versions below 2.2
 */
Ext.applyIfVersion(Ext,{
   isGecko3 : !Ext.isSafari && navigator.userAgent.toLowerCase().indexOf("rv:1.9") > -1
},'2.0','2.2');


/**
 * Override the Ext.ComponentMgr so that whe can validate if a type is available
 */
Ext.ComponentMgr = function(extMgr){
    var types = {}; //List of all types

    function addTypes(condition,typeLine){
      if (!condition || !typeLine) return;
      for (var t=typeLine.split(','),i=0;i<t.length;i++) {types[t[i]]=t[i];}
    }

    addTypes(Ext.isVersion('2.0'),'box,button,colorpalette,component,container,cycle,' +
      'dataview,datepicker,editor,editorgrid,grid,paging,panel,progress,propertygrid,' +
      'splitbutton,tabpanel,treepanel,viewport,window,toolbar,tbbutton,tbfill,tbitem,' +
      'tbseparator,tbspacer,tbsplit,tbtext,form,checkbox,combo,datefield,field,fieldset,' +
      'hidden,htmleditor,label,numberfield,radio,textarea,textfield,timefield,trigger');

    addTypes(Ext.isVersion('2.1'),'slider,statusbar');

    return Ext.applyIf({
        registerType : function(xtype, cls){
            extMgr.registerType(xtype,cls);
            types[xtype] = xtype;
        },

        isTypeAvailable : function (xtype) {
          return !!types[xtype];
        },

        allTypes : function(){
          var arr = [];
          for (var key in types) {
            arr.push(key);
          }
          return arr;
        }

    },extMgr);
}(Ext.ComponentMgr);

// this will be called a lot internally, shorthand to keep the bytes down
Ext.reg = Ext.ComponentMgr.registerType;