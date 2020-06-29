const mysql=require('mysql');
const connection=mysql.createConnection({
host:'localhost',
user:'root',
password:'',
database:'school',
});
connection.connect((err)=>{
	if(!err)
	{
		console.log("Database connected!");
	}
	else{
		console.log("Error while connecting" +err)
	}
});
module.exports=connection;