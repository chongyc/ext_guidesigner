<?php
/*
 * Author: Sierk Hoeksma. WebBlocks.eu
 * Copyright 2007-2008, WebBlocks.  All rights reserved.
 *
 * This extension adds Gui Designer File Support to ExtJs
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
 * Special thanks for Epsylon for intial code of this php class
 */
//Load json encode and decode if required
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

class phpFiles {
  var $baseDir;
  var $hide;
  var $file_list;

  function __construct($basedir) {
    $this->hide = array(
      'index.php',
      '.htaccess',
      '.htpasswd',
      '.svn',
      '.',
      '..'
      );
    $this->baseDir=$basedir;
  }

  private function mkdir_recursive($pathname, $mode){
    is_dir(dirname($pathname)) || $this->mkdir_recursive(dirname($pathname), $mode);
    return is_dir($pathname) || @mkdir($pathname, $mode);
  }
  
  function get_absolute_path($path) {
    $path = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $path);
    $parts = array_filter(explode(DIRECTORY_SEPARATOR, $path), 'strlen');
    $absolutes = array();
    foreach ($parts as $part) {
      if ('.' == $part) continue;
      if ('..' == $part) {
          array_pop($absolutes);
      } else {
          $absolutes[] = $part;
      }
    }
    return implode(DIRECTORY_SEPARATOR, $absolutes);
  }
      
  private function above_dir($dir, $dir_top) {
    $dir="virtual_main/".$dir;
    $dir_top="virtual_main/".$dir_top;
    $dir = $this->get_absolute_path($dir);
    $dir_top = $this->get_absolute_path($dir_top);
    if (substr($dir,0,strlen($dir_top))!==$dir_top) {
      return false;
    }
    
    $dir = count(explode(DIRECTORY_SEPARATOR, $dir));
    $dir_top = count(explode(DIRECTORY_SEPARATOR, $dir_top));
    
    if($dir >= $dir_top) {
      return true;
    }else{
      return false;
    }
  }
    
  private function check_and_fix_dir($filename) {
    $folder=explode("/",$filename);
    $path=$this->baseDir;
    for($i=0;$i<sizeof($folder)-1;$i++) {
      $path.="/".$folder[$i];
    }
    $this->mkdir_recursive($path,0777);
  }

  private function is_json_file($name) {
    if(substr($name,-4)=="json") return true;
    else return false;
  }

  private function ReadDirs($dir) {
    if ($handle = opendir($dir)) {
      while (false !== ($file = readdir($handle))) {
        if (!in_array($file,$this->hide)) {
          if(is_dir($dir.$file)) {
            $dir_array[]=$dir.$file."/";
          } else {
            if($this->is_json_file($file))
              $file_array[]=substr($dir.$file,strlen($this->baseDir));
          }
        }
      }
      closedir($handle);
      //dir first
      if(isset($dir_array)) sort($dir_array);
      for($i=0;$i<sizeof($dir_array);$i++) $this->ReadDirs($dir_array[$i]);
      //files second
      if(isset($file_array)) sort($file_array);
      for($i=0;$i<sizeof($file_array);$i++) $this->file_list[$file_array[$i]]=$file_array[$i];
    }
  }

  function get_files() {
    clearstatcache();
    $this->ReadDirs($this->baseDir);
    echo json_encode($this->file_list);
  }

  function get_content($filename) {
    if($this->above_dir($this->baseDir."/".$filename,$this->baseDir."/")) {
      if($this->is_json_file($filename)) {
          echo file_get_contents($this->baseDir."/".$filename);
          return;
      }
    }
    die('0');
  }

  function save_changes($filename,$action,$content) {
    if(!$this->above_dir($this->baseDir."/".$filename,$this->baseDir."/")) {
      die('0');
    }
    
    if(!$this->is_json_file($filename)) {
      die('0');
    }

    if($action=='remove'){
      $full_name=$this->baseDir."/".$filename;
      if(file_exists($full_name)) {
        unlink($full_name);
        die('1');
      }
    }

    if($action=='save' || $action=='new') {
      $this->check_and_fix_dir($filename);
      if(($fp=fopen($this->baseDir."/".$filename,"w")) === FALSE){
        die('0');
      }
      fwrite($fp,$content);
      fclose($fp);
      die('1');
    }
    die('0'); 
  }
}
   
$PhpBackend=new phpFiles($_POST['baseDir']."/");
if($_POST['cmd']=="get_files") json_encode($PhpBackend->get_files());
if($_POST['cmd']=="get_content") $PhpBackend->get_content($_POST['filename']);
if($_POST['cmd']=="save_changes") $PhpBackend->save_changes($_POST['filename'],$_POST['action'],$_POST['content']);

/*
$PhpBackend=new phpFiles($_GET['baseDir']);
if($_GET['cmd']=="test") echo "tester";
if($_GET['cmd']=="get_files") json_encode($PhpBackend->get_files());
if($_GET['cmd']=="get_content") $PhpBackend->get_content($_GET['filename']);
if($_GET['cmd']=="save_changes") $PhpBackend->save_changes($_GET['filename'],$_GET['action'],$_GET['content']);
*/
?>