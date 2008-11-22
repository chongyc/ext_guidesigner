<?php

//Template used for jsoncontent
$jsoncontent='../../json/basic/%s.json';
    
/**
  * regexp: callback for sqlite REGEXP operator
  */
function regexp($search, $value) {
  // case insensitive hard coded
  return @preg_match("/$search/i", $value);
}

/**
  * concat_ws: sqlite custom function
  */
function concat_ws() {
  $args = func_get_args();
  $sep = array_shift($args);
  return implode($sep, $args);
} 
/**
  * Quote array callback function
  * This is walk array callback function that 
  * surrounds array element with quotes.
  */
function quote_array(&$val, $key, $quot = '"') {
  $quot_right = array_key_exists(1, (array) $quot) ? $quot[1] : $quot[0];
  $val = is_null($val) ? "null" : $quot[0] . preg_replace("/'/", "''", $val) . $quot_right;
}
 
class WebApp {

  /**
    * __construct: Constructs the csql instance
    */
  public function __construct($engine = "sqlite", $file = "webapp.sqlite") {
    $this->odb = $this->getOdb($engine, $file);
  } 
  
  /**
    * getOdb: Creates PDO object
    */
  protected function getOdb($engine, $file) {
    switch($engine) {
      case "sqlite":
        if("/" !== $file[0]) {
          $file = realpath(".") . "/$file";
        }
        $odb = new PDO("sqlite:$file");
        $odb->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $odb->sqliteCreateFunction("regexp", "regexp", 2);
        $odb->sqliteCreateFunction("concat_ws", "concat_ws");
      break;
    }
    return $odb;
  } 

  /**
    * getWhere: return where clause
    */
  protected function getWhere($params) {
    extract($params);
    $where = isset($where) ? "where $where" : "";
    if($query && is_array($search) && sizeof($search)) {
      $a = array();
      foreach($search as $f) {
        $a[] = "$f regexp '$query'";
      }
      $where .= $where ? " and(" : "where (";
      $where .= implode(" or ", $a) . ")";
    }
    return $where;
  }
  
  /**
    * getCount: Returns count of records in a table
    */
  public function getCount($params) {
    $count = null;
    $ostmt = $this->odb->prepare("select count(*) from {$params['table']} " . $this->getWhere($params));
    $ostmt->bindColumn(1, $count);
    $ostmt->execute();
    $ostmt->fetch();
    return (int) $count;
  } 
  
  /**
    * getData: Retrieves data and returns array of objects
    *
    * @param     array $params Associative array with:
    * - string  table (Mandatory)
    * - array   field (Mandatory)
    * - integer start (Optional)
    * - integer limit (Optional)
    * - string  sort (Optional)
    * - array   search (Optional) fields to search in
    * - string  where (Optional)
    */
  public function getData($params) {
    extract($params);
    $sql  = "select ";
    $sql .= implode(",", $fields);
    $sql .= " from $table " . $this->getWhere($params);
    $sql .= isset($groupBy) && $groupBy ? " group by $groupBy" : "";
    if(!is_null($sort)) {
      $sql .= " order by $sort";
      $sql .= is_null($dir) ? "" : " $dir";
    }
    if(!is_null($start) && !is_null($limit)) {
      $sql .= " limit $start,$limit";
    }
    $ostmt = $this->odb->query($sql);
    return $ostmt->fetchAll(PDO::FETCH_OBJ);
  } 
  
  /**
    * insertRecord: inserts record to table
    * @param     array $params
    */
  public function insertRecord($params) {
    extract($params);
    $o = new stdClass();
    $o->success = false;
    $a = "object" === gettype($data) ? get_object_vars($data) : $data;
    unset($a["newRecord"]);
    if($idName) {
      unset($a[$idName]);
    }
    $fields = array_keys($a);
    $values = array_values($a);
    array_walk($values, "quote_array", "'");
    $sql = "insert into $table (" . implode(",", $fields) . ") values (" . implode(",", $values) . ")";
    try {
      $this->odb->exec($sql);
      $o->success = true;
      $o->insertId = $this->odb->lastInsertId();
    }
    catch(PDOException $e) {
      $o->error = "$e";
    }
    return $o;
  } 

