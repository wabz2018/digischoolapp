ACCOUNT_SID = 'ACa1308a0913638d16472f22089ee52a41'
AUTH_TOKEN = '0e2a77ed469fc17ffed3cffde2bac0a2'
SERVICE_SID = 'ISadb22c5c8bd65262c6914ec0b901b7d9'
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
 //email
 function sendBulkMessages(messageBody, numberList) {
    var numbers = [];
    for (i = 0; i < numberList.length; i++) {
        numbers.push(JSON.stringify({
            binding_type: 'sms',
            address: numberList[i]
        }))
    }

    const notificationOpts = {
        toBinding: numbers,
        body: messageBody,
    };

    client.notify
        .services(SERVICE_SID)
        .notifications.create(notificationOpts)
        .then(notification => console.log(notification.sid))
        .catch(error => console.log(error));
}
let connection = require('../config');
module.exports.addsms = (req, res) => {
  let group=  req.body.receivergroup;
  let sql='';
  if(group=='teachers')
  {
sql="select phone from staff where stafftype='Teacher'";
  }
  else if(group=='staff')
  {
    sql="select phone from staff where stafftype=!'Teacher'";
  }
  else if(group=='general')
  {
//do for more than one group 
  }
  else if(group=='parents')
  {
    sql="select phone from student";
  }
let datesent=new Date();
let message=req.body.message;
    let sms = {
        "sender":req.session.username,
        "receivergroup":group,
        "istatus": 'S',
        "datesent": datesent,
       "message":message
    }

    connection.query(sql, (err,result)=>{
 if(err) throw err;
 var receivers=[];
 for(var i=0; i<result.length; i++)
 {
     let phone=result[i].phone;
     receivers.push(phone);
 }
    connection.query('Insert into sms  SET ?', sms, (error, results, fields) => {
        if (error) throw error;
        //  sendBulkMessages('Karibu SMS solution "'+teachers.fullnames+'" ID: "'+teacherid+'" Your token is: "'+token+'"',['+254784797517',formatedphone])
        //  console.log("Phone:"+teachers.personalphone +"fp:"+formatedphone+"Code:"+token +'id:'+teacherid);
         sendBulkMessages('SMS: "'+ message + '"', receivers);
        res.render('sendsms', {
            title: 'SMS | System',
            hd: 'Main Pane',
            username: req.session.email,
            profile: req.session.profile,
            userrole: req.session.role

        });
    });
    });

}