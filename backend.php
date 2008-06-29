class phpFiles
{
var $baseDir;
var $hide;
var $file_list;

function __construct($basedir)
{
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

private function mkdir_recursive($pathname, $mode)
{
is_dir(dirname($pathname)) || $this->mkdir_recursive(dirname($pathname), $mode);
return is_dir($pathname) || @mkdir($pathname, $mode);
}

private function check_and_fix_dir($filename)
{
$folder=explode("/",$filename);
$path=$this->baseDir;

for($i=0;$i<sizeof($folder)-1;$i++)
{
$path.="/".$folder[$i];
}

$this->mkdir_recursive($path,0777); 
}

private function is_json_file($name)
{
if(substr($name,-4)=="json") return true;
else return false;
}

private function ReadDirs($dir)
{
if ($handle = opendir($dir)) 
{
while (false !== ($file = readdir($handle))) 
{
if (!in_array($file,$this->hide)) 
{ 
if(is_dir($dir.$file))
{
$dir_array[]=$dir.$file."/";
}
else
{
if($this->is_json_file($file))
$file_array[]=substr($dir.$file,strlen($this->baseDir));
}
}
}
closedir($handle);

//dir first
for($i=0;$i<sizeof($dir_array);$i++) $this->ReadDirs($dir_array[$i]);
//files second
for($i=0;$i<sizeof($file_array);$i++) $this->file_list[$file_array[$i]]=$file_array[$i];
}
}

function get_files()
{
$this->ReadDirs($this->baseDir);
echo json_encode($this->file_list);
}

function get_content($filename)
{
if($this->is_json_file($filename))
echo file_get_contents($this->baseDir.$filename);
}

function save_changes($filename,$action,$content)
{
if(!$this->is_json_file($filename))
{
die('0'); 
}

if($action=='delete')
{
$full_name=$this->baseDir.$filename;
if(file_exists($full_name))
{
unlink($full_name);
die('1');
}
}

if($action=='save')
{
$this->check_and_fix_dir($filename);
if(($fp=fopen($this->baseDir.$filename,"w")) === FALSE){
die('0');
}
fwrite($fp,$content);
fclose($fp);
die('1');
} 
}
}

$PhpBackend=new phpFiles($_POST['baseDir']);

if($_POST['cmd']=="get_files") json_encode($PhpBackend->get_files());
if($_POST['cmd']=="get_content") $PhpBackend->get_content($_POST['filename']);
if($_POST['cmd']=="save_changes") $PhpBackend->save_changes($_POST['filename'],$_POST['action'],$_POST['content']); 

