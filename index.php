<?php
 /*
  * Author: Sierk Hoeksma. WebBlocks.eu
  * Copyright 2007-2008, WebBlocks.  All rights reserved.
  *
  * This extension adds Gui Designer  Support to ExtJs
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

   PHP5 json file reader,list and saver for GuiDesigner.
   This is a example implementation of how it could work.
   Basic idea is:
    filename on GET  is read
    filename on POST is write, DATA is content
    delete   on POST is delete file
    rename,to on POST is rename file
    node     on REQUEST  is read directory listing return json
  */

if ( !function_exists('json_decode') ){
    function json_decode($content, $assoc=false){
      require_once 'JSON.php';
      if ( $assoc ){
        $json = new Services_JSON(SERVICES_JSON_LOOSE_TYPE);
      } else {
          $json = new Services_JSON;
      }
      return $json->decode($content);
    }
}

if ( !function_exists('json_encode') ){
    function json_encode($content){
      require_once 'JSON.php';
      $json = new Services_JSON;
      return $json->encode($content);
    }
}

/*  Base diretory used for file handling */
$basedir = '.';
/*
Hide Files - If you wish to hide certain files or directories
then enter their details here. The values entered are matched
against the file/directory names. If any part of the name
matches what is entered below then it is now shown.
*/
$hide = array(
        'index.php',
        '.htaccess',
        '.htpasswd',
        '.svn'
      );

/*
Show Directories - Do you want to make subdirectories available?
If not set this to false
*/
$showdirs = true;

if (isset($_GET['filename'])) {
   if(substr($_GET['filename'], 0, 1)!='/') {$_GET['filename'] = '/' . $_GET['filename'];}
   include($basedir . '/' . $_GET['filename']);
} else if (isset($_POST['filename'])) {
    $data = stripslashes((isset($_POST['data'])) ? $_POST['data'] :  null) ;
//Old    $data = (isset($_POST['data'])) ? $_POST['data'] :  null ;
    if(substr($_POST['filename'], 0, 1)!='/') {$_POST['filename'] = '/' . $_POST['filename'];}
    if (isset($data) && strlen($data)==0) $data = '{}';
    $handle = fopen($basedir . '/' . $_POST['filename'], "wb");
    $numbytes = fwrite($handle, $data);
    fclose($handle);
    echo "File saved";
} else if (isset($_POST['rename']) && isset($_POST['to']) ) {
  rename($basedir . '/' . $_POST['rename'],$basedir . '/' . $_POST['to']);
  echo "File renamed";
} else if (isset($_POST['delete'])) {
  unlink ($basedir . '/' . $_POST['delete']);
  echo "File deleted";
} else if (isset($_POST['new'])) {
  if (strpos($_POST['new'], 'ynode-')!==false) $_POST['new'] = '/';
  $nodes = array();
  $name = 'noname';
  $handle = fopen($basedir . '/' . $_POST['new'] . $name . '.json', "wb");
  $numbytes = fwrite($handle, '{}');
  fclose($handle);
  $nodes[] = array('text'=>$name, 'id'=>$_POST['new'] . $name.'.json', 'leaf'=>true/*, 'qtip'=>$qtip, 'qtipTitle'=>$f */, 'cls'=>'file');
  echo json_encode($nodes);
} else if (isset($_REQUEST['node'])) {
  //Remove move first node
  if (strpos($_REQUEST['node'], 'ynode-')!==false) $_REQUEST['node'] = '';
  //End directory with /
  if(substr($_REQUEST['node'], -1, 1)!='/' && strlen($_REQUEST['node'])!=0) {$_REQUEST['node'] = $_REQUEST['node'] . '/';}
  $dirok = true;
  $dirnames = split('/', $_REQUEST['node']);
  for($di=0; $di<sizeof($dirnames); $di++) {
    if($di<(sizeof($dirnames)-2)) {$dotdotdir = $dotdotdir . $dirnames[$di] . '/';}
    if($dirnames[$di] == '..') {$dirok = false;}
  }
  if(substr($_REQUEST['node'], 0, 1)=='/') {$dirok = false;}
  // Check for secure directory
  if($dirok) {
     $dirs = array();
     $files = array();
     $leadon = $basedir . '/' . $_REQUEST['node'];
     $opendir = $leadon;
     if(!$leadon) $opendir = '.';
     if(!file_exists($leadon)) {$opendir = '.';$leadon = $basedir . '/';$_REQUEST['node']='';}
     clearstatcache();
     if ($handle = opendir($opendir)) {
       while (false !== ($file = readdir($handle))) {
         //first see if this file is required in the listing
         if ($file == "." || $file == "..")  continue;
         $discard = false;
         for($hi=0;$hi<sizeof($hide);$hi++) {
           if(strpos($file, $hide[$hi])!==false) {$discard = true;}
         }
         if($discard) continue;
         if (@filetype($leadon.$file) == "dir") {
          if($showdirs) $dirs[] = $file ;
         } else {
          if (isset($_REQUEST['filter']) && !eregi($_REQUEST['filter'],$file)) continue;
          $files[] = $file;
         }
      }
      closedir($handle);
      //Create JSON for Tree, First Directory then Files
      $nodes = array();
      $arsize = sizeof($dirs);
      for($i=0;$i<$arsize;$i++) {
        $nodes[] = array('text'=>$dirs[$i], 'id'=>$_REQUEST['node'] . $dirs[$i] .'/','leaf'=>false /*, 'qtip'=>$qtip*/, 'cls'=>'folder');
      }

      $arsize = sizeof($files);
      for($i=0;$i<$arsize;$i++) {
        if (isset($_REQUEST['filter']) && eregi($_REQUEST['filter'],$files[$i],$regs)) {
         $nodes[] = array('text'=>$regs[1], 'id'=>$_REQUEST['node'] . $files[$i], 'leaf'=>true/*, 'qtip'=>$qtip, 'qtipTitle'=>$f */, 'cls'=>'file');
        } else         {
         $nodes[] = array('text'=>$files[$i], 'id'=>$_REQUEST['node'] . $files[$i], 'leaf'=>true/*, 'qtip'=>$qtip, 'qtipTitle'=>$f */, 'cls'=>'file');
        }
      }
      echo json_encode($nodes);
    }
  } else {
   header("HTTP/1.0 404 Not Found");
  }
} else { //Show default page
 ?>
 <html>
 <head>
 <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
 <link rel="shortcut icon" href="icons/favicon.ico" >
 <title>ExtJs Gui Designer</title>
 <!-- The ExtJs base 2.02  -->
     <link rel="stylesheet" type="text/css" href="css/ext-all.css" />
     <script type="text/javascript" src="js/ext-base.js"></script>
     <script type="text/javascript" src="js/ext-all.js"></script>

 <!-- Whe load Gui Designer through used of JSON which includes all needed files  -->
     <script id="js/Ext.ux.JsonPanel.js" type="text/javascript" src="js/Ext.ux.JsonPanel.js"></script>

 </head>
 <body>
 <script>
   new Ext.Viewport({
     items : new Ext.ux.JsonPanel({autoLoad:'json/designer.json', disableCaching:true}),
     layout: 'fit'
   }).show();
 </script>
 </body>
</html>
 <?php
}
?>