/*
 * Author: Sierk Hoeksma. WebBlocks.eu
 * Copyright 2007-2008, WebBlocks.  All rights reserved.
 *
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

Ext.namespace('Ext.ux');

/**
 * This class is used to parse a source file
 * @type class
 */
Ext.ux.SourceParser = function(config){
  Ext.apply(this, config);
  Ext.ux.CodeParser.superclass.constructor.call(this);
};

Ext.extend(Ext.ux.SourceParser, Ext.util.MixedCollection, {  
 /**
  * The source that is parsed
  * @type {String}
  */
  source : undefined,
 
 /**
  * The url that will be used to retrieve the source
  * @type {String}
  @cfg */
  url    : false,
  
 /**
  * The parameters that will be used during retrieving of source
  * @type {Object}
  @cfg */
  params : false,
  
  
 /**
  * An object desribing the rules on how to parse the code
  */
  rules  : {
    doublequote :       { start:'"',  end:'"', noslash:true},
    singlequote :       { start:"'",  end:"'", noslash:true},
    singlelinecomment:  { start:'//', end:['\n', '\r']},
    multilinecomment:   { start:'/*', end:'*/'},
    regexp:             { start:'/',  end:'/', match:/^\/[^\n\r]+\/$/, noslash:true}
  },
    
  /**
   * Parse the source using the rules supplied
   * @param {String} source The source to be parsed
   * @param {Object} rules The rules to be used during parsing
   */
  parse      : function(source,rules) {
    source |= this.source;
    rules  |= this.rules;
    
  },
  
  /**
   * Parse a source which is accessible through url. If url is loaded succesfull
   * the parse function is called, when not the failed event is fired.
   * @param {String} url The url to load source from
   * @param {Object} params The additional url parameters (optional)
   * @param {Object} rules The rules which should be used during parsing (optional)
   */
  parseUrl   : function(url,params,rules) {
    Ext.Ajax.request({
      url: url || this.url,
      method : 'GET',
      params : params || this.params,
      callback: function(options, success, response){
        if (success) {
         this.parse(response.responseText,rules);
        } else {
          if (this.fireEvent('failed',response))
             Ext.Msg.alert('Failure','Failed to load url :' + this.url);
        }     
      },
      scope: this
    });
  }
  
});