  /**
    * saveData: saves data (updates or inserts)
    * @return    object either {success:true} or {success:false,error:message}
    * @param     array $params
    */
  public function saveData($params) {
    extract($params);
    $o = new stdClass;
    $o->success = false;
    if(!$table || !is_array($data) || !$idName) {
      $o->error = "Table, data or idName is missing";
      return $o;
    }
    // record loop
    $p = array(
       "table"=>$table
      ,"idName"=>$idName
    );
    $this->odb->exec("begin transaction");
    foreach($data as $orec) {
      $p["data"] = $orec;
      // insert/update switch
      if(isset($orec->newRecord) && $orec->newRecord) {
        $result = $this->insertRecord($p);
      }
      else {
        $result = $this->updateRecord($p);
      }
      // handle error
      if(true !== $result->success) {
        $o->success = false;
        $o->error = $result->error;
        $this->odb->exec("rollback");
        return $o;
      }
      else {
        $o->success = true;
      }
      // handle insertId if any
      if(isset($result->insertId)) {
        $o->insertIds[] = $result->insertId;
      }
    } // eo record loop
        $this->odb->exec("commit");
    return $o;
  }
  
  /**
    * updateRecord: updtates one record in table
    * @return    object either {success:true} or {success:false,error:message}
    * @param     array $params with:
    * - string   table (Mandatory)
    * - string   idName (Mandatory) name of id field
    * - object   data (Mandatory) Name/value pairs object or associative array
    */
  public function updateRecord($params) {
    extract($params);
    $o = new stdClass();
    $o->success = false;
    if(!isset($table) || !isset($idName) || !isset($data)) {
      $o->error = "Table, idName or data not set.";
      return $o;
    }
    $asets = array();
    $where = "";
    foreach($data as $field => $value) {
      if($idName === $field) {
        $where = " where $field='$value'";
        continue;
      }
      array_push($asets, "$field=" . (is_null($value) ? "null" : "'$value'"));
    }
    if(!$where) {
      $o->error = "idName not found in data";
      return $o;
    }
    $sql = "update $table set " . implode(",", $asets) . $where;
    try {
      $this->odb->exec($sql);
      $o->success = true;
    }
    catch(PDOException $e) {
      $o->error = "$e";
    }
    return $o;
  } 

  /**
    * output: Encodes json object and sends it to client
    * @param     object/array $o
    * @param     string $contentType
    */
  public function output($o = null, $contentType = "application/json; charset=utf-8") {
    $o = $o ? $o : $this->o;
    $buff = json_encode($o);
    header("Content-Type: {$contentType}");
    header("Content-Size: " . strlen($buff));
    echo $buff;
    die();
  }


  /**
   * Logout by clearing session cookie
   */
  public function logout() {
    session_start();
    if (is_array($_SESSION['authdata'])) {
       unset($_SESSION['authdata']);
    }
    $this->output(array('controlerAuthentication'=>"logout"));
  }
  
  /**
   * Login a user by checking
   */
  public function login($user ='' ,$password = '') {
   $user = empty($user) ? $_REQUEST["username"] : $user; 
   $password = empty($password) ? $_REQUEST["password"] : $password; 
   $this->output(array('controlerAuthentication'=>
     ($this->authenticate($user,$password) ? "success" : "failed"))
   );
  }
  
  /**
   * Authenticate a user
   */
  public function authenticate($login = '',$passwd = '') {
    session_start(); //Start session if not started
    $check = ! empty( $login ); 
    if (is_array($_SESSION['authdata']) && isset($_SESSION['authdata']['login']) ) {
      return true;
    } 
    if ( $check && $result = $this->odb->query("SELECT groups FROM users WHERE username='$login' and password='$passwd'")) {
      $row = $result->fetch();
      $_SESSION['authdata'] = array("login"=>$login,"groups"=>$row['groups'],"actions"=>array());
      return true;
    } 
    if (is_array($_SESSION['authdata'])) {
      unset($_SESSION['authdata']['login']);
      $_SESSION['authdata']['actions']=array();
    } 
    return false;
  }

  /**
   * Simple check to see if a action is authorized 
   */
  public function authorized($action = '',$groups = '') {
    session_start();
    if ($groups=='') $groups=$_SESSION['authdata']['groups'];
    if (is_array($_SESSION['authdata']) && isset($_SESSION['authdata']['actions'][$action])) {
      return true;
    }
    if ($result = $this->odb->query("SELECT groups FROM rights WHERE right='$action'")) {
       while($row = $result->fetch()) {
         $p = $row['groups'];
         if ((preg_match("/$p;/i",$groups.";") ) ) {
           if (!is_array($_SESSION['authdata'])) {
             $_SESSION['authdata'] = array("actions"=>array("$action"=>1));
           } else {
             $_SESSION['authdata']["actions"][$action]=1;
           }
           return true;
         }
      }   
    } 
    return false;
  }

