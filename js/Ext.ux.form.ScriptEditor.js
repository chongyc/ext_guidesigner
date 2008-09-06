 /*global Ext document */
 /*  
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A script editor for grid
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
Ext.namespace('Ext.ux.form');


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