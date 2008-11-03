/*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A set of simple components use in more
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
 * A combo that can be filed by a single array. When customProperties is true
 * it will also return the rawValue when there is no value in the list
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
        Ext.ux.form.SimpleCombo.superclass.initComponent.call(this);
        if(!this.store && this.data){
            this.store = new Ext.data.SimpleStore({
                fields: ['value','name','cls'],
                data : this.data
            });
        }
        this.tpl = '<tpl for="."><div class="x-combo-list-item {cls}">{' + this.displayField + '}</div></tpl>';
    },

    /**
     * A fast loading function for element in combobox.
     * @param list {Array} a list of elements which are convert into name,value pairs for combobox.
     */
    setList : function(list){
      data = [];
      if (list && list instanceof Array) {
        for (var i=0;i<list.length;i++) {data.push([list[i],list[i],null])};
      }
      this.store.loadData(data,false);
    },

    /**
     * Override the getValue so that when customProperties is set
     * the rawValues is returned
     * @return {Object} Based the entered key the combobox value or when not found and customProperties is true the raw entered value
     */
    getValue : function (){
      var v = Ext.ux.form.SimpleCombo.superclass.getValue.call(this);
      if (typeof(v)=='undefined') v = '';
      var r = this.getRawValue() || '';
      if (!this.customProperties || typeof(v)!='string' ||
          (typeof(v)=='string' && v.toLowerCase().indexOf(r.toLowerCase())==0))
        return v;
      return r;
    }

});
Ext.reg('simplecombo', Ext.ux.form.SimpleCombo);


/**
 * A simple implementation of the IFrame loading a url as content.
 * @type component
 */
Ext.ux.IFrameComponent = Ext.extend(Ext.BoxComponent, {
    /**
     * The url to be shown in iframe
     * @type {String}
     @cfg */
    url : null,
    
    /**
     * @private Just render an iframe
     */
    onRender : function(ct, position){
        var url = this.url;
        url += (url.indexOf('?') != -1 ? '&' : '?') + '_dc=' + (new Date().getTime());
        this.el = ct.createChild({tag: 'iframe', id: 'iframe-'+ this.id, frameBorder: 0, src: url});
    }
});
Ext.reg('iframe', Ext.ux.IFrameComponent);