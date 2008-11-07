 /*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A FlashPanel and FlashPlugin
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
 * A Plugin to show flash
 <code>{
   title: 'Performance',
   layout: 'fit',   
   height: 400,
   plugins: new Ext.ux.FlashPlugin({ 
    swf: 'flash/graph/FCF_MSLine.swf',
    flashvars: {
      dataUrl: 'accountPerformance.xml', 
      chartHeight: function(){ 
          return this.body.getSize().height -5;
      }, 
      chartWidth: function(){ 
       return this.body.getSize().width -5;
      }
   })
 }
 </code>
*/

/**
 * Constuctor for the FlashPlugin
 * @param {Object} config The configuration used to intialize the flash.
 */
Ext.ux.FlashPlugin = function(config,param){
  if (config && config.params) {
    param = Ext.applyIf(param || {},config.params) ;
    delete config.params;
  }
  Ext.apply(this, config);
  Ext.apply(this.templateParams,param || {});
  Ext.ux.FlashPlugin.superclass.constructor.call(this);
  this.initialize();
};

/**
 * A class containig basic functionality for loading javascript and stylesheets
 * and helper functions for url manipulation
 */
Ext.extend(Ext.ux.FlashPlugin, Ext.util.Observable,{

  requiredMajorVersion : 9,
  requiredMinorVersion : 0,
  requiredRevision : 45,
  
  quality : 'high',
  menu    : false,
  access  : 'domain',
  
  templateParams : {
    movie    : "{swf}",
    quality  : "{quality}",
    wmode    : "transparent",
    flashvars: "{computedflashvars}",
    name : "flash-{id}",
    menu : "{menu}",
    src  : "{swf}",
    play : "true",
    pluginspage:"http://www.macromedia.com/go/getflashplayer",
    flashvars:"{computedflashvars}",
    type:"application/x-shockwave-flash",
    width:"{swfWidth}",
    height:"{swfHeight}",
    wmode:"transparent",
    allowScriptAccess : "{access}",
  //  align    : "t",
  //  salign   : "TL",
    swliveconnect :"true",
    scale    : "showall"
 },
     
  
  /**
   * Called from within the constructor allowing to initialize the parser
   */
  initialize: function() {
      this.addEvents({
        /**
         * Fires when there is no flash available
         * @event error
         * @param {String} func The function throwing the error
         * @param {Object} error The error object created by parser
         * @return {Boolean} when true the error is supressed
         */
        'noflash' : true
      });
   },

  /**
   * Get the version of Flash
   */
  getVersion : function(){
    var version,axo,e;
    // NOTE : new ActiveXObject(strFoo) throws an exception if strFoo isn't in the registry
    try {
      // version will be set for 7.X or greater players
      axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
      version = axo.GetVariable("$version");
    } catch (e) {}
    if (!version) {
      try {
        // version will be set for 6.X players only
        axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");      
        // installed player is some revision of 6.0
        // GetVariable("$version") crashes for versions 6.0.22 through 6.0.29,
        // so we have to be careful.       
        // default to the first public version
        version = "WIN 6,0,21,0";
        // throws if AllowScripAccess does not exist (introduced in 6.0r47)   
        axo.AllowScriptAccess = "always";
        // safe to call for 6.0r47 or greater
        version = axo.GetVariable("$version");
      } catch (e) {}
    }
    if (!version) {
      try {
        // version will be set for 4.X or 5.X player
        axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
        version = axo.GetVariable("$version");
      } catch (e) {}
    }

    if (!version){
      try {
        // version will be set for 3.X player
        axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.3");
        version = "WIN 3,0,18,0";
      } catch (e) {}
    }

    if (!version){
      try {
        // version will be set for 2.X player
        axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
        version = "WIN 2,0,0,11";
      } catch (e) {
        version = -1;
      }
    }
    return version;
  },

  /**
   * JavaScript helper required to detect Flash Player PlugIn version information
   */
  getSwfVer : function (){
    // NS/Opera version >= 3 check for Flash plugin in plugin array
    var flashVer = -1;
    if (navigator.plugins != null && navigator.plugins.length > 0) {
      if (navigator.plugins["Shockwave Flash 2.0"] || navigator.plugins["Shockwave Flash"]) {
        var swVer2 = navigator.plugins["Shockwave Flash 2.0"] ? " 2.0" : "";
        var flashDescription = navigator.plugins["Shockwave Flash" + swVer2].description;
        var descArray = flashDescription.split(" ");
        var tempArrayMajor = descArray[2].split(".");     
        var versionMajor = tempArrayMajor[0];
        var versionMinor = tempArrayMajor[1];
        var versionRevision = descArray[3];
        if (versionRevision == "") {
          versionRevision = descArray[4];
        }
        if (versionRevision[0] == "d") {
          versionRevision = versionRevision.substring(1);
        } else if (versionRevision[0] == "r") {
          versionRevision = versionRevision.substring(1);
          if (versionRevision.indexOf("d") > 0) {
            versionRevision = versionRevision.substring(0, versionRevision.indexOf("d"));
          }
        }
        var flashVer = versionMajor + "." + versionMinor + "." + versionRevision;
      }
    }
    // MSN/WebTV 2.6 supports Flash 4
    else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.6") != -1) flashVer = 4;
    // WebTV 2.5 supports Flash 3
    else if (navigator.userAgent.toLowerCase().indexOf("webtv/2.5") != -1) flashVer = 3;
    // older WebTV supports Flash 2
    else if (navigator.userAgent.toLowerCase().indexOf("webtv") != -1) flashVer = 2;
    else if ( Ext.isIE && Ext.isWindows && !Ext.isOpera ) {
      flashVer = this.getVersion();
    } 
    return flashVer;
  },

  /**
   * When called with reqMajorVer, reqMinorVer, reqRevision returns true if that version or greater is available
   */
  isFlashVer : function (reqMajorVer, reqMinorVer, reqRevision) {
    versionStr = this.getSwfVer();
    if (versionStr == -1 ) {
      return false;
    } else if (versionStr != 0) {
    if(Ext.isIE && Ext.isWindows && !Ext.isOpera) {
      // Given "WIN 2,0,0,11"
      tempArray         = versionStr.split(" ");  // ["WIN", "2,0,0,11"]
      tempString        = tempArray[1];     // "2,0,0,11"
      versionArray      = tempString.split(",");  // ['2', '0', '0', '11']
    } else {
      versionArray      = versionStr.split(".");
    }
    var versionMajor      = versionArray[0];
    var versionMinor      = versionArray[1];
    var versionRevision   = versionArray[2];

          // is the major.revision >= requested major.revision AND the minor version >= requested minor
    if (versionMajor > parseFloat(reqMajorVer)) {
      return true;
    } else if (versionMajor == parseFloat(reqMajorVer)) {
      if (versionMinor > parseFloat(reqMinorVer))
        return true;
      else if (versionMinor == parseFloat(reqMinorVer)) {
        if (versionRevision >= parseFloat(reqRevision))
          return true;
      }
    }
    return false;
  }
  },

  AC_Generateobj : function(objAttrs, params, embedAttrs) { 
    var str = '';
    if (Ext.isIE && Ext.isWindows && !Ext.isOpera){
      str += '<object ';
      for (var i in objAttrs){
        str += i + '="' + objAttrs[i] + '" ';
      }
      str += '>';
      for (var i in params) {
        if (String(params[i]).length!=0) {
          str += '<param name="' + i + '" value="' + params[i] + '" /> ';
        }
      }
      str += '</object>';
    } else {
      str += '<embed ';
      for (var i in embedAttrs) {
        str += i + '="' + embedAttrs[i] + '" ';
      }
      str += '> </embed>';
    }
    return str;
  },

  AC_FL_RunContent : function(args){
    var ret = 
      this.AC_GetArgs(args, ".swf", "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"
     , "application/x-shockwave-flash");
    return this.AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
  },

  AC_SW_RunContent : function (args){
    var ret = 
     this.AC_GetArgs(args, ".dcr", "src", "clsid:166B1BCA-3F9C-11CF-8075-444553540000"
       , null);
    return this.AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
  },

  AC_GetArgs : function(args, ext, srcParamName, classid, mimeType){
    var ret = new Object();
    ret.embedAttrs = new Object();
    ret.params = new Object();
    ret.objAttrs = new Object();
    for (var i in args){
      var value = String(args[i]);
      var currArg = i.toLowerCase();    
      switch (currArg){ 
        case "classid":
          break;
        case "pluginspage":
          ret.embedAttrs[currArg] = value;
          break;
        case "src":
        case "movie": 
          ret.embedAttrs["src"] = value;
          ret.params[srcParamName] = value;
        break;
        case "onafterupdate":
        case "onbeforeupdate":
        case "onblur":
        case "oncellchange":
        case "onclick":
        case "ondblclick":
        case "ondrag":
        case "ondragend":
        case "ondragenter":
        case "ondragleave":
        case "ondragover":
        case "ondrop":
        case "onfinish":
        case "onfocus":
        case "onhelp":
        case "onmousedown":
        case "onmouseup":
        case "onmouseover":
        case "onmousemove":
        case "onmouseout":
        case "onkeypress":
        case "onkeydown":
        case "onkeyup":
        case "onload":
        case "onlosecapture":
        case "onpropertychange":
        case "onreadystatechange":
        case "onrowsdelete":
        case "onrowenter":
        case "onrowexit":
        case "onrowsinserted":
        case "onstart":
        case "onscroll":
        case "onbeforeeditfocus":
        case "onactivate":
        case "onbeforedeactivate":
        case "ondeactivate":
        case "type":
        case "codebase":
        case "id":
          ret.objAttrs[currArg] = value;
          break;
        case "width":
        case "height":
        case "align":
        case "vspace": 
        case "hspace":
        case "class":
        case "title":
        case "accesskey":
        case "name":
        case "tabindex":
          ret.embedAttrs[currArg] = ret.objAttrs[currArg] = value;
          break;
        default:
          ret.embedAttrs[currArg] = ret.params[currArg] = value;
      }
    }
    ret.objAttrs["classid"] = classid;
    if (mimeType) ret.embedAttrs["type"] = mimeType;
    return ret;
  },
  
  renderFlash : function(ct) {
    ct = ct || this.ct;
    if (!this.id) this.id=ct.id;
    if (this.flashvars && (typeof this.flashvars == 'object')) {
        var tempflashvars = Ext.apply({},  this.flashvars );
        for (var key in tempflashvars) {
            if (typeof tempflashvars[key] == 'function') {
                tempflashvars[key] = tempflashvars[key].call(this, true);
            } 
            if (String(tempflashvars[key]).length==0) delete tempflashvars[key];
        };
        this.computedflashvars = Ext.urlEncode(tempflashvars);
    }
    this.swfHeight = ct.body.getSize().height -2;
    this.swfWidth = ct.body.getSize().width -2;
    if (ct.body.first()) this.flashTemplate.overwrite(ct.body.first(),this);
    else this.flashTemplate.insertFirst(ct.body,this);
  },
 

  init : function(ct) {    
    ct.flash = this;
    this.ct = ct;
    if (!this.isFlashVer(this.requiredMajorVersion,this.requiredMinorVersion,this.requiredRevision)) {
      if (this.fireEvent('noflash')) {
        this.flashTemplate = new Ext.XTemplate(
            '<div style="vertical-align : middle;text-align: center;">',
            'This content requires the Adobe Flash Player ('+this.requiredMajorVersion+'.'+this.requiredMinorVersion+'.'+this.requiredRevision+').',
            '<u><a href=http://www.macromedia.com/go/getflash/>Get Flash</a></u>.',
            '</div>'
        );
      }
    } else {
      this.flashTemplate = new Ext.XTemplate(
          '<div>',
          this.AC_FL_RunContent(this.templateParams),
          '</div>'
      );
    }
    this.flashTemplate.compile();    
    this.load = function(config,param) {
      if (config && config.params) {
        param = Ext.applyIf(param || {},config.params);
        delete config.params;
      }
      Ext.apply(this, config);
      Ext.apply(this.templateParams,param || {});
      this.renderFlash(ct);
    };   
    ct.on('afterlayout',this.renderFlash, this);
  }
});


