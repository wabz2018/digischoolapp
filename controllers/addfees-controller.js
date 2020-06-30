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
module.exports.addfees = (req, res) => {
  let date = new Date();
  let termcode = req.body.termcode;
  let classcode=req.body.classcode;
  let feecode = termcode + Math.random().toString().slice(2, 4)+classcode;
  let fees = {
    "feecode": feecode,
    "termcode": termcode,
    "istatus": 'A',
    "tuititonfee": req.body.tuititonfee,
    "boardingfee": req.body.boardingfee,
    "remidialfee": req.body.remidialfee,
    "transportfee": req.body.transportfee,
    "mealfee": req.body.mealfee,
    "othersfee": req.body.othersfee,
    "classcode":classcode
  }

  connection.query('Insert into fees  SET ?', fees, (error, results, fields) => {
    if (error) throw error;
    //  sendBulkMessages('Karibu SMS solution "'+teachers.fullnames+'" ID: "'+teacherid+'" Your token is: "'+token+'"',['+254784797517',formatedphone])
    //  console.log("Phone:"+teachers.personalphone +"fp:"+formatedphone+"Code:"+token +'id:'+teacherid);
    // sendBulkMessages('SMS: "'+ message + '"', receivers);
    let sql1 = "select sum(tuititonfee+boardingfee+remidialfee+transportfee+mealfee+othersfee) as tot from fees where feecode='" + feecode + "'";
    connection.query(sql1, (err, result) => {
      if (err) throw err;

      let sum = result[0].tot;
      connection.query("UPDATE clases set totfee='" + sum + "' , status='SET' where classcode='" + classcode + "'", (err, rows) => {
        if (err) throw err;
        let date = new Date();

        connection.query("select * from terms where termyear='" + date.getFullYear() + "'", (err, rows) => {
          if (err) throw err;
          let terms = rows;
          let sql = "SELECT * from clases where status='Pending'";
          connection.query(sql, (err, rows) => {
            if (err) throw err;
            res.render('addfee', {
              title: 'SMS PANEL',
              hd: 'PANE FESS',
              terms: terms,
              clases: rows,
              username: req.session.username,
              userrole: req.session.role
            })
          });
        });
      });
    });
  });
}