const express = require('express');
const session = require('express-session');
const path = require('path');
const ejs = require('ejs');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql');
const cors = require('cors'); 
const fastcsv = require('fast-csv'); 
const bodyParser = require('body-parser'); 
const pdfDocument=require('pdfkit');
const credentials = {
	apiKey: '71d1c347e80529f0a581c335c0ec196207c19577d468826001cf54c53a5b2e5c', // use your sandbox app API key for development in the test environment
	username: 'sandbox', // use 'sandbox' for development in the test environment
};
const AfricasTalking = require('africastalking')(credentials);
//import db connection

//email
const sendgridapikey = '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';
const sgMail = require('@sendgrid/mail');

const connection = require('./config');
const port = 3000;
let 
	userrole = '';
let dashboard = '';

//declare the app

//controllers 
let addstaffController = require('./controllers/addstaff-controller');
let addstudentController = require('./controllers/addstudent-controller');
let addsmsController = require('./controllers/addsms-controller');
let addfeeController = require('./controllers/addfees-controller');
let addtermController=require("./controllers/addterms-controller");



const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json({
	limit: "50mb"
}));
app.use(bodyParser.urlencoded({
	limit: "50mb",
	extended: true,
	parameterLimit: 50000
}));

app.set('public', path.join(__dirname, 'public'));
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('images'));

app.use(session({
	secret: 'myhumble',
	resave: true,
	saveUninitialized: true

}));

//for api 
app.post('/api/addstaff', addstaffController.addstaff);
app.post('/api/addstudent', addstudentController.addstudent);
app.post('/api/addsms', addsmsController.addsms);
app.post('/api/addfee', addfeeController.addfees);
app.post('/api/addterm', addtermController.addterms);
//for post
app.post('/controllers/addstudent-controller', addstudentController.addstudent);
app.post('/controllers/addstaff-controller', addstaffController.addstaff);
app.post('/controllers/addsms-controller', addsmsController.addsms);
app.post('/controllers/addfees-controller', addfeeController.addfees);
app.post('/controllers/addterms-controller',addtermController.addterms);


//authentication
app.post('/auth', (req, res) => {
	let username = req.body.username;
	let password = req.body.password;

	if (username && password) {
		let sql = "SELECT * FROM users WHERE username = ?  AND password = ?"
		connection.query(sql, [username, password], (err, results, fields) => {
			if (results.length > 0) {
				req.session.loggedin = true;
				req.session.username = username;
				req.session.role = results[0].role;
				req.session.profile = results[0].profile;
				userrole = req.session.role;
				let ds = getdashboard();
				res.redirect(ds);
			} else {
				res.send('Incorrect username and/or password');
			}
			res.end();
		});
	} else {
		res.send('Please enter username and password');
		res.end();
	}

});


//first page
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/' + 'login.html');
});


//dashboard

