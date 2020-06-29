
let connection =require('../config');
module.exports.addterms=(req, res)=> {
  let date = new Date();
  let termname = req.body.termname;
  let termyear=req.body.termyear;
  let startdate=req.body.startdate;
  let enddate=req.body.enddate;
  let termcode=termyear+Math.random().toString().slice(2,4)+termname.substring(5);
  let terms = {
    "termcode": termcode,
    "termname":termname,
    "termyear":termyear,
    "startdate": startdate,
    "enddate":enddate
  
  }
  connection.query('Insert into terms  SET ?', terms, (error, results, fields) => {
    if (error) throw error;
        res.render('addterm', {
          title: 'SMS | System',
          hd: 'Main Pane',
          username: req.session.username,
          profile: req.session.profile,
          userrole: req.session.role
        });
  });

}