  /**
   * Check if there is a table
   */
  public function hasTable($table) {
    $statement = $this->odb->query("SELECT name FROM sqlite_master WHERE type = '$table'");
    $result = $statement->fetchAll();
    return sizeof($result) != 0;
  }
  
  /**
   * getDefintion of object, retruning fields if required
   */
  public function getDefinition($table,$fields = true) {
    $ostmt = $this->odb->query("select json from templates where name='$table'");
    $rows = $ostmt->fetchAll(PDO::FETCH_OBJ);
    if (count($rows)==1) {
      $params = json_decode($rows[0]['json']);
    } else {
      //Table is not in template table, now create it from table
      //PRAGMA Column 1 is name column 5 is Primary key
      $params = array('fields'=>array());
      $ostmt = $this->odb->query("PRAGMA table_info($table)");
      $cols = $ostmt->fetchAll (PDO::FETCH_BOTH);
      $num = count($cols);
      for ($i=0; $i<$num; $i++) {
        if ($cols[$i][5]==1) $params['idName']=$cols[$i][1];
        $params['fields'][]=$cols[$i][1];
      }
    }
    if (!isset($params['table'])) $params['table']=$table;
    if (!$fields) unset($params["fields"]);
    return $params;
   }  

} 


/**
 * Execute a action
 */
function doAction($webapp,$action = '',$id = '') {
  
  switch ($action) {
    case 'jsoncontent' :
      global $jsoncontent;
      $id = sprintf($jsoncontent,$id);
      header("Content-Type: application/json; charset=utf-8");
      if (file_exists($id)) { //Check if file exists
         include $id;
        die();
      }
      //File not found
      die("{controlerError : \"File not found $id\"}");
      break;
      
  case 'saveData' : //Save data to database
      $params = $webapp->getDefinition($_REQUEST["objName"],false);
      $params["data"] = json_decode($_REQUEST["data"]);
      $webapp->output($webapp->saveData($params));  
      break;
      
  case 'getData' : //Get data from database
    $params = $webapp->getDefinition($_REQUEST["objName"],true);
    $params["start"] = isset($_REQUEST["start"]) ? $_REQUEST["start"] : null;
    $params["limit"] = isset($_REQUEST["limit"]) ? $_REQUEST["limit"] : null;
    $params["search"] = isset($_REQUEST["fields"]) ? json_decode($_REQUEST["fields"]) : null;
    $params["query"] = isset($_REQUEST["query"]) ? $_REQUEST["query"] : null;
    $params["sort"] = isset($_REQUEST["sort"]) ? $_REQUEST["sort"] : null;
    $params["dir"] = isset($_REQUEST["dir"]) ? $_REQUEST["dir"] : null;
    $response = array(
       "success"=>true
      ,"totalCount"=>$webapp->getCount($params)
      ,"rows"=>$webapp->getData($params)
    );
    $webapp->output($response);
    break;
     
  default : //Perform action on class
      try {
        $webapp->$action($id);
      } catch (Exception $e) {}
  }
}

/**
 * Here start webapplication
 */
if(!isset($_REQUEST["action"])) {
  return;
}
$action = $_REQUEST["action"];
$id = isset($_REQUEST["id"]) ? $_REQUEST["id"] : null;

$webapp = new WebApp();
if ((isset($id) && $webapp->authorized("{$action}.{$id}","guest")) ||
                   $webapp->authorized("{$action}","guest")) { //Check if action can be done as guest
  
  doAction($webapp,$action,$id);  
} elseif (!$webapp->authenticate()) { //Check if there is an authentication header
  $webapp->output(array('controlerAuthentication'=>'required'));
} elseif ((isset($id) && $webapp->authorized("{$action}.{$id}")) || 
                         $webapp->authorized("{$action}")) { //Check if action can be done as guest
  doAction($webapp,$action,$id);
} 
$webapp->output(array(
   'controlerError' => "Unknown or unauthorized action {$action}.{$id}", 
   'info' => "action",
   'action' => "{$action}", 
   'id' => "{$id}"
));
?>