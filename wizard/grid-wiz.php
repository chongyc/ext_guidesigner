<?php

	function host_check()
	{
		$conn = @mysql_connect($_POST['Host'],$_POST['User'],$_POST['Pass']);
		if (!$conn) 
		{
			$wynik['success']=false;
			$wynik['errors']['Host']='Error: ' . mysql_error();
			echo json_encode($wynik);
		}
		else
		{
			$wynik['success']=true;
			echo json_encode($wynik);
		}
	}
	
	function get_column()
	{
		$conn = @mysql_connect($_POST['Host'],$_POST['User'],$_POST['Pass']);
		mysql_select_db($_POST['database']);
		$query=mysql_query($_POST['Query']);
		
		$t=mysql_error();
	
		if($t!="") 
		{
			$wynik['success']=false;
		}
		else
		{
			for($i=0;$i<mysql_num_fields($query);$i++)
			{
				$meta = mysql_fetch_field($query);
				$wynik['results'][$i]['name']=$meta->name;
			}
			$wynik['success']=true;
		}
		echo json_encode($wynik);		
	}
	
	function get_db_list()
	{
		$conn = @mysql_connect($_POST['Host'],$_POST['User'],$_POST['Pass']);
		$query=mysql_query("show databases;");
	
		for($i=0;$i<mysql_num_rows($query);$i++)
		{
			$temp=mysql_fetch_assoc($query);
			$wynik['results'][$i]['name']=$temp['Database'];
		}
		echo json_encode($wynik);
	}

	function generate()
	{
		$conn = @mysql_connect($_POST['Host'],$_POST['User'],$_POST['Pass']);
		mysql_select_db($_POST['database']);
		$query=mysql_query($_POST['Query']);
	
		$t=mysql_error();
	
		if($t!="") 
		{
			$wynik['success']=false;
		}
		else
		{
			/*
			Column Model
			*/
			$wynik['CM']=
	"new Ext.grid.ColumnModel(
		[new Ext.grid.RowNumberer(),";
			for($i=0;$i<mysql_num_fields($query);$i++)
			{
				$meta = mysql_fetch_field($query);
				$wynik['CM'].="
				{
					header: '".$meta->name."',sortable: true, dataIndex: '".$meta->name."'
				}";
				if($i!=mysql_num_fields($query)-1) $wynik['CM'].=",";
			}
	$wynik['CM'].="
		])";
	
			/*
			Data Store
			*/
			$query=mysql_query($_POST['Query']);
	
			$wynik['DS']="new Ext.data.Store({
		        proxy: new Ext.data.HttpProxy({
		            url: 'index.php?cmd=***TUTAJ_WPISZ_CMD***',
		            method: 'POST'
		        }),
				autoLoad: true,
		        reader:new Ext.data.JsonReader({
		            root: 'results',
					totalProperty: 'total',
		            id: '***TUTAJ_WPISZ_ID***'
		        }, [";
				
			for($i=0;$i<mysql_num_fields($query);$i++)
			{
				$meta = mysql_fetch_field($query);
				$wynik['DS'].="
				{name: '".$meta->name."'}";
				if($i!=mysql_num_fields($query)-1) $wynik['DS'].=",";
			}
	
			$wynik['DS'].="])
		    })";
	
			/*
			FILTRY
			*/
	
			$query=mysql_query($_POST['Query']);
			$wynik['FILTR']="new Ext.ux.grid.GridFilters({
	                    local: false,
	                    filters: [";
	
			for($i=0;$i<mysql_num_fields($query);$i++)
			{
				$meta = mysql_fetch_field($query);
	
				if(strtoupper($meta->type)=="DATE" || strtoupper($meta->type)=="DATETIME" || strtoupper($meta->type)=="TIMESTAMP")  $typ="date";
				elseif($meta->numeric) $typ="numeric";
				else $typ="string";
	
				$wynik['FILTR'].="
				{dataIndex: '".$meta->name."', type: '".$typ."'}";
				if($i!=mysql_num_fields($query)-1) $wynik['FILTR'].=",";
			}
	
	
	          $wynik['FILTR'].="});";
	
			$wynik['success']=true;
		}
	
		echo json_encode($wynik);
	}

	if(function_exists($_GET['cmd'])==1)
	{
		$_GET['cmd'](); 
		die();
	}
?>