/**
 * Create a flash panel by extending a panel
 */
Ext.ux.FlashPanel = Ext.extend(Ext.Panel,{

   layout      : 'fit',
   flashConfig : undefined,

   defaultFlashConfig :{
    flashvars: {
         chartHeight: function(f){ 
          return this.ct.body.getSize().height -5;
         }, 
         chartWidth: function(){ 
          return this.ct.body.getSize().width -5;
         }
    }
   },
   
   merge : function (item1,item2) {
     if (item1 instanceof Array && item2 instanceof Array) {
       var arr = [];
       for (var i=0;i<item1.length;i++) arr.push(item1[i]);
       for (var i=0;i<item2.length;i++) arr.push(item2[i]);
       return arr;
     } else if (typeof(item1)==typeof(item2) && typeof(item1)=='object') {
       var obj = {};
       for (var i in item1) {obj[i] = this.merge(item1[i],item2[i]);}
       for (var i in item2) {if (!obj[i]) obj[i]=item2[i];}
       return obj;
     } else if (typeof(item1)==typeof(item2)) {
       return item2;
     } else if (item1==undefined) {
       return item2;
     } else if (item2==undefined) {
       return item1;
     } else {
       throw new SyntaxError('Object items cannot be joined because items mismatch');
     }
    },
   
   initComponent : function(){
      Ext.ux.FlashPanel.superclass.initComponent.call(this); 
      var cfg = this.merge({},this.flashConfig);
      cfg = this.merge(cfg,this.defaultFlashConfig);
      new Ext.ux.FlashPlugin(cfg).init(this);
   }
 
});

Ext.reg('flashpanel', Ext.ux.FlashPanel);