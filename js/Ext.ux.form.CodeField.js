 /*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A script/code editor for grid
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

Ext.ux.form.CodeField = Ext.extend(Ext.form.TriggerField,  {
    /**
     * @cfg {String} invalidText
     * The error to display when the code in the field is invalid (defaults to
     * '{value} is not a valid code - it must be in the format {format}').
     */
    invalidText : "'{0}' is not a valid code",
    /**
     * @cfg {String} triggerClass
     * An additional CSS class used to style the trigger button.
     */
    triggerClass : 'x-form-codefield-trigger',
    /**
     * @cfg {String/Object} autoCreate
     * A DomHelper element spec, or true for a default element spec (defaults to
     * {tag: "input", type: "text", size: "10", autocomplete: "off"})
     */

    // private
    defaultAutoCreate : {tag: "textarea",rows : 1,style:"height:1.8em;",autocomplete: "off"},

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
     * Location of CodePress
     * @type {String}
     @cfg */
    codePressPath : undefined,

    /**
     * InitEvents and redirect dblclick to triggerclick
     */
    initEvents : function(){
        Ext.ux.form.CodeField.superclass.initEvents.call(this);
        this.el.on('dblclick', this.onTriggerClick, this);
    },

    /**
     * Returns the current value of the  field
     * @return {String} value The value
     */
    getValue : function(){
      return Ext.ux.form.CodeField.superclass.getValue.call(this) || this.defaultValue || " ";
    },

    /**
     * Sets the value of the field.
     * @param {String} code The code string
     */
    setValue : function(code){
      Ext.ux.form.CodeField.superclass.setValue.call(this, this.formatCode(code));
      this.setCode(code);
    },

    /**
     * Callback function when code is changed with setValue
     * @param {String} code The code used
     */
    setCode : function(code) {
    },

    /**
     * Format the code, by default code is rtrimed
     * @param {String} code The code string
     * @returns {String} The formated code
     */
    formatCode : function(code) {
     return String(code).replace(/\s+$/,""); //rtrim code
    },

    // private
    parseCode : function(value){
      return true;
    },

    //Private force reload of value after textarea is renderd when we have default value
    initValue : function(){
      Ext.ux.form.CodeField.superclass.initValue.call(this);
      this.on('focus',function(){this.setValue(this.getValue())},this);
    },

    // private
    validateValue : function(value){
        if(!Ext.ux.form.CodeField.superclass.validateValue.call(this, value)){
            return false;
        }
        if(value.length < 1){ // if it's blank and textfield didn't flag it then it's valid
           this.setCode('');
           return true;
        }

        var parseOK = this.parseCode(value);

        if(!value || (parseOK == false)){
            this.markInvalid(String.format(this.invalidText,value));
            return false;
        }
        this.setCode(value);
        return true;
    },

    // private
    // Provides logic to override the default TriggerField.validateBlur which just returns true
    validateBlur : function(){
        return !this.editorWin || !this.editorWin.isVisible();
    },

    // private
    // Implements the default empty TriggerField.onTriggerClick function to display the CodeField editor
    onTriggerClick : function(){
        if(this.disabled){
            return;
        }
        if (!this.editorWin) {
          var tf = (this.codePress && Ext.ux.CodePress)
                 ?  new Ext.ux.CodePress({path: this.codePressPath, language: this.language ,autoResize:true,trim : true})
                 :  new Ext.form.TextArea({resize:Ext.emptyFn});
          this.editorWin = new Ext.Window({
              title  : "CodeField Editor",
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
                    if (this.editor.cancelEdit) this.editor.cancelEdit();
                  }}],
              buttons: [{
                 text    : "Close",
                 scope   : this,
                 handler : function() {
                   this.editorWin.hide();
                   if (this.editor.cancelEdit) this.editor.cancelEdit();
                 }
                },{
                 text    : "Apply",
                 scope   : this,
                 handler : function() {
                   this.setValue(tf.getValue());
                   this.editorWin.hide();
                   this.editorWin.el.unmask();
                   if (this.editor.completeEdit) this.editor.completeEdit();
                 }
               }]
            });
          this.editorWin.tf = tf;
          this.editorWin.doLayout();
          this.editorWin.on('resize',function () {tf.resize()});
          }
        this.editorWin.show();
        this.editorWin.tf.setValue(this.getValue());
    },

   onRender : function(ct, position){
      this.editor = Ext.getCmp(ct.id) || {};
      Ext.ux.form.CodeField.superclass.onRender.call(this, ct, position);
   }
});

Ext.reg('codefield',Ext.ux.form.CodeField);
