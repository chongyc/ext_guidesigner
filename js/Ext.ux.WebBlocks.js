 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This extension used within multiple application of WebBlocks
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
  @class Ext.ux.IFrameComponent
  @extends Ext.BoxComponent
 
  A simple panel showing a IFrame
 
  @constructor
  @param {Object} config The config object
 */  
Ext.ux.IFrameComponent = Ext.extend(Ext.BoxComponent, {
    onRender : function(ct, position){
        this.el = ct.createChild({tag: 'iframe', id: 'iframe-'+ this.id, frameBorder: 0, src: this.url});
    }
});
Ext.reg('iframe', Ext.ux.IFrameComponent);


/** AutoTab to next field */
Ext.ux.AutoTab = function(config){
  Ext.apply(this, config);
  Ext.ux.AutoTab.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.AutoTab, Ext.util.Observable, {  
  tabLength : 0,
  maxSearchDepth  : 5,
  init: function(field) {
    this.field = field;
    
    this.field.on('render', function() {
      this.field.el.on('keyup', this.onKeyup, this);
    }, this);
  },
  
  onKeyup: function(e) {
    if(this.isComplete(this.field) && !e.isSpecialKey()) {
      this.nextField();
    }
  },
  
  isComplete: function(field) {
    return this.tabLength ? field.getRawValue().length == this.tabLength : false;
  },
  
  nextField: function() {    
    if (this.field.el.dom.form) {
      var els = this.field.el.dom.form.elements;
      for(var i = 0; i < els.length; i++) {
        if (els[i].tabIndex == this.field.el.dom.tabIndex + 1) 
          return els[i].focus();
      }
    } else this.searchNextField(this.field.ownerCt,1);
  },
  
  searchNextField: function(node,depth) {
    if (!node || depth>this.maxSearchDepth) return false;
   var nextTab =  this.field.el.dom.tabIndex + 1;
   var changed = false;
   var fn = function(c){
    if (changed) return;
    if(c.doLayout && c != formPanel){
      if(c.items) c.items.each(fn);
    }else if (c.tabIndex==nextTab) {
     changed = true;
     return c.focus();
    }
   }
   node.items.each(fn);
   if (!changed) this.searchNextField(node.ownerCt,depth+1);
  }  
});

/* Plugin to autoUpper a field value */
Ext.ux.AutoUpper = function(config){
  Ext.apply(this, config);
  Ext.ux.AutoUpper.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.AutoUpper, Ext.util.Observable, {  
  init: function(field) {
    this.field = field;   
    this.field.on('render', function() {
      this.field.el.on('keyup', this.onKey, this);
    }, this);
  },
  
  onKey: function(e) {
    if (!e.isSpecialKey()) {
     var value = this.field.getValue();
     if (value) {  
        value = value.toString().toUpperCase();                             
        this.field.suspendEvents();
        this.field.setValue( value);
        this.field.resumeEvents();
     }
    }
  }    
});
