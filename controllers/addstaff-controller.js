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
       else if(file.fieldname==="idcopy")
       {
           cb(null, './uploads/ids/');
       }
       else if(file.fieldname==="certificate")
       {
           cb(null, './uploads/certificate/')
       }
    },
    filename:(req,file,cb)=>{
        if(file.fieldname==="profile"){
            cb(null, file.fieldname+Date.now()+path.extname(file.originalname));
        }
      else if(file.fieldname==="idcopy"){
        cb(null, file.fieldname+Date.now()+path.extname(file.originalname));
      }
      else if(file.fieldname==="certificate"){
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
       name:'idcopy', maxCount:1
        },
        {
       name:'certificate', maxCount:1
        }
    ]
);

function checkFileType(file, cb) {
    if(file.fieldname==="certificate")
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
    else if(file.fieldname==="idcopy" || file.fieldname==="profile")
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
module.exports.addstaff = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            console.log(err);
        } else {
            if (req.file == "undefined") {
                console.log("No image selected!")
            } else {
                let datecreated = new Date();
             
                let fullnames = req.body.firstname + ' ' + req.body.lastname;
                let formatedphone = '',role, staffid;
                let phone = req.body.phone;
                if (phone.charAt(0) == '0') {
                    formatedphone = '+254' + phone.substring(1);
                } else if ((phone.charAt(0) == '+') && (phone.length > 12 || phone.length <= 15)) {
                    formatedphone = phone
                }
                let type=req.body.stafftype;
                let subs=req.body.subjects;
                let subjects='';
                if(type=='Teacher')
                {
                    staffid='TR'+Math.random().toString().slice(2,6);
                    role='Teacher';
                   subjects= subs.toString();
                }
                else if (type=='Bursar')
                {
                    staffid='BR'+Math.random().toString().slice(2,6);
                    role='Bursar';
                    subjects='NBA1';
                }
                else if(type=='Other')
                {
                    staffid='OT'+Math.random().toString().slice(2,6);
                    role='User';
                    subjects='OT01';
                }
                let token =Math.random().toString().slice(2, 6)+datecreated+staffid;
                let staff = {
                    "staffid": staffid,
                    "fullnames": fullnames,
                    "stafftype":type,
                    "email": req.body.email,
                    "natid": req.body.natid,
                    "subjects":subjects,
                    "dateadded":datecreated,
                    "phone": formatedphone,
                    "profile": req.files.profile[0].path,
                    "idcopy": req.files.idcopy[0].path,
                    "certificate":req.files.certificate[0].path
                }
                connection.query('INSERT INTO staff SET ?', staff, (error, results, fields) => {
                    if (error) {
                        res.json({
                            status: false,
                            message: 'there are some error with query'
                        })
                        console.log(error);
                    } else {
                        let users = {
                            "username": req.body.email,
                            "password": '12345',
                            "role": role,
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
                           connection.query('select * from subjects',(err, rows)=>{
                               if(err) throw err;
                               
                            res.render('addstaff', {
                                title: 'SMS | System',
                                hd: 'Main Pane',
                                username: req.session.email,
                                profile:req.session.profile,
                                userrole:req.session.role,
                                subjects:rows 
                            });
                        });
                        });
                    }
                });
            }
        }
    });
}