//add stafff
app.get('/addstaff', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
		connection.query('SELECT * from subjects', (err, rows) => {
			if (err) throw err;
			res.render('addstaff', {
				tittle: 'School SMS',
				hd: 'ADD STAFF',
				subjects: rows
			});
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
//view staff

app.get('/viewstaffs', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
		let sql = "SELECT * FROM staff";
		connection.query(sql, (err, rows) => {
			if (err) throw err;
			res.render('staff', {
				tittle: 'VIEW STAFF',
				hd: 'ALL STAFFS',
				staffs: rows
			});
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html')
	}
});

app.get('/teachers', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
		let sql = "SELECT * from staff where stafftype='Teacher'";
		connection.query(sql, (err, rows) => {
			if (err) throw err;
			res.render('teachers', {
				tittle: 'SMS PANEL',
				hd: 'TEACHERS',
				teachers: rows
			});
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});

app.get('/addstudent', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
		connection.query("Select * from terms", (err, rows) => {
			if (err) throw err;
			let terms = rows;
			connection.query("SELECT * from clases", (err, rows) => {
				if (err) throw err;
				res.render('addstudent', {
					tittle: 'SMS PANEL',
					hd: 'Add Student',
					clases: rows,
					terms: terms
				});
			});
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});

app.get('/students', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
		let sql = 'SELECT * from students';
		connection.query(sql, (err, rows) => {
			if (err) throw err;
			res.render('students', {
				students: rows,
				title: 'SCHOOL PANEL',
				hd: 'VIEW STUDENTS'
			})
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
app.get('/dashboard', (req, res) => {
	var
		numteachers = '',
		totstaff = '',
		totstudents = '',
		mstudents = '',
		fstudents = '',
		numsms = '',
		others = '',
		numemails = '',
		numclasses = '';
	if (req.session.loggedin) {
		if (req.session.role != 'Admin') {
			res.render('errorpage', {
				tittle: 'Access Denied',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				msg: 'Not authorized Please contact admin'
			});
		} else {
			connection.query("select * from staff where stafftype='Teacher'", (err, result) => {
				if (err) throw err;
				numteachers = result.length;
				connection.query("select * from students", (err, result) => {
					if (err) throw err;
					totstudents = result.length;
					connection.query("select * from students where gender='male'", (err, result) => {
						if (err) throw err;
						mstudents = result.length;
						fstudents = totstudents - mstudents;

						connection.query("select * from staff where stafftype !='Teacher'", (err, result) => {
							if (err) throw err;
							others = result.length;

							res.render('dashboard', {
								tittle: 'Main Dashboard',
								username: req.session.username,
								userrole: req.session.role,
								profile: req.session.profile,
								hd: 'Main',
								teachers: numteachers,
								others: others,
								paidfees: 300000,
								balance: 14000,
								fstudents: fstudents,
								mstudents: mstudents,
								totst: totstudents,
								messages: numsms,
								emails: numemails,
								classes: numclasses
							})
						});
					});
				});
			});
		}
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});


app.get('/tdashboard', (req, res) => {
	var numsch = '00',
		numcomp = '20',
		numcampaigns = '05',
		numteachers = '45',
		numstudents = '45',
		numsms = '43',
		numemails = '20',
		numclasses = '40';
	if (req.session.loggedin) {
		if (req.session.role != 'Teacher') {
			res.render('errorpage', {
				tittle: 'Access Denied',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				msg: 'Not authorized Please contact admin'
			});

		} else {
			res.render('tdashboard', {
				tittle: 'Main Dashboard',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				hd: 'Main',
				schools: numsch,
				companies: numcomp,
				campaigns: numcampaigns,
				teachers: numteachers,
				products: 300,
				students: numstudents,
				messages: numsms,
				emails: numemails,
				offers: 4500,
				classes: numclasses
			});
		}

	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});

app.get('/sdashboard', (req, res) => {
	var numsch = '00',
		numcomp = '20',
		numcampaigns = '05',
		numteachers = '45',
		numstudents = '45',
		numsms = '43',
		numemails = '20',
		numclasses = '40';
	if (req.session.loggedin) {
		if (req.session.role != 'Student') {
			res.render('errorpage', {
				tittle: 'Access Denied',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				msg: 'Not authorized Please contact admin'
			});

		} else {
			res.render('sdashboard', {
				tittle: 'Main Dashboard',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				hd: 'Main',
				schools: numsch,
				companies: numcomp,
				campaigns: numcampaigns,
				teachers: numteachers,
				products: 300,
				students: numstudents,
				messages: numsms,
				emails: numemails,
				offers: 4500,
				classes: numclasses
			})
		}

	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});

app.get('/stdashboard', (req, res) => {
	var numsch = '00',
		numcomp = '20',
		numcampaigns = '05',
		numteachers = '45',
		numstudents = '45',
		numsms = '43',
		numemails = '20',
		numclasses = '40';
	if (req.session.loggedin) {
		if (req.session.role != 'User') {
			res.render('errorpage', {
				tittle: 'Access Denied',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				msg: 'Not authorized Please contact admin'
			});

		} else {
			res.render('stdashboard', {
				tittle: 'Main Dashboard',
				username: req.session.username,
				userrole: req.session.role,
				profile: req.session.profile,
				hd: 'Main',
				schools: numsch,
				companies: numcomp,
				campaigns: numcampaigns,
				teachers: numteachers,
				products: 300,
				students: numstudents,
				messages: numsms,
				emails: numemails,
				offers: 4500,
				classes: numclasses
			})
		}

	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});

//maintain fees 
app.get('/addfees', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
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
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
//view fees

app.get('/viewfees', (req, res) => {
	if (req.session.loggedin) {
		let sql = "select * from fees ";
		connection.query(sql, (err, rows) => {
			if (err) throw err;
			res.render('fees', {
				title: 'SMS PANEL',
				hd: 'FEES',
				username: req.session.username,
				fees: rows
			})

		})
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
//terms
app.get('/addterm', (req, res) => {
	if (req.session.loggedin) {
		res.render('addterm', {
			title: 'SMS PANEL',
			hd: 'TERM PANEL',
			userrole: req.session.role,
			userrole: req.session.username
		})
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
})
app.get('/terms', (req, res) => { "%M %d %Y"
	if (req.session.loggedin) {
		let sql = "select termcode, termname, termyear, status, DATE_FORMAT(startdate,'%M %d %Y') "+
		" as startdate,DATE_FORMAT(enddate,'%M %d %Y')  as enddate from terms ";
		connection.query(sql, (err, rows) => {
			if (err) throw err;
			res.render('terms', {
				title: 'SMS PANEL',
				hd: 'Terms',
				username: req.session.username,
				terms: rows
			})
		})
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
//view clases
app.get('/clases', (req, res) => {
	if (req.session.loggedin) {
		connection.query('select * from viewclasses', (err, rows) => {
			if (err) throw err;
			res.render('clases', {
				title: 'SMS PANEL',
				hd: 'CLASSES',
				username: req.session.username,
				clases: rows
			});
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});


//view clases
app.get('/allclases', (req, res) => {
	if (req.session.loggedin) {
		connection.query('select * from clases', (err, rows) => {
			if (err) throw err;
			res.render('clases', {
				title: 'SMS PANEL',
				hd: 'CLASSES',
				username: req.session.username,
				clases: rows
			});
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
app.get('/updateteacher/:classcode', (req, res) => {
	if (req.session.loggedin) {
		let clases = '',
			ts = '';
		const classcode = req.params.classcode;
		let sql = "select * from clases where classcode='" + classcode + "'";
		let sql2 = "SELECT * from staff where stafftype='Teacher'";
		connection.query(sql2, (err, result) => {
			if (err) throw err;
			ts = result
			connection.query(sql, (err, result) => {
				if (err) throw err;
				clases = result[0];
				res.render('editclass', {
					title: 'SMS Solution',
					hd: 'CLASS UPDATE',
					username: req.session.username,
					clases: clases,
					teachers: ts
				});
			});
			console.log("Teachers:" + JSON.stringify(ts));
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});
app.post('/updateclass', (req, res) => {
	if (req.session.loggedin) {
		const classcode = req.body.classcode;
		let sql = "UPDATE clases SET classtearcher ='" + req.body.classtearcher + "' where classcode='" + classcode + "'";
		connection.query(sql, (err, result) => {
			if (err) throw err;
			res.redirect('/clases');
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
})
//view subjects
app.get('/subjects', (req, res) => {
	if (req.session.loggedin) {
		connection.query("select * from subjects", (err, rows) => {
			if (err) throw err;
			res.render('subjects', {
				title: 'SMS PANEL',
				hd: 'SUBJECTS',
				username: req.session.username,
				subjects: rows
			})
		})
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
});

function getdashboard() {
	var role = userrole;
	if (role == 'Admin') {
		dashboard = '/dashboard';
	} else if (role == 'User') {
		dashboard = '/stdashboard';
	} else if (role == 'Teacher') {
		dashboard = '/tdashboard'
	} else if (role == 'Student') {
		dashboard = '/sdashboard';
	}
	return dashboard;
}

app.get('/sentmessage', (req, res) => {
	if (req.session.loggedin && req.session.role == 'Admin') {
		res.render('sendsms', {
			title: 'SMS PANEL',
			hd: 'COMMUNICATIONS',
			username: req.session.username,
			userrole: req.session.role
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html')
	}
});

//bulk email 
app.post('/sendbulkemails', (req, res) => {
	sgMail.setApiKey(sendgridapikey);
	let newsql = '';
	let group = req.body.receivergroup;
	let sms = req.body.sms;
	if (group == 'teachers') {
		newsql = "select  email from staff where stafftype='Teacher'";
	} else if (group == 'parents') {
		newsql = 'select parentemail as email from student';
	} else if (group == 'general') {
		newsql = 'select email from staff';
	} else if (group == 'staff') {
		newsql = "select email from staff where stafftype !='Teacher'";
	}
	connection.query(newsql, (err, rows, fields) => {
		if (err) throw err;
		for (let i in rows) {
			const email = {
				from: 'vincent.wabwoba18@gmail.com',
				to: rows[i].email,
				subject: 'New Email',
				text: 'Bulk email',
				html: sms
			};
			sgMail.send(email, (err, results) => {
				if (err) {
					console.log("Error occured" + err);
				} else {
					console.log("Email sent" + rows[i].email + 'mss' + sms);
				}
				res.redirect('/sentmessage')
			});
		}
	});
});
app.get('/sendsms', (req, res) => {
	const sms = AfricasTalking.SMS
	// Use the service
	//use number in the simulator 
	sms
		.send({
			to: '+254705778658',
			message: 'Here is a trial sms',
			enque: true
		})
		.then(response => {
			console.log(response);
			res.json(response);
		})
		.catch(error => {
			console.log(error);
			res.json(error.toString());
		});
});

app.get('/bulkAirtime', (req, res) => {
	const airtime = AfricasTalking.AIRTIME

	var opts = {
		recipients: [{
				phoneNumber: '+254701775657',
				currencyCode: 'KES',
				amount: 10
			},
			{
				phoneNumber: '+254718775657',
				currencyCode: 'KES',
				amount: 10
			},
			{
				phoneNumber: '+254716775657',
				currencyCode: 'KES',
				amount: 10
			}
		]
	};
	airtime.send(opts)
		.then(response => {
			console.log(response);
			let jsonParsed = JSON.parse(response);
			res.json(response);
			console.log(jsonParsed.responses[0].phoneNumber);
		})
		.catch(function (err) {
			console.error(err);
		});

});

//error handling 404
app.use((req, res, next) => {
	if (req.session.loggedin) {
		res.status(404).render('errorpage', {
			tittle: 'ErrorPage',
			username: req.session.username,
			userrole: req.session.role,
			profile: req.session.profile,
			msg: 'There is no page like that'
		});
	} else {
		res.sendFile(__dirname + '/' + 'login.html');
	}
})
app.get('/logout', (req, res) => {
	req.session.destroy();
	res.sendFile(__dirname + '/' + 'login.html');
});
app.listen(port, () => {
	console.log('server running on port:' + port);
})