/*global Ext document */
/*  
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This extension enables to use a Table Layout in from with field prefix
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

Ext.namespace('Ext.ux.layout');
Ext.ux.layout.FormTableLayout = Ext.extend(Ext.layout.TableLayout, {

    labelSeparator : false,
    columns        : 2,

    // private
    getAnchorViewSize : function(ct, target){
        return ct.body.getStyleSize();
    },
  
 // private
   setContainer : function(ct){
       Ext.ux.layout.FormTableLayout.superclass.setContainer.call(this, ct);
       if(ct.labelAlign){
           ct.addClass('x-form-label-'+ct.labelAlign);
       }

       if(ct.hideLabels){
           this.labelStyle = "display:none";
           this.elementStyle = "padding-left:0;";
           this.labelAdjust = 0;
       }else{
           this.labelSeparator = ct.labelSeparator || this.labelSeparator;
           ct.labelWidth = ct.labelWidth || 100;
           if(typeof ct.labelWidth == 'number'){
               var pad = (typeof ct.labelPad == 'number' ? ct.labelPad : 5);
               this.labelAdjust = ct.labelWidth+pad;
               this.labelStyle = "width:"+ct.labelWidth+"px;";
               this.elementStyle = "padding-left:"+(ct.labelWidth+pad)+'px';
           }
           if(ct.labelAlign == 'top'){
               this.labelStyle = "width:auto;";
               this.labelAdjust = 0;
               this.elementStyle = "padding-left:0;";
           }
       }

       if(!this.fieldTpl){
           // the default field template used by all form layouts
           var t = new Ext.Template(
               '<div class="x-form-item {5}" tabIndex="-1">',
                   '<label for="{0}" style="{2}" class="x-form-item-label">{1}{4}</label>',
                   '<div class="x-form-element" id="x-form-el-{0}" style="{3}">',
                   '</div><div class="{6}"></div>',
               '</div>'
           );
           t.disableFormats = true;
           t.compile();
           Ext.ux.layout.FormTableLayout.prototype.fieldTpl = t;
       }
   },

    renderItem : function(c, position, target){
      if(c && !c.rendered && c.fullspan!==true && c.inputType != 'hidden'){
          var args = [
                 c.id, c.fieldLabel,
                 c.labelStyle||this.labelStyle||'',
                 this.elementStyle||'',
                 c.fieldLabel ? (typeof c.labelSeparator == 'undefined' ? this.labelSeparator : c.labelSeparator) : '',
                 (c.itemCls||this.container.itemCls||'') + (c.hideLabel ? ' x-hide-label' : ''),
                 c.clearCls || 'x-form-clear-left' 
          ];
          this.fieldTpl.insertFirst(this.getNextCell(c),args);
          c.render('x-form-el-'+c.id);
      } else {
          Ext.ux.layout.FormTableLayout.superclass.renderItem.apply(this, arguments);
      }
    },
    
        // private
    adjustWidthAnchor : function(value, comp){
            return value - (comp.isFormField  ? (comp.hideLabel ? 0 : this.labelAdjust) : 0);
    },
});

Ext.Container.LAYOUTS['formtable'] = Ext.ux.layout.FormTableLayout;