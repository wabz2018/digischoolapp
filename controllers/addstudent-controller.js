ACCOUNT_SID = 'ACa1308a0913638d16472f22089ee52a41'
AUTH_TOKEN = '0e2a77ed469fc17ffed3cffde2bac0a2'
SERVICE_SID = 'ISadb22c5c8bd65262c6914ec0b901b7d9'
const client = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);
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
let connection = require('./../config');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
        if(file.fieldname==="profile")
        {
        cb(null, './uploads/profile/')
        }
       else if(file.fieldname==="birthcopy")
       {
           cb(null, './uploads/bcertificate/')
       }
    },
    filename:(req,file,cb)=>{
        if(file.fieldname==="profile"){
            cb(null, file.fieldname+Date.now()+path.extname(file.originalname));
        }
      else if(file.fieldname==="birthcopy"){
        cb(null, file.fieldname+Date.now()+path.extname(file.originalname));
      }
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    },
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    }
}).fields(
    [
        {
        name:'profile',
        maxCount:1
        },
        {
       name:'birthcopy', maxCount:1
        }
    ]
);

function checkFileType(file, cb) {
    if(file.fieldname==="birthcopy")
    {
     if (
            file.mimetype === 'application/pdf' ||
            file.mimetype === 'application/msword' ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ) { // check file type to be pdf, doc, or docx
            cb(null, true);
          } else {
            cb(null, false); // else fails
          }
    }
    else if(file.fieldname==="profile")
    {
        if (
            file.mimetype === 'image/png' ||
            file.mimetype === 'image/jpg' ||
            file.mimetype === 'image/jpeg'||
            fiel.mimetype==='image/gif'
          ) { // check file type to be png, jpeg, or jpg
            cb(null, true);
          } else {
            cb(null, false); // else fails
          }
        }
    }

module.exports.addstudent = (req, res) => {

    upload(req, res, (err) => {
        if (err) {
            console.log(err);
        } else {
            if (req.file == "undefined") {
                console.log("No image selected!")
            } else {
                let datecreated = new Date();
                let currclass=req.body.currentclass;
                let studentid = datecreated.getFullYear()+'ST' + Math.random().toString().slice(2, 4)+currclass;
                let token = Math.random().toString().slice(2, 6)+studentid+datecreated;
                let fullnames = req.body.firstname + ' ' + req.body.lastname;
                let formatedphone = '';
                let phone = req.body.parentphone;
                if (phone.charAt(0) == '0') {
                    formatedphone = '+254' + phone.substring(1);
                } else if ((phone.charAt(0) == '+') && (phone.length > 12 || phone.length <= 15)) {
                    formatedphone = phone
                }
                let student = {
                    "studentid": studentid,
                    "currentclass":currclass,
                    "fullnames": fullnames,
                    "parentemail": req.body.parentemail,
                    "dateofbirth": req.body.dateofbirth,
                    "nationalid": req.body.nationalid,
                    "phone": formatedphone,
                    "pfullnames": req.body.pfullnames,
                    "mfullnames": req.body.mfullnames,
                    "profile": req.files.profile[0].path,
                    "birthcopy": req.files.birthcopy[0].path,
                    "dateadded":datecreated,
                    "graduationdate":req.body.graduationdate,
                    "istatus":'A',
                    "termcode":req.body.termcode,
                    "gender":req.body.gender
                }
                connection.query('INSERT INTO student SET ?', student, (error, results, fields) => {
                    if (error) {
                        res.json({
                            status: false,
                            message: 'there are some error with query'
                        })
                        console.log(error);
                    } else {
               
                        let sql="UPDATE clases set currentcapacity=(SELECT count(*) from student Where currentclass='"+currclass+"') WHERE classcode='"+currclass+"'";
                        connection.query(sql,(err, results)=>{
                            if(err) throw err;
                           console.log('Student successfully enrolled');
                        })
                        let users = {
                            "username": req.body.email,
                            "password": '12345',
                            "role": 'Student',
                            "token": token,
                            "phonenumber": formatedphone,
                            "istatus": 'A',
                            "dateadded": datecreated,
                            "profile":req.files.profile[0].path
                        }
                        connection.query('Insert into users  SET ?', users, (error, results, fields) => {
                            if (error) throw error;
                            //  sendBulkMessages('Karibu SMS solution "'+teachers.fullnames+'" ID: "'+teacherid+'" Your token is: "'+token+'"',['+254784797517',formatedphone])
                            //  console.log("Phone:"+teachers.personalphone +"fp:"+formatedphone+"Code:"+token +'id:'+teacherid);
                            // sendBulkMessages('Greetings from SMS your id is: "' + teacherid + '" and token is "' + token + '"', [teachers.personalphone, '+254784797517']);
                        connection.query("select * from terms",(err,rows)=>{
                            if(err) throw err;
                            let terms=rows;
                            connection.query("select * from clases", (err,rows)=>{
                            if(err)throw err;
                            res.render('addstudent', {
                                title: 'SMS | System',
                                hd: 'Main Pane',
                                username: req.session.email,
                                profile:req.session.profile,
                                userrole:req.session.role,
                                clases:rows,
                                terms:terms

                            });
                        })
                        })
                        });
                    }
                });
            }
        }
    });
}