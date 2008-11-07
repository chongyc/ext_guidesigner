 /*global Ext document */
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * A FlashPanel capable of showing Maani Flash charts
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

Ext.ux.MaaniChart = Ext.extend(Ext.ux.FlashPanel,{
   
   maaniVersion : 4.5,
   maaniPath    : '3rdparty/maani/charts/',
   maaniSwf     : 'charts.swf',
   xmlSource    : '3rdparty/maani/example/sample.xml',
   nocache      : true,
   
   
  initComponent : function(){
    if (this.maaniVersion<5) {
      this.flashConfig = this.merge({
         swf : String.format('{0}{1}?library_path={0}charts_library',this.maaniPath,this.maaniSwf) +
               (this.xmlSource ? '&xml_source=' + (this.xmlSource + 
                (this.nocache ? '%3F_dc=' + (new Date().getTime()) : '')): '') 
               
       },this.flashConfig); 
    } else {
      this.flashConfig = this.merge({
       salign : 'TL',
       swf : String.format('{0}{1}',this.maaniPath,this.maaniSwf),
       flashvars : {
         library_path : String.format('{0}charts_library',this.maaniPath),
         xml_source   : this.xmlSource ?  this.xmlSource + (this.nocache ? '?_dc=' + (new Date().getTime()) : '') : ''
       }
      });
    }
    Ext.ux.MaaniChart.superclass.initComponent.call(this);
  }
});

Ext.reg('maanichart', Ext.ux.MaaniChart);
