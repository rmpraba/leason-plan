
 var express  = require("express");
 var mysql      = require('mysql');   
 var email   = require("emailjs/email");
 var fs = require('fs');

var dbserver_ip_address = process.env.OPENSHIFT_MYSQL_DB_HOST || '127.0.0.1'
var connection = mysql.createConnection({
   host     : 'localhost',
   user     : 'root',
   password : '',
   database : 'master1'
 });
var bodyParser = require('body-parser'); 
var app = express();
var logfile;

app.use(express.static('app'));
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get('/', function (req, res) {

  res.sendFile("app/index.html" );
})
app.post('/checkschool-card',  urlencodedParser,function (req, res)
{
    var id={"id":req.query.username};
    connection.query('SELECT name from md_school where id in (select school_id from md_employee where ?) ',[id],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

//check the role of user
app.post('/rolecheck-service',  urlencodedParser,function (req, res)
{
  logfile = fs.createWriteStream('./app/configfile/logfile.txt', {flags: 'a'});
console.log('logfile.........');
console.log(logfile);

  var id={"id":req.query.username};
  var username={"id":req.query.username};
  var password={"password":req.query.password};
  // connection.query('select id,role_name from md_role where id in (select role_id from md_employee where ? and ? )',[id,password],
  var qur="select distinct(mr.id),mr.role_name,(select name from md_school where id=me.school_id) as name,me.school_id "+
  "from md_role mr join md_employee me on(mr.id=me.role_id) "+
  "where me.id='"+req.query.username+"' and password='"+req.query.password+"'";

  console.log('.............role.....................');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    { 
      console.log(err);     
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else   
      console.log(err);
  });
});


//select the username and password from login table
app.post('/login-card',  urlencodedParser,function (req, res)
{
  var id={"id":req.query.username};
  var username={"id":req.query.username};
  var password={"password":req.query.password};
  var schoolid={school_id:req.query.schoolid};
  connection.query('SELECT name as uname,  school_id as school,(select name from md_school where id=school) as name ,(select address from md_school where id=school) as addr,(select affiliation_no from md_school where id=school) as affno,(select email_id from md_school where id=school) as email,(select website from md_school where id=school) as website,(select telno from md_school where id=school) as telno  from md_employee where ? and ? and ? and ?',[id,username,password,schoolid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    { 
      console.log(err);     
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
    
  });
});

//changing teachers password
app.post('/changepassword-service',  urlencodedParser,function (req, res)
{
  
  var username={"id":req.query.username};
  var oldpassword={"password":req.query.oldpassword};
  var newpassword={"password":req.query.newpassword};
  connection.query('UPDATE md_employee SET ? WHERE ? and ?',[newpassword,username,oldpassword],
    function(err,result)
    {
      console.log('..............result..............');
      console.log(result.affectedRows);
    if(!err)
    {  
      if(result.affectedRows>0)  
      res.status(200).json({'returnval': 'Password changed!'});
    
    else
    {
      console.log(err);     
      res.status(200).json({'returnval': 'Password not changed!'});
    }
    }
    else
      console.log(err);
    
  });
});


//Function to select the assesment type id
app.post('/assesmenttype-service',  urlencodedParser,function (req, res)
{
  var schoolid={"id":req.query.schoolid};
  var assesmentname={"assesment_name":req.query.assesmentname};  
  connection.query('SELECT * from md_assesment_type where ?',[assesmentname],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


//fetching grade info
app.post('/term-service',  urlencodedParser,function (req, res)
{
  var qur="select term_name from md_term where term_id in(select term_id from mp_assesment_term where assesment_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"'))";

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

//fetching grade info
app.post('/grade-service',  urlencodedParser,function (req, res)
{
  var schoolid={school_id:req.query.schoolid};
  var loggedid={id:req.query.loggedid};
  var roleid={role_id:req.query.roleid};
  console.log(roleid);
  // var qur="select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where id='"+loggedid+"')";
  if(req.query.roleid=='subject-teacher')
  {
    var qur="select grade_name from md_grade where grade_id "+
  "in(select grade_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {
    var qur="select grade_name from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    var qur="select grade_name from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')";
  }
  else if(req.query.roleid=='headmistress')
  {
    var qur="select grade_name from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"')";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management')
  {
    var qur="select grade_name from md_grade where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"')";
  }

  console.log('-------------------grade----------------------');
  console.log(qur);

  // connection.query('select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where ? and ? and ?)',[roleid,schoolid,loggedid],
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

//fetching section info
app.post('/section-service',  urlencodedParser,function (req, res)
{  
   if(req.query.roleid=='subject-teacher')
  {
    //console.log('1');
    var qur="select * from md_section where section_id in "+
    "(select section_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' "+
    "and id='"+req.query.loggedid+"' and grade_id=(select grade_id from md_grade "+
    "where grade_name='"+req.query.gradename+"')) and school_id='"+req.query.schoolid+"'";
  }
  else if(req.query.roleid=='class-teacher')
  {
    //console.log('2');
    var qur="select * from md_section where section_id in "+
    "(select section_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' "+
    "and id='"+req.query.loggedid+"' and grade_id=(select grade_id from md_grade "+
    "where grade_name='"+req.query.gradename+"')) and school_id='"+req.query.schoolid+"'";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    //console.log('3');
    var qur="select * from md_section where section_id in "+
    "(select section_id from mp_teacher_grade where "+
    "grade_id=(select grade_id from md_grade where "+
    "school_id='"+req.query.schoolid+"' and grade_name='"+req.query.gradename+"')) and school_id='"+req.query.schoolid+"'";
  }
  else if(req.query.roleid=='headmistress')
  {
    //console.log('4');
    var qur="select * from md_section where section_id in "+
    "(select section_id from mp_teacher_grade where "+
    "grade_id in(select grade_id from mp_teacher_grade where grade_id=(select grade_id from md_grade "+
    "where grade_name='"+req.query.gradename+"') and "+
    "school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"'";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management')
  {
    //console.log('5');
    var qur="select * from md_section where section_id in "+
    "(select section_id from mp_teacher_grade where "+
    "grade_id in(select grade_id from mp_teacher_grade where grade_id=(select grade_id from md_grade "+
    "where grade_name='"+req.query.gradename+"') and "+
    "school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"'";
  }


  console.log('-------------------section----------------------');
  //console.log(qur);
  // var qur="select * from md_section where section_id in(select section_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' and id='"+req.query.loggedid+"' and grade_id=(select grade_id from scorecarddb.md_grade where grade_name='"+req.query.gradename+"'))";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

//fetching section info
app.post('/subject-service',  urlencodedParser,function (req, res)
{

   if(req.query.roleid=='subject-teacher')
  {
    var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where "+
  "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"')) "+
  "and subject_category in('"+req.query.subjectcategory+"')";
  }
  else if(req.query.roleid=='class-teacher')
  {
    var qur="select * from md_subject where subject_id in "+
    "(select subject_id from mp_grade_subject where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"') "+
    "and subject_category in('"+req.query.subjectcategory+"')) ";
  }
   else if(req.query.roleid=='co-ordinator')
  {
    var qur="select * from md_subject where subject_id in "+
    "(select subject_id from mp_grade_subject where grade_id "+
    "in(select grade_id from mp_teacher_grade where "+
    "school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'))";
  }
  else if(req.query.roleid=='headmistress')
  {
    var qur="select * from md_subject where subject_id in "+
    "(select subject_id from mp_grade_subject where "+
    "grade_id in('g1','g2','g3','g4'))";
  }
   else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'||req.query.roleid=='headofedn'||req.query.roleid=='management')
  {
    var qur="select * from md_subject where subject_id in "+
    "(select subject_id from mp_grade_subject)";
  }

  console.log('-------------------subject----------------------');
  console.log(qur);

  // var qur="select subject_name from md_subject where subject_id in(select subject_id from mp_grade_subject where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"'))";
  // console.log(qur);
  /*if(req.query.roleid=='subject-teacher'){
  var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"')) and subject_category='"+req.query.subjectcategory+"' and subject_id not in('s16','s17','s20')";
  }
  if(req.query.roleid=='class-teacher'){
   var qur="select * from md_subject where subject_id in "+
  "(select subject_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.loggedid+"' and "+
  "grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and "+
  "section_id=(select section_id from md_section where section_name='"+req.query.section+"')) and subject_category='"+req.query.subjectcategory+"'"; 
  }*/
   // console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

//fetching category info
app.post('/category-service',  urlencodedParser,function (req, res)
{
  //var qur="select subject_category_name from md_subject where subject_id in(select subject_id from mp_grade_subject where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"'))";
  // console.log(qur);
var qur="select subject_category_name from md_subject_category where subject_category_id in(select distinct subject_category_id from md_grade_subject_category_mapping"+
" where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and"+
" grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and"+
" subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"'))";
// console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


//fetching subcategory info
app.post('/subcategory-service',  urlencodedParser,function (req, res)
{
var qur="select subject_sub_category_name from md_subject_sub_category where subject_sub_category_id in(select distinct subject_sub_category_id from md_grade_subject_category_mapping where term_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and subject_category_id=(select subject_category_id from md_subject_category where subject_category_name='"+req.query.category+"'))";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

//fetching teachers assesment card info
app.post('/assesment-service',  urlencodedParser,function (req, res)
{
  var qur="select assesment_cyclename from md_assesment_cycle where assesment_cycleid in(select assesment_cycleid from mp_assesment_term_cycle where assesment_id=(select assesment_id from md_assesment_type where assesment_name='"+req.query.termtype+"') and term_id=(select term_id from md_term where term_name='"+req.query.termname+"'))";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/fetchstudentbeginner-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"')) and "+
"school_id='"+req.query.schoolid+"' and id not in(select student_id from tr_beginner_assesment_marks where class_id=(select class_id  from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"')) and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"')";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforhealth-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"') and "+
"school_id='"+req.query.schoolid+"' and id not in(select student_id from tr_term_health where   term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"')";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});



app.post('/fetchstudentforattendance-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"') and "+
"school_id='"+req.query.schoolid+"' and id not in(select student_id from tr_term_attendance where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"')";
 //console.log(qur);
 connection.query(qur,
  
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreportforattendance-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,attendance,working_days,speccomment,generic from tr_term_attendance where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"'";
 //console.log(qur);
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentreportforcoscholastic-service',  urlencodedParser,function (req, res)
{ 

var qurcheck;
  if(req.query.roleid=="subject-teacher"||req.query.roleid=="class-teacher"){
    console.log('c');
    flag="0";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"'  and subject='"+req.query.subject+"' and flag in('0','1')";
  }
  else if(req.query.roleid=="co-ordinator")
  {
    console.log('o');
    flag="1";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and  subject='"+req.query.subject+"' and flag in('"+flag+"')";
  }

 

  var qur="select * from tr_coscholastic_assesment_marks where academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' order by sub_seq";
 //console.log(qur);
 //console.log(qurcheck);
   connection.query(qurcheck,function(err, rows){
    if(!err){
      if(rows.length==0)
      {
        console.log('f');
  connection.query(qur,function(err, rows)  
    {
    if(!err)
    {
    if(rows.length>0)
    {
    //  console.log('s'+JSON.stringify(rows));
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
    }
    else{
      console.log('d');
      res.status(200).json({'returnval': 'imported'});
    }
    }
  });
});
app.post('/fetchexcelreportforcoscholastic-service',  urlencodedParser,function (req, res)
{ 
  var qur="select * from tr_coscholastic_assesment_marks where academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' order by sub_seq";
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
    //  console.log('s'+JSON.stringify(rows));
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });

});
app.post('/fetchstudentforcoscholastic-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id from md_student where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"school_id='"+req.query.schoolid+"')";
 //console.log(qur);
 connection.query(qur,
  
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforphysical-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+"(select class_id   from mp_grade_section where grade_id=(select grade_id "+"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"')) and "+"school_id='"+req.query.schoolid+"' and id not in(select student_id from tr_term_physical_education where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"')";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreportforphysical-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,interest_area,identified_talent,member_of_school,competitions_attended,prize_won from tr_term_physical_education where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentforartverticals-service',  urlencodedParser,function (req, res)
{
  var qur="select school_id,id,student_name,class_id  from md_student where  class_id="+
"(select class_id   from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"')) and "+
"school_id='"+req.query.schoolid+"' and id not in(select student_id from tr_term_art_verticals where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"')";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchstudentreportforartverticals-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id ,student_name,interest_area,identified_talent,member_of_school,competitions_attended,prize_won from tr_term_art_verticals where academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and  grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentreportforhealth-service',  urlencodedParser,function (req, res)
{
  var qur="select student_id as id,student_name,grade,section,height,weight,blood_group,vision_left,vision_right,dental from tr_term_health where  term_id='"+req.query.termname+"' and grade='"+req.query.gradename+"' and  section='"+req.query.section+"' and school_id='"+req.query.schoolid+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
     res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudbeginnerreport-service',  urlencodedParser,function (req, res)
{
  var qur="select *,(select student_name from md_student where id=student_id) as student_name from tr_beginner_assesment_marks where class_id=(select class_id  from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"')) and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetching student info
app.post('/fetchstudent-service',  urlencodedParser,function (req, res)
{
var qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
"grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
" and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in(0,1)";
var qur="select * from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"')";
var qur1="select school_id,student_id as id,student_name,class_id "+
"from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"')";
var qur2="select school_id,id,student_name,class_id from md_student where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"school_id='"+req.query.schoolid+"')";

  console.log(qurcheck);
  console.log('............................................'); 
  console.log(qur);
  console.log('............................................'); 
  console.log(qur1); 
  console.log('............................................'); 
  


connection.query(qurcheck,function(err, rows){
  //console.log(rows.length);
if(rows.length==0){
connection.query(qur,
  function(err, rows)
  {
    if(!err)
    {
      if(rows.length>0)
      {
        //console.log('qur1...............................');
       connection.query(qur1,function(err, rows)
       {
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else
        res.status(200).json({'returnval': 'invalid'});
      });
      }
      else
      {
       connection.query(qur2,function(err, rows){
        console.log('............normal subject............'); 
        console.log(qur2);     
        console.log('............................................'); 
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else{
        console.log(err);
        res.status(200).json({'returnval': 'invalid'});
      }
      });
      }
    }
    else
      console.log(err);
  
});

}
else
res.status(200).json({'returnval': 'imported'});
});

});


app.post('/fetchfastudent-service',  urlencodedParser,function (req, res)
{
  console.log('sa');
  var qur="select * from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"')";
var qur1="select school_id,student_id as id,student_name,class_id "+
"from tr_student_to_subject "+
"where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"subject_id=(select subject_id from md_subject where subject_name='"+req.query.subject+"') and "+
"school_id='"+req.query.schoolid+"')";
  var qur2="select school_id,id,student_name,class_id from md_student where  class_id="+
"(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and "+
"school_id='"+req.query.schoolid+"')";

connection.query(qur,
  function(err, rows)
  {
    if(!err)
    {
      if(rows.length>0)
      {
       connection.query(qur1,function(err, rows)
       {
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else
        res.status(200).json({'returnval': 'invalid'});
      });
      }
      else
      {
     connection.query(qur2,function(err, rows)
     {
        console.log('............normal subject............'); 
        console.log(qur2);     
        console.log('............................................'); 
       if(rows.length>0) 
        res.status(200).json({'returnval': rows});
       else{
        console.log(err);
        res.status(200).json({'returnval': 'invalid'});
      }
       });
    }
  }
    else
      console.log(err);
  
}); 

});


// fetchmarkexiststudentinfo-service

//Storing marks for assesment
app.post('/insertbamark-service',  urlencodedParser,function (req, res)
{  
  var response={
         school_id:req.query.schoolid,   
         academic_year:req.query.academicyear,
         assesment_id:req.query.assesmentid,
         class_id:req.query.classid,
         subject_id:req.query.subject,
         student_id:req.query.studentid,
         category_id:req.query.category,
         mark:req.query.mark,
         score:req.query.score,
         grade:req.query.grade                       
  }
  var checkqur="SELECT * FROM tr_beginner_assesment_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and assesment_id='"+req.query.assesmentid+"' and subject_id='"+req.query.subject+"' and category_id='"+req.query.category+"' and "+
  "class_id='"+req.query.classid+"' and student_id='"+req.query.studentid+"'";
  var updatequr="UPDATE tr_beginner_assesment_marks SET ? WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' "+
  " and assesment_id='"+req.query.assesmentid+"' and subject_id='"+req.query.subject+"' and category_id='"+req.query.category+"' and "+
  "class_id='"+req.query.classid+"' and student_id='"+req.query.studentid+"'";
  console.log('.............................checkqur.............................');
  console.log(checkqur);
  console.log('..................................................................');
  connection.query(checkqur,function(err, rows)
    {
    if(!err){
    if(rows.length>0){
    connection.query(updatequr,[response],function(err, rows){
    if(!err)
      res.status(200).json({'returnval': 'succ'});
    else
      res.status(200).json({'returnval': 'fail'});
    });
    }
    else{
    connection.query("INSERT INTO tr_beginner_assesment_marks set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
    });
    }
    }
    else
      console.log(err);
    });
});


//fetching grade
app.post('/fetchgrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_grade_rating";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchfagrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_fa_grade_rating";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});




app.post('/fetchcoscholasticgrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_coscholastic_grade_rating";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));  
      global.coscholasticgrade=rows; 
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
//Storing marks for assesment
app.post('/insertassesmentmark-service',  urlencodedParser,function (req, res)
{ 
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,   
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         category:req.query.category,
         sub_category:req.query.subcategory,
         mark:req.query.mark,
         flag:req.query.absflag,
         sub_cat_sequence:req.query.subcatseq                 
  }
  var cond1={school_id:req.query.schoolid};
  var cond2={academic_year:req.query.academicyear};
  var cond3={assesment_id:req.query.assesmentid};
  var cond4={term_name:req.query.termname};
  var cond5={class_id:req.query.classid};
  var cond6={student_id:req.query.studentid};
  var cond7={subject_id:req.query.subject};
  var cond8={category:req.query.category};
  var cond9={sub_category:req.query.subcategory};
  var cond10={grade:req.query.grade};
  var cond11={section:req.query.section};
  var cond12={sub_cat_sequence:req.query.subcatseq};
  var subname={subject_name:req.query.subject};
  var mark={mark:req.query.mark};
  

  //console.log(response);

  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category;
 // console.log(response.subject_category);

  var q="SELECT * FROM tr_term_assesment_marks WHERE grade='"+req.query.grade+"' and section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'"+
  " and assesment_id='"+req.query.assesmentid+"' and term_name='"+req.query.termname+"' and class_id='"+req.query.classid+"'"+
  " and student_id='"+req.query.studentid+"' and subject_id='"+req.query.subject+"' and category='"+req.query.category+"' and sub_category='"+req.query.subcategory+"' and sub_cat_sequence='"+req.query.subcatseq+"'";
  console.log('..................................');
  //console.log(q);
  console.log('..................................');
  connection.query("SELECT * FROM tr_term_assesment_marks WHERE ? and ? and ? and ? and ? and ? and ? and ? and ? and ? and ? and ?",[cond1,cond2,cond3,cond4,cond5,cond6,cond7,cond8,cond9,cond10,cond11,cond12],function(err, rows) {
  console.log("length..........."+rows.length);
  if(rows.length==0){
  connection.query("INSERT INTO tr_term_assesment_marks set ?",[response],
  function(err, result)
    {
    if(!err)
    {  
     console.log("rows affected............"+result.affectedRows);  
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
  else{
   connection.query("UPDATE tr_term_assesment_marks SET ? WHERE ? and ? and ? and ? and ? and ? and ? and ? and ?",[mark,cond1,cond2,cond3,cond4,cond5,cond6,cond7,cond8,cond9],function(err, rows) {
    if(!err){
      res.status(200).json({'returnval': 'succ'});
    }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
  }
  // else
    // res.status(200).json({'returnval': 'Duplicate entry!'});
  // });
});
});
});

//Storing overall marks for the assesment
app.post('/overalltermmarkinsert-service',  urlencodedParser,function (req, res){

  var qur="INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
  "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
  "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id";

  connection.query(qur,
  function(err, rows){
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
});



app.post('/insertfaassesmentmark-service',  urlencodedParser,function (req, res)
{ 
  console.log('fa');
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,   
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         category:req.query.category,
         sub_category:req.query.subcategory,
         mark:req.query.mark,
         flag:req.query.absflag,
         sub_cat_sequence:req.query.subcatseq                 
  }
  var cond1={school_id:req.query.schoolid};
  var cond2={academic_year:req.query.academicyear};
  var cond3={assesment_id:req.query.assesmentid};
  var cond4={term_name:req.query.termname};
  var cond5={class_id:req.query.classid};
  var cond6={student_id:req.query.studentid};
  var cond7={subject_id:req.query.subject};
  var cond8={category:req.query.category};
  var cond9={sub_category:req.query.subcategory};
  var cond10={grade:req.query.grade};
  var cond11={section:req.query.section};
  var cond12={sub_cat_sequence:req.query.subcatseq};
  var subname={subject_name:req.query.subject};
  var mark={mark:req.query.mark};
  

  //console.log(response);

  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category;
 // console.log(response.subject_category);

  var q="SELECT * FROM tr_term_fa_assesment_marks WHERE grade='"+req.query.grade+"' and section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'"+
  " and term_name='"+req.query.termname+"' and class_id='"+req.query.classid+"'"+
  " and student_id='"+req.query.studentid+"' and subject_id='"+req.query.subject+"' and category='"+req.query.category+"' and sub_category='"+req.query.subcategory+"' and sub_cat_sequence='"+req.query.subcatseq+"'";
 // console.log('..................................');
  //console.log(q);
  console.log('..................................');
  connection.query("SELECT * FROM tr_term_fa_assesment_marks WHERE ? and ? and ? and ? and ? and ? and ? and ? and ? and ? ",[cond1,cond2,cond4,cond6,cond7,cond8,cond9,cond10,cond11,cond12],function(err, rows) {
 // console.log("length..........."+rows.length);
  if(rows.length==0){
  connection.query("INSERT INTO tr_term_fa_assesment_marks set ?",[response],
  function(err, result)
    {
    if(!err)
    {  
     console.log("rows affected............"+result.affectedRows);  
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  }
  else{
   connection.query("UPDATE tr_term_fa_assesment_marks SET ? WHERE ? and ? and ? and ? and ? and ? and ?",[mark,cond1,cond2,cond4,cond6,cond7,cond8,cond9],function(err, rows) {
    if(!err){
      res.status(200).json({'returnval': 'succ'});
    }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
  }
  // else
    // res.status(200).json({'returnval': 'Duplicate entry!'});
  // });
});
});
});

//Storing overall marks for the assesment
app.post('/overalltermmarkinsert-service',  urlencodedParser,function (req, res){

  var qur="INSERT INTO tr_term_assesment_overall_marks SELECT school_id,academic_year,assesment_id,term_name,student_id,subject_id,category,sum(mark) as total, "+
  "sum(mark)/count(*) as rtotal,grade,section from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' "+
  "and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' "+
  "and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
  "group by school_id,academic_year,assesment_id,term_name,subject_id,grade,section,category,student_id";

  connection.query(qur,
  function(err, rows){
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
});


//storing overall scholastic mark
app.post('/overalltermassesmentinsert-service',  urlencodedParser,function (req, res){

var qur=" INSERT INTO tr_term_assesment_overall_assesmentmarks SELECT school_id,academic_year,"+
"term_name,student_id,subject_id,category,sum(rtotal) as total,"+ 
"sum(rtotal)/count(*) as average,"+
"(SELECT grade from md_grade_rating where lower_limit<=round((sum(rtotal)/count(*)),1) && higher_limit>=round((sum(rtotal)/count(*)),1)) as term_cat_grade,grade,section from tr_term_assesment_overall_marks where "+
"academic_year='"+req.query.academicyear+"' "+
"and school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' "+
"and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject_id='"+req.query.subject+"' "+
"group by school_id,academic_year,term_name,subject_id,category,student_id";
 
  connection.query(qur,
  function(err, rows){
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });  
});

//storing mark for coscholastic assessment
app.post('/insertcoassesmentmark-service',  urlencodedParser,function (req, res)
{

var response={ 
 
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         grade:req.query.grade,
         section:req.query.section,         
         sub_category:req.query.subcategory,
         mark:req.query.mark,         
         category_grade:req.query.categorygrade,
         sub_seq:req.query.sequence
  }  
   var q="select * from tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"' and  subject_id='"+req.query.subject+"' and  sub_category='"+req.query.subcategory+"'";
  connection.query(q,
 function(err, rows)
    {
    if(rows.length==0)
    {
  var subname={subject_name:req.query.subject};
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category;  
  connection.query("INSERT INTO tr_coscholastic_assesment_marks set ?",[response],
  function(err, rows)
    {
     // console.log('co-insert');
    if(!err)
    {    
      //console.log('co1-insert');
      res.status(200).json({'returnval': 'insert'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  });
}
else
{
  
  connection.query("UPDATE tr_coscholastic_assesment_marks SET ? where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studentid+"' and  subject_id='"+req.query.subject+"' and  sub_category='"+req.query.subcategory+"'",[response],
    function(err, rows)
     {
    
    if(!err)
    {
      console.log('co1-update');
      res.status(200).json({'returnval': 'update'});
    }
    else
    {
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
}
});

});

app.post('/insertcosubcategorymark-service',  urlencodedParser,function (req, res){

var response={ 
 
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assessment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studid,
         student_name:req.query.studname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         category:req.query.category,        
         sub_category:req.query.subcategory,
         mark:req.query.mark,         
         category_grade:req.query.categorygrade,
         order_seq:req.query.order_seq

  }  
  var q="select * from tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studid+"' and  subject_id='"+req.query.subject+"' and  category='"+req.query.category+"' and sub_category='"+req.query.subcategory+"'  order by order_seq";
  //console.log(q);  
  connection.query(q,
 function(err, rows)
    {
 // console.log(rows.length);
    if(rows.length==0){
  connection.query("INSERT INTO tr_coscholastic_sub_category_assesment_marks set ?",[response],
  function(err, rows)
    {
    if(!err)
    {    
      //console.log('insert');
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
}
  else
  {
   connection.query("UPDATE tr_coscholastic_sub_category_assesment_marks SET ? where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and student_id='"+req.query.studid+"' and  subject_id='"+req.query.subject+"' and  category='"+req.query.category+"'and sub_category='"+req.query.subcategory+"'",[response],
    function(err, rows) {
     // console.log("update");
    if(!err){
      //console.log("success");
      res.status(200).json({'returnval': 'succ'});
    }
    else{
      res.status(200).json({'returnval': 'fail'});
    }
   }); 
  }
});
});
//storing overall coscholastic mark
app.post('/overallinsertcoassesment-service',  urlencodedParser,function (req, res){
   var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,         
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         subject_id:req.query.subject,
         type:req.query.type,
         category:req.query.category,         
         total:req.query.total,
         rtotal:req.query.rtotal,
         grade:req.query.grade                
  }
  var subname={subject_name:req.query.subject};
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category; 
  connection.query("INSERT INTO tr_term_co_assesment_overall_marks set ?",[response],
  function(err, rows){
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  
  });
  });
});

//storing mark for coscholastic assessment
app.post('/insertcocurricularmark-service',  urlencodedParser,function (req, res){

var response={ 
 
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assessment_id:req.query.assesmentid,
         term_name:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         grade:req.query.grade,
         section:req.query.section,
         subject_id:req.query.subject,
         grade:req.query.grade,
         section:req.query.section,         
         sub_category:req.query.subcategory,
         mark:req.query.mark,         
         category_grade:req.query.categorygrade
  }  
  
  var subname={subject_name:req.query.subject};
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {  
  response.subject_category=rows[0].subject_category;
  
  connection.query("INSERT INTO tr_cocurricular_term_marks set ?",[response],
  function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  });
  });
});

//storing overall coscholastic mark
app.post('/overallinsertcocurricularmark-service',  urlencodedParser,function (req, res){
   var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academicyear,
         assesment_id:req.query.assesmentid,
         term_name:req.query.termname,         
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         subject_id:req.query.subject,
         type:req.query.type,
         category:req.query.category,         
         total:req.query.total,
         rtotal:req.query.rtotal,
         grade:req.query.grade                
  }
  var subname={subject_name:req.query.subject};  
  connection.query("SELECT subject_category FROM md_subject where ?",[subname],
  function(err, rows)
  {
  response.subject_category=rows[0].subject_category; 
  connection.query("INSERT INTO tr_cocurricular_overallterm_marks set ?",[response],
  function(err, rows){
     if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }
  
  });
  });
});


//fetching student names
app.post('/scorecardreadyness-service',  urlencodedParser,function (req,res)
{   
//console.log('-------------------------------');
//console.log(req.query.termname);
//console.log('-------------------------------');
var n=0;
console.log('--------------------'+req.query.termname+'-----------');

if(req.query.termname=='Term1')
n=1;
if(req.query.termname=='Term2')
n=2;
if(req.query.termname=='Term3')
n=3;
if(req.query.grade=="Grade-1"||req.query.grade=="Grade-2"||req.query.grade=="Grade-3"||req.query.grade=="Grade-4"){
var qur="select * from md_grade_subject_count where no_of_subjects=(( "+
"(select count(distinct(subject_id)) from tr_term_assesment_overall_assesmentmarks where "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
"grade='"+req.query.grade+"' and section='"+req.query.section+"')*("+n+"))/"+
"(select count(distinct(term_name)) from tr_term_assesment_overall_assesmentmarks where "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
"grade='"+req.query.grade+"' and section='"+req.query.section+"')) and school_id='"+req.query.schoolid+"' and "+
"academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
}
else
{
var qur="select * from md_grade_subject_count where no_of_subjects=(( "+
"(select count(distinct(subject_id)) from tr_term_overallfa_assesment_marks where "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
"grade='"+req.query.grade+"' and section='"+req.query.section+"')*("+n+"))/"+
"(select count(distinct(term_name)) from tr_term_overallfa_assesment_marks where "+
"school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and "+
"grade='"+req.query.grade+"' and section='"+req.query.section+"')) and school_id='"+req.query.schoolid+"' and "+
"academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
}
console.log('.........................score card-----------------------------------');
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {  
      if(rows.length>0)
      res.status(200).json({'returnval': 'match'});
      else
      res.status(200).json({'returnval': 'mismatch'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
//fetching student names
app.post('/fetchstudname-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var gradeid={grade_id:req.query.grade};
  var sectionid={section_id:req.query.section};

  // var qur="SELECT * FROM md_student where class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
  var qur="SELECT * FROM md_student where class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"') and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"'";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {  
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});     

//fetch the Life SKill SUb category
app.post('/fetchlifeskill',  urlencodedParser,function (req,res)
{  
  var type=req.query.termtype;
  // console.log(type);
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
 
  connection.query( "SELECT * FROM md_coscholastic_metrics where sub_category=?",[type],
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   

      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchstudentlifeskill',  urlencodedParser,function (req,res)
{  
  var type=req.query.termtype;
 var qur= "SELECT sub_category,mark FROM tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and term_name='"+req.query.termname+"' and academic_year='"+req.query.academicyear+"' and student_id='"+req.query.studid+"'and category='"+req.query.subcategory+"' order by order_seq";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
       //console.log(JSON.stringify(rows));   

      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }  

  });
});


//fetching student info
app.post('/fetchstudinfo-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={id:req.query.studid};
  var qur="select s.id,p.student_id,s.student_name,s.dob,p.parent_name,p.mother_name,p.email,p.mobile,p.address1,p.address2,p.address3,p.city,p.pincode,p.alternate_mail "+
  "from md_student s join parent p on(s.id=p.student_id) and s.id='"+req.query.studid+"' and s.school_id='"+req.query.schoolid+"' and p.school_id='"+req.query.schoolid+"'";

  //console.log(qur);  
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.studentinfo=rows; 
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetching subject info
app.post('/fetchsubjectname-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};
  var qur="select subject_id,subject_name,subject_category from md_subject where subject_id in"+
  "(select subject_id from mp_grade_subject where grade_id="+
  "(select grade_id from mp_grade_section where class_id="+
  "(select class_id from md_student where id='"+req.query.studid+"' "+
  "and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"')) order by subject_category";

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.subjectinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


//fetching subject info
app.post('/fetchreportsubjectname-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var grade={grade:req.query.grade};
  var section={section:req.query.section};
  var qur="select subject_id,subject_name,subject_category from md_subject where subject_id in "+
  "(select subject_id from mp_grade_subject where grade_id=(select grade_id from "+
  "md_grade where grade_name='"+req.query.grade+"')) "+
  " order by subject_category";
  console.log('-----------------------fetchreportsubjectname----------------------------');
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.subjectinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetching mark
app.post('/fetchmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var qur="SELECT * FROM tr_term_overallfa_assesment_marks WHERE school_id='"+req.query.schoolid+"' AND student_id='"+req.query.studid+"' order by subject_id"; 
  console.log('----------------------fetch mark------------------------');
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.fetchmark=rows;
      // console.log('---------------------------');
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });
});

//fetchscholasticmark-service
app.post('/fetchscholasticmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};  
  var qur="SELECT * FROM tr_term_assesment_overall_assesmentmarks am join "+
  "md_grade_descriptor gd on(am.category=gd.category_check) WHERE school_id='"+req.query.schoolid+"' "+
  " AND academic_year='"+req.query.academicyear+"' AND student_id='"+req.query.studid+"' and am.term_cat_grade=gd.grade and "+
  "am.subject_id=gd.subject_name";
  console.log('.........................Score card....................................');
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.scholasticinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });
});

//fetchcoscholasticmark-service
app.post('/fetchcoscholasticmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};  

  connection.query("SELECT * FROM tr_term_co_assesment_overall_marks WHERE ? AND ? AND ? order by subject_id",[studid,schoolid,academicyear],
    function(err, rows)
    {
    if(!err)
    {
      global.coscholasticinfo=rows;       
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetchcocurricularmark-service
app.post('/fetchcocurricularmark-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};  

  connection.query("SELECT * FROM tr_cocurricular_overallterm_marks WHERE ? AND ? AND ? order by subject_id",[studid,schoolid,academicyear],
    function(err, rows)
    {
    if(!err)
    {  
      global.cocurricularinfo=rows;     
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//term attendance
app.post('/insertattendance-service',  urlencodedParser,function (req,res)
{   
  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         attendance:req.query.attendance,
         working_days:req.query.workingdays,
         generic:req.query.generic,
         speccomment:req.query.specific,
         grade:req.query.grade,
         section:req.query.section                 
  } 
  var qur="SELECT * FROM tr_term_attendance where school_id='"+req.query.schoolid+"' and "+
  "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and class_id='"+req.query.classid+"' and "+
  "student_id='"+req.query.studentid+"'";

  // console.log(qur);
  
connection.query(qur,
function(err, rows)
{
  if(rows.length==0){ 
  connection.query("INSERT INTO tr_term_attendance SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log("error in insert......"+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
}
else
{
  connection.query("UPDATE tr_term_attendance SET ? where school_id='"+req.query.schoolid+"' and "+
  "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and class_id='"+req.query.classid+"' and "+
  "student_id='"+req.query.studentid+"'",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log("error in update......"+err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
}
});
});

//term health
app.post('/inserthealth-service',  urlencodedParser,function (req,res)
{   
  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         height:req.query.height,
         weight:req.query.weight,
         grade:req.query.grade,
         section:req.query.section,
         blood_group:req.query.bloodgroup,
         vision_left:req.query.visionleft,                          
         vision_right:req.query.visionright,
         dental:req.query.dental
  }  

  connection.query("select* from tr_term_health where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"'",
  function(err, rows)
    {
      if(rows.length==0)
      {
  connection.query("INSERT INTO tr_term_health SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
   }
  else
  {
    connection.query("update tr_term_health SET ? where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' ",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

  }
});

});

app.post('/insertphysical-service',  urlencodedParser,function (req,res)
{   

  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         interest_area:req.query.interest,
         identified_talent:req.query.talent,
         grade:req.query.grade,
         section:req.query.section,
         member_of_school:req.query.membership,                          
         competitions_attended:req.query.competition,
         prize_won:req.query.prize
  }  

  connection.query("select* from tr_term_physical_education where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"'",
  function(err, rows)
    {
      if(rows.length==0)
      {
  connection.query("INSERT INTO tr_term_physical_education SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
   }
  else
  {
    connection.query("update tr_term_physical_education SET ? where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' ",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

  }
});

});

app.post('/insertartvertical-service',  urlencodedParser,function (req,res)
{   

  var response={
         school_id: req.query.schoolid, 
         academic_year: req.query.academicyear,         
         term_id:req.query.termname,
         class_id:req.query.classid,
         student_id:req.query.studentid,
         student_name:req.query.studentname,         
         interest_area:req.query.interest,
         identified_talent:req.query.talent,
         grade:req.query.grade,
         section:req.query.section,
         member_of_school:req.query.membership,  
         coaching:req.query.coaching,                        
         competitions_attended:req.query.competition,
         prize_won:req.query.prize
  }  

  connection.query("select* from tr_term_art_verticals where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"'",
  function(err, rows)
    {
      if(rows.length==0)
      {
  connection.query("INSERT INTO tr_term_art_verticals SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'inserted'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
   }
  else
  {
    connection.query("update tr_term_art_verticals SET ? where student_id='"+req.query.studentid+"' and academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and school_id='"+req.query.schoolid+"' ",[response],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': 'updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });

  }
});

});

//fetchhealthattendanceinfo
app.post('/fetchhealthattendanceinfo-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};  
  var academicyear={academic_year:req.query.academicyear}; 
  var qur="select * from tr_term_attendance ta join tr_term_health_copy th on(ta.student_id=th.student_id)"+
  " where ta.student_id='"+req.query.studid+"' "+
  "and ta.school_id='"+req.query.schoolid+"' and  ta.academic_year='"+req.query.academicyear+"' and th.school_id='"+req.query.schoolid+"'";


  var qur1="select * from tr_term_attendance ta join tr_term_health th on(ta.student_id=th.student_id)"+
  " where ta.student_id='"+req.query.studid+"' and ta.term_id=th.term_id "+
  "and ta.school_id='"+req.query.schoolid+"' and  ta.academic_year='"+req.query.academicyear+"' and th.school_id='"+req.query.schoolid+"'";
  
  connection.query(qur,function(err, rows)
    {
      //console.log(qur);
    if(!err)
    {  
      if(rows.length>0){
      global.healthattendanceinfo=rows;     
      res.status(200).json({'returnval': rows});
      }
      else{
        console.log(qur1);
        connection.query(qur1,function(err, rows){
          global.healthattendanceinfo=rows;     
          res.status(200).json({'returnval': rows});
        });
      }

    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetchcoscholasticinfo
app.post('/fetchcoscholasticmetrics-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};  
  var qur="SELECT * FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"'";
  // console.log(qur);
  connection.query(qur,
     function(err, rows)
    {
    if(!err)
    {       
      global.coscholasticmark=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
});
});

//fetch the name for performance report

app.post('/nameforonetofourreport-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};

  connection.query("SELECT id,student_name FROM md_student WHERE ?",[schoolid],
    function(err, rows)
    {
    if(!err)
    {       
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

//fetchcoscholasticinfo
app.post('/fetchcoscholasticinfo-service',  urlencodedParser,function (req,res)
{  

  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid}; 
  var academicyear={academic_year:req.query.academicyear};  
  var qur="SELECT * FROM tr_coscholastic_assesment_marks am join "+
  "md_grade_coscholastic_descriptor gd on(am.sub_category=gd.category) WHERE school_id='"+req.query.schoolid+"' AND student_id='"+req.query.studid+"' and am.category_grade=gd.grade and "+
  "am.subject_id=gd.subject_name";
  console.log('.........................Score card....................................');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
      global.scholasticinfo=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  
  });

//   var schoolid={school_id:req.query.schoolid};
//   var studid={student_id:req.query.studid};  
//   // var qur="SELECT subject_id,round((sum(mark)/count(subject_id))/10,1) as mark FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_name='"+req.query.studname+"' group by subject_id ";
//   var qur="SELECT subject_id,sub_category,mark FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"'";
//   // console.log(qur);
//   connection.query(qur,
//     function(err, rows)
//     {
//     if(!err)
//     {       
//        global.coscholasticinfo=rows;
//       res.status(200).json({'returnval': rows});
//     }
//     else
//     {
//       console.log(err);
//       res.status(200).json({'returnval': 'fail'});
//     }  

// });
});

app.post('/fetchcoscholasticsubcategory-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var studid={student_id:req.query.studid};  
  // var qur="SELECT subject_id,round((sum(mark)/count(subject_id))/10,1) as mark FROM tr_coscholastic_assesment_marks where school_id='"+req.query.schoolid+"' and student_name='"+req.query.studname+"' group by subject_id ";
  var qur="SELECT * FROM tr_coscholastic_sub_category_assesment_marks where school_id='"+req.query.schoolid+"' and student_id='"+req.query.studid+"'";
  // console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {       
global.coscholasticsubmark=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

});
});

app.post('/onetofourreport-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var id={student_id:req.query.student_id}
  

  connection.query("SELECT subject_id,term_name, count(mark) as cnt, category, sum(mark) as val  FROM tr_term_assesment_marks WHERE ? and ? group by category,term_name,subject_id",[schoolid,id],
    function(err, rows)
    {
    if(!err)
    {      
    //console.log(rows); 
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});



app.post('/fetchstudentreport-service',  urlencodedParser,function (req, res)
{
  var qur="select * from tr_term_assesment_marks where  grade='"+req.query.gradename+"' and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and term_name='"+req.query.termname+"'";
  console.log('----------------------------------------fetchreport----------');
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    { 
      
      res.status(200).json({'returnval': rows});
      
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchfareport-service',  urlencodedParser,function (req, res)
{
  var qur="select * from tr_term_fa_assesment_marks where  grade='"+req.query.gradename+"' and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"'  and term_name='"+req.query.termname+"' and category='"+req.query.assesmenttype+"' order by sub_cat_sequence";
  console.log('----------------------------------------fetchreport----------');
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    { 
      
      res.status(200).json({'returnval': rows});
      
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fetchfastudentreport-service',  urlencodedParser,function (req, res)
{
  var flag="";
  var qurcheck="";
  //console.log('com');
  console.log(req.query.roleid);
  if(req.query.roleid=="subject-teacher"||req.query.roleid=="class-teacher"){
    console.log('c');
    flag="0";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmenttype+"' and subject='"+req.query.subject+"' and flag in('0','1')";
  }
  else if(req.query.roleid=="co-ordinator")
  {
    console.log('o');
    flag="1";
  qurcheck="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmenttype+"' and subject='"+req.query.subject+"' and flag in('"+flag+"')";
  }

  var qur="select * from tr_term_fa_assesment_marks where  grade='"+req.query.gradename+"' and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmenttype+"' order by CAST(sub_cat_sequence AS UNSIGNED) ";
  console.log('----------------------------------------fetchreport222----------');
  console.log(qur);
   console.log(qurcheck);

  connection.query(qurcheck,function(err, rows){
    if(!err){
      if(rows.length==0){
        console.log('f');
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
    //  console.log('s'+JSON.stringify(rows));
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
    }
    else{
      console.log('d');
      res.status(200).json({'returnval': 'imported'});
    }
    }
  });
});



app.post('/fetchworkingdays-service',  urlencodedParser,function (req, res)
{
  var qur="select * from md_workingdays where ? and ? and ? and ?";
  console.log(qur);
  var academicyear={academic_year:req.query.academicyear};
  var schoolid={school_id:req.query.schoolid};
  var termname={term_name:req.query.termname};
  var type={type:req.query.grade};
  // console.log(req.query.academicyear+" "+req.query.schoolid+" "+req.query.termname+" "+req.query.type);
  connection.query(qur,[academicyear,schoolid,termname,type],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


app.post('/updateimportmarkcheck-service' ,  urlencodedParser,function (req, res)
{
var qur;
if(req.query.subject=='Hindi'||req.query.subject=='Kannada'){
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"') and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
else{
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
console.log('----------------------------------------------------------');
console.log(qur);
  connection.query(qur,
      function(err, rows)
      {
    if(!err)
    {
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else
      {
      res.status(200).json({'returnval': 'invalid'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
});

app.post('/updatefaimportmarkcheck-service' ,  urlencodedParser,function (req, res)
{
var qur;
console.log(req.query.assesmentid+'  '+req.query.subject);
if(req.query.assesmentid=="FA1"||req.query.assesmentid=="FA2"||req.query.assesmentid=="SA1"||req.query.assesmentid=="FA3"||req.query.assesmentid=="FA4"||req.query.assesmentid=="SA2"){

if(req.query.subject=='Hindi'||req.query.subject=='Kannada'||req.query.subject=='French'||req.query.subject=='sanskrit'||req.query.subject=='III Language Kannada'||req.query.subject=='III Language Hindi'||req.query.subject=='II Language French'){

  console.log("Language");
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_fa_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"' ) and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
else{
  console.log("not Language");
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_fa_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"'))) AS count2)  AS counts";
}
}
else
{
if(req.query.subject=='Hindi'||req.query.subject=='Kannada'){
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_coscholastic_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and category='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"') and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
else{
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_coscholastic_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"'))) AS count2)  AS counts";
} 
}
console.log('----------------------------------------------------------');
console.log(qur);
  connection.query(qur,
      function(err, rows)
      {
    if(!err)
    {
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else
      {
      res.status(200).json({'returnval': 'invalid'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
});
app.post('/updateimportmark-service' ,  urlencodedParser,function (req, res)
{
    var data={
      school_id:req.query.schoolid,
      grade:req.query.gradename,
      section:req.query.sectionname,
      academic_year: req.query.academicyear,
      term_name:req.query.termname,
      assesment_id:req.query.assesmentid,
      subject:req.query.subject,
      flag:0
    };
    var qur="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
    "grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and subject='"+req.query.subject+"' and flag=0";
    console.log('...............update import..........');
    console.log(qur);
    connection.query(qur,
     function(err, rows)
      {
      if(!err)
      {        
      if(rows.length>0)
      {
        res.status(200).json({'returnval': 'exist'});
      }
      else{ 
      connection.query('insert into tr_term_assesment_import_marks set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
      res.status(200).json({'returnval': 'succ'});
      }
    else
    {
      console.log('No data Fetched'+err);
    }
});
  }
}
else
console.log(err);
});
});



app.post('/updatefaimportmark-service' ,  urlencodedParser,function (req, res)
{
    var data={
      school_id:req.query.schoolid,
      grade:req.query.gradename,
      section:req.query.sectionname,
      academic_year: req.query.academicyear,
      term_name:req.query.termname,
      assesment_id:req.query.assesmentid,
      subject:req.query.subject,
      flag:0
    };
    var qur="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
    "grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and subject='"+req.query.subject+"' and flag=0";
    console.log('...............update import..........');
    console.log(qur);
    connection.query(qur,
     function(err, rows)
      {
      if(!err)
      {        
      if(rows.length>0)
      {
        res.status(200).json({'returnval': 'exist'});
      }
      else{ 
      connection.query('insert into tr_term_fa_assesment_import_marks set ?',[data],
      function(err, rows)
      {
      if(!err)
      {
      res.status(200).json({'returnval': 'succ'});
      }
    else
    {
      console.log('No data Fetched'+err);
    }
});
  }
}
else
console.log(err);
});
});

app.post('/auditterm-service' ,  urlencodedParser,function (req, res)
{
var querycheck='';
var insertqur='';
var updatequr='';
var updateval='';
var response={
  school_id:req.query.schoolid,
  academic_year:req.query.academicyear,
  term_name:req.query.termname,
  grade:req.query.gradename,
  section:req.query.sectionname,
  subject_id:req.query.subject,
  assesment_level2:req.query.assesmentid
};

if(req.query.assesmentid=='Assesment1'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='"+req.query.assesmentid+"'  and subject_id='"+req.query.subject+"'";  
insertqur="insert into tr_term_auditimport set ?";
}
else if(req.query.assesmentid=='Assesment2'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment1'  and subject_id='"+req.query.subject+"'";  
// response.assesment_level2='Assesment1';
updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment1'  and subject_id='"+req.query.subject+"'";
updateval={assesment_level2:req.query.assesmentid};
}
else if(req.query.assesmentid=='Assesment3'){
qurcheck="select * from tr_term_auditimport where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment2'  and subject_id='"+req.query.subject+"'";  
// response.assesment_level2='Assesment2';
updatequr="update tr_term_auditimport set ? where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_level2='Assesment2'  and subject_id='"+req.query.subject+"'";  
updateval={assesment_level2:req.query.assesmentid};
}

 console.log('------------audit term check-----------------------');
 console.log(qurcheck);
 console.log('------------audit term insert----------------------');
 console.log(insertqur);
 console.log('------------audit term update----------------------');
 console.log(updatequr);

  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(req.query.assesmentid=='Assesment1'){
    if(rows.length==0){
      connection.query(insertqur,[response],function(err, result){
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      console.log(err);
      res.status(200).json({'returnval': 'not updated'});
      }
      });
    }
    
    else
      res.status(200).json({'returnval': 'exist'});
    }
    else{
      if(rows.length==1){
      connection.query(updatequr,[updateval],function(err, result){
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      console.log(err);
      res.status(200).json({'returnval': 'not updated'});
      }
      });
      }
      else
       res.status(200).json({'returnval': 'not exist'}); 
    }    
    }  
    else
      console.log(err);
    
  });
});


app.post('/updateflag-service' ,  urlencodedParser,function (req, res)
{    
 var qurcheck="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 var qur="update tr_term_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
  
 console.log('--------------Query check in update flag------------------');
 console.log(qurcheck);
 console.log('----------------------------------------------------------');
 console.log('--------------Query in update flag------------------');
 console.log(qur);
 console.log('----------------------------------------------------');
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0){
    connection.query(qur,function(err, result){
    if(!err)
    {
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      res.status(200).json({'returnval': 'not updated'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});


app.post('/updatefaflag-service' ,  urlencodedParser,function (req, res)
{    
 var qurcheck="select * from tr_term_fa_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 var qur="update tr_term_fa_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
  
 console.log('--------------Query check in update flag------------------');
 console.log(qurcheck);
 console.log('----------------------------------------------------------');
 console.log('--------------Query in update flag------------------');
 console.log(qur);
 console.log('----------------------------------------------------');
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0){
    connection.query(qur,function(err, result){
    if(!err)
    {
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      res.status(200).json({'returnval': 'not updated'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});


app.post('/approvemark-service',  urlencodedParser,function (req, res)
{

//var qur="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"'";
var checkqur="select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='co-ordinator'";

var qur1="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' "+
"and grade in(select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='co-ordinator'))";

var qur2="select * from tr_term_fa_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' "+
"and grade in(select grade_name from md_grade where grade_id in(select grade_id from mp_teacher_grade where "+ 
"id='"+req.query.loggedid+"' and role_id='co-ordinator'))";

console.log('............................................');
console.log(checkqur);
console.log('............................................');
var resp={
  flag:""
};
connection.query(checkqur,function(err, rows){
  if(rows.length>0){
    for(var i=0;i<rows.length;i++){
      if(rows[i].grade_id=='g1'||rows[i].grade_id=='g2'||rows[i].grade_id=='g3'||rows[i].grade_id=='g4')
        resp.flag=1;
      else
        resp.flag=0;
    }
  }
  console.log('response flag...........'+resp.flag);
  if(resp.flag==1){
  connection.query(qur1,function(err, rows)
    {
      console.log(qur1);
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
  }
  if(resp.flag==0){
    console.log(qur2);
  connection.query(qur2,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
  }
});
});


app.post('/fetchimportmark-service',  urlencodedParser,function (req, res)
{
  var flag="";
  var qurcheck="";
  if(req.query.roleid=="subject-teacher"||req.query.roleid=="class-teacher"){
    flag="0";
  qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.term+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in('0','1')";
  }
  else if(req.query.roleid=="co-ordinator")
  {
    flag="1";
  qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  " and term_name='"+req.query.term+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in('"+flag+"')";
  }

  // var qurcheck="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
  // "grade='"+req.query.gradename+"' and section='"+req.query.section+"' and academic_year='"+req.query.academicyear+"' "+
  // " and term_name='"+req.query.term+"' and assesment_id='"+req.query.assesment+"' and subject='"+req.query.subject+"' and flag in('"+flag+"')";

  console.log('Query check........');
  console.log(qurcheck);
  console.log('...................');

  var qur="select * from tr_term_assesment_marks where academic_year='"+req.query.academicyear+"' and grade='"+req.query.gradename+"'and section ='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and term_name='"+req.query.term+"' order by CAST(sub_cat_sequence AS UNSIGNED)";
  //console.log(qur);
  connection.query(qurcheck,function(err, rows){
    if(!err){
      if(rows.length==0){
  connection.query(qur,function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
    }
    else{
      res.status(200).json({'returnval': 'imported'});
    }
    }
  });
});

app.post('/updatemark-service' ,  urlencodedParser,function (req, res)
{
  // console.log('come');
  var qur="update tr_term_assesment_marks set mark='"+req.query.mark+"' where academic_year='"+req.query.academic+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and school_id='"+req.query.schoolid+"' and subject_id='"+req.query.subject+"' and assesment_id='"+req.query.assesment+"' and term_name='"+req.query.term+"' and academic_year='"+req.query.academic+"' and category='"+req.query.category+"' and sub_category='"+req.query.sub_category+"' and student_id='"+req.query.studid+"'";
      console.log(qur);
      connection.query(qur,
        function(err, result)
        {
        if(!err)
    {
      console.log('s');
      if(result.affectedRows>0){
        res.status(200).json('succ');
      }
      else
        res.status(200).json('fail');
    }
    else
    {
      console.log('No data Fetched'+err);
    }
  });
});


app.post('/fetchtermmarkforreport-service' ,  urlencodedParser,function (req, res)
{
  
    var qur="select term_name,assesment_id,student_id,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as term_grade,"+
    "subject_id from tr_term_assesment_overall_marks where subject_id='"+req.query.subject+"' and school_id='"+req.query.schoolid+"' "+ 
    "and academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    "group by subject_id,term_name,assesment_id,student_id order by student_id";

//     var qur="select ta.term_name,ta.assesment_id,ta.student_id,(SELECT grade FROM md_grade_rating WHERE "+
// "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade,"+
// "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
// "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
// "where ta.subject_id='"+req.query.subject+"' and ta.school_id='"+req.query.schoolid+"' and ta.academic_year='"+req.query.academicyear+"' "+
// "and ta.grade='"+req.query.grade+"' and ta.section='"+req.query.section+"' "+
// "group by ta.subject_id,ta.term_name,ta.assesment_id,ta.student_id ";

console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      console.log('yessssssssssssssssssssss');
      res.status(200).json({'returnval': rows});
    }
    else
    {
      // console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/fetchbeginnermark-service' ,  urlencodedParser,function (req, res)
{
  
    var qur="select distinct(student_id),score,grade,subject_id from tr_beginner_assesment_marks where subject_id='"+req.query.subject+"' and school_id='"+req.query.schoolid+"' "+ 
    "and academic_year='"+req.query.academicyear+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id='"+req.query.section+"' and school_id='"+req.query.schoolid+"') "+
    " order by student_id";

//     var qur="select ta.term_name,ta.assesment_id,ta.student_id,(SELECT grade FROM md_grade_rating WHERE "+
// "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade,"+
// "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
// "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
// "where ta.subject_id='"+req.query.subject+"' and ta.school_id='"+req.query.schoolid+"' and ta.academic_year='"+req.query.academicyear+"' "+
// "and ta.grade='"+req.query.grade+"' and ta.section='"+req.query.section+"' "+
// "group by ta.subject_id,ta.term_name,ta.assesment_id,ta.student_id ";

console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      console.log('yessssssssssssssssssssss');
      res.status(200).json({'returnval': rows});
    }
    else
    {
      // console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/fetchbeginnermarkforreport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select ta.term_name,ta.assesment_id,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(ta.rtotal),1) and higher_limit>=round(avg(ta.rtotal),1)) as term_grade, "+
    "ta.subject_id,ba.grade as beginner_grade from tr_term_assesment_overall_marks ta "+
    "join tr_beginner_assesment_marks ba on(ta.subject_id=ba.subject_id) "+
    "group by ta.subject_id,ta.term_name,ta.assesment_id ";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/categorywisereport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,category,sub_category,round(mark,1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(mark,1) and higher_limit>=round(mark,1)) as grade "+
    "from tr_term_assesment_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,category,sub_category,student_id order by CAST(sub_cat_sequence AS UNSIGNED)";
    console.log('...............................subjectwise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/categorywisereportfordataanalysis-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,category,sub_category,round(mark,1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(mark,1) and higher_limit>=round(mark,1)) as grade "+
    "from tr_term_assesment_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,category,sub_category,student_id order by CAST(sub_cat_sequence AS UNSIGNED)";
    console.log('...............................categorywise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/subjectwisereport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,assesment_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and subject_id='"+req.query.subject+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by assesment_id,student_id";
    console.log('...............................subjectwise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/assesmentwisereport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,round(avg(rtotal),1) as mark,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesment+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,student_id";
    console.log('...............................assessmentwise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/termwisereport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select assesment_id,student_id,subject_id,avg(rtotal),(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by assesment_id,subject_id,student_id";
    
    console.log('......................termwise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/teacherid-service' ,  urlencodedParser,function (req, res)
{ 
  var qur;
 var schol={school_id:req.query.schoolid};
 var teacherid=req.query.id;
 var role={role_id:req.query.roleid};
 console.log(req.query.roleid);
 if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
  qur="select DISTINCT id,name,password from md_employee where id!='"+req.query.id+"' and school_id='"+req.query.schoolid+"' and role_id='subject-teacher' and id in (select id from mp_teacher_grade where grade_id in (select grade_id from mp_teacher_grade where id='"+req.query.id+"' and role_id='"+req.query.roleid+"'))";

 }
 else  if(req.query.roleid=="headofedn")
 {
  qur="select DISTINCT id,name,password from md_employee where id!='"+req.query.id+"' and id in(select name from tr_teacher_observation_flag where flag='1') and school_id='"+req.query.schoolid+"'  and role_id='subject-teacher'";
 }
  else  if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
  qur="select DISTINCT id,name,password from md_employee where id!='"+req.query.id+"' and id in(select name from tr_teacher_observation_flag where flag='0') and school_id='"+req.query.schoolid+"'  and role_id='subject-teacher'";
 }
 console.log(qur);
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
     // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});
app.post('/observername-service' ,  urlencodedParser,function (req, res)
{ 
var observersid={name:req.query.id};
var observersid1={name:req.query.id1};
var observersid2={name:req.query.id2};
console.log(observersid);
console.log(observersid1);
console.log(observersid2);
var qur="select name,role_id from md_employee where (id='"+req.query.id+"' or id='"+req.query.id1+"' or id='"+req.query.id2+"') and role_id not in('subject-teacher')";
console.log('.................................................');
console.log(qur);
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/observerdescriptor-service' ,  urlencodedParser,function (req, res)
{ 

connection.query("select * from md_observer_descriptor",
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});




app.post('/teachergrade-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

var schol={school_id:req.query.schoolid};
 var teacherid={id:req.query.id};
 if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
  qur="select  distinct grade_id as gid,(select grade_name from md_grade where grade_id=gid) as gradename from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and role_id='subject-teacher'"

}
else  if(req.query.roleid=="headofedn")
 {
  qur="select  distinct grade_id as gid,(select grade_name from md_grade where grade_id=gid) as gradename from mp_teacher_grade where grade_id in(select grade from tr_teacher_observation_flag where flag='1' and name='"+req.query.id+"') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and role_id='subject-teacher'"

}
else  if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
  qur="select  distinct grade_id as gid,(select grade_name from md_grade where grade_id=gid) as gradename from mp_teacher_grade where grade_id in(select grade from tr_teacher_observation_flag where flag='0' and name='"+req.query.id+"') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and role_id='subject-teacher'"

}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/teachersection-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

var schol={school_id:req.query.schoolid};
 var teacherid={id:req.query.id};
 var gradeid={grade_id:req.query.gradeid};
  if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
    qur="select  distinct section_id from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and role_id='subject-teacher'";
 }
else if(req.query.roleid=="headofedn")
 {
  qur="select  distinct section_id from mp_teacher_grade where section_id in (select section from tr_teacher_observation_flag where name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and flag='1') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and role_id='subject-teacher'";
}
else if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
  qur="select  distinct section_id from mp_teacher_grade where section_id in (select section from tr_teacher_observation_flag where name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and flag='0') and school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and role_id='subject-teacher'";
}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});




app.post('/teachersubject-service' ,  urlencodedParser,function (req, res)
{ 
    var qur;
var schol={school_id:req.query.schoolid};
 var teacherid={id:req.query.id};
 var gradeid={grade_id:req.query.gradeid};
 var sectionid={section_id:req.query.sectionid};
 if(req.query.roleid=="co-ordinator"||req.query.roleid=="headmistress")
 {
qur= "select  DISTINCT subject_id as sid,(select subject_name from md_subject where subject_id= sid) as subjectname from mp_teacher_grade where school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and role_id='subject-teacher'";
}
else if(req.query.roleid=="headofedn")
 {
qur= "select DISTINCT subject_id as sid,(select subject_name from md_subject where subject_id= sid) as subjectname from mp_teacher_grade where  subject_id in (select subject from tr_teacher_observation_flag where flag='1' and name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and section='"+req.query.sectionid+"') and  school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and role_id='subject-teacher'";
}
else if(req.query.roleid=="principal"||req.query.roleid=="viceprincipal")
 {
qur= "select DISTINCT subject_id as sid,(select subject_name from md_subject where subject_id= sid) as subjectname from mp_teacher_grade where  subject_id in(select subject from tr_teacher_observation_flag where flag='0' and name='"+req.query.id+"' and grade='"+req.query.gradeid+"' and section='"+req.query.sectionid+"') and  school_id='"+req.query.schoolid+"' and id='"+req.query.id+"' and grade_id='"+req.query.gradeid+"' and section_id='"+req.query.sectionid+"' and role_id='subject-teacher'";
}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});



app.post('/observermarkflag-service' ,  urlencodedParser,function (req, res)
{ 
var schol={school_id:req.query.schoolid};
 var teacherid={name:req.query.id};
 var gradeid={grade:req.query.gradeid};
 var sectionid={section:req.query.sectionid};
 var subjectid={subject:req.query.subjectid};
connection.query("select * from tr_teacher_observation_flag where ? and ? and ? and ? and ?",[schol,teacherid,gradeid,sectionid,subjectid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/observerscore-service',  urlencodedParser,function (req, res)
{  
  var response={
         
         description_id:req.query.desid,
         score:req.query.score,
         teacher_id:req.query.teacherid,
         observer_id:req.query.observerid,
         role:req.query.roleid,
         grade:req.query.grade,
         section:req.query.section,
         subject:req.query.subject,   
                              
  }
  connection.query("INSERT INTO tr_teacher_observation_mark set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fnfinalbook-service',  urlencodedParser,function (req, res)
{  
  var response={
         school_id:req.query.schoolid,
         academic_year:req.query.academic_year,
         capter_id:req.query.chapterid,
         subject_id:req.query.subjectid,
         grade_id:req.query.gradeid,
         completion_date:req.query.completion_date,
         completion:req.query.status,   
         section_id:req.query.sectionid,   
         emp_id:req.query.empid,   
         skill:req.query.skill,   
         innovation:req.query.innovation,   
         enrichment_sug:req.query.enrichmentsuggest, 
         planning_date:req.query.planneddate,   
         period:req.query.period,   
         concept:req.query.concept,   
         remark:req.query.remark,   
         concept_id:req.query.conceptid,
       }

/*console.log("----------------");
console.log(response);
console.log("----------------");
*/
  connection.query("INSERT INTO final_book_sug set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fnstn-service' ,urlencodedParser,function (req, res)
{ 
 var teacherid={tracher_id:req.query.staffid};
 var gradeid={grade:req.query.grid};
 var sectionid={section:req.query.secid};
 var subjectid={subject:req.query.sid};
  // console.log(teacherid);
  // console.log(gradeid);
  // console.log(sectionid);
  // console.log(subjectid);


connection.query("select * from tr_teacher_observation_strength where ? and ? and ? and ?",[teacherid,gradeid,sectionid,subjectid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});




app.post('/fnstrength-service',  urlencodedParser,function (req, res){


  var response={  
     role:req.query.rid,
     observer_id:req.query.obid,
     tracher_id:req.query.staffid,
     grade:req.query.grid,
     section:req.query.secid,
     subject:req.query.sid,
     Strength:req.query.Strength, 
     Areas:req.query.Areas,   
     Innovation:req.query.Innovation,
     comment:req.query.comment,              
                   
  }
  //console.log(response);
  connection.query("INSERT INTO tr_teacher_observation_strength set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/observerinsertflag-service',  urlencodedParser,function (req, res)
{  
  var response={
         
         school_id:req.query.schoolid,
         name:req.query.id,
         grade:req.query.gradeid,
         section:req.query.sectionid,
         subject:req.query.subjectid,
         flag:req.query.flag                    
  }
  connection.query("INSERT INTO tr_teacher_observation_flag set ?",[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/observerupdateflag-service',  urlencodedParser,function (req, res)
{  
       
       var schol= {school_id:req.query.schoolid};
       var name={name:req.query.id};
       var grade={grade:req.query.gradeid};
        var section={section:req.query.sectionid};
        var subject={subject:req.query.subjectid};
        var flag={flag:req.query.flag};                    
  
  connection.query(" update tr_teacher_observation_flag set ? where ? and ? and ? and ? and ?",[flag,schol,name,grade,section,subject],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'succ'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/fetchobservermark-service' ,  urlencodedParser,function (req, res)
{ 
 var teacherid={teacher_id:req.query.id};
 var gradeid={grade:req.query.gradeid};
 var sectionid={section:req.query.sectionid};
 var subjectid={subject:req.query.subjectid};
connection.query("select * from tr_teacher_observation_mark where ? and ? and ? and ?",[teacherid,gradeid,sectionid,subjectid],
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});
app.post('/mailreportcard-service' ,  urlencodedParser,function (req, res)
{
        var adterm1="";
        var adterm2="";
        var adterm3="";
        var wdterm1="";
        var wdterm2="";
        var wdterm3="";
        var pterm1="";
        var pterm2="";
        var pterm3="";
        var t1height="";
        var t2height="";
        var t3height="";
        var t1weight="";
        var t2weight="";
        var t3weight="";
        var generic="";
        var specific="";

        var img1="./app/images/"+req.query.loggedid+req.query.schoolid+".jpg";
        var img2="./app/images/principal"+req.query.schoolid+".jpg";

        console.log('.........................healthattendanceinfo....................................');
        console.log(global.healthattendanceinfo.length);
        console.log('.................................................................................');

        if(global.healthattendanceinfo.length==1||global.healthattendanceinfo.length==2||global.healthattendanceinfo.length==3){
        adterm1=global.healthattendanceinfo[0].attendance;
        wdterm1=global.healthattendanceinfo[0].working_days;
        pterm1=parseFloat((global.healthattendanceinfo[0].attendance/global.healthattendanceinfo[0].working_days)*100).toFixed(2)+"%";
        t1height=global.healthattendanceinfo[0].height+"cm";
        t1weight=global.healthattendanceinfo[0].weight+"kg"; 
        generic=global.healthattendanceinfo[0].generic; 
        specific=global.healthattendanceinfo[0].speccomment;        
        }
        if(global.healthattendanceinfo.length==2){
        adterm2=global.healthattendanceinfo[1].attendance;
        wdterm2=global.healthattendanceinfo[1].working_days;
        pterm2=parseFloat((global.healthattendanceinfo[1].attendance/global.healthattendanceinfo[1].working_days)*100).toFixed(2)+"%";
        t2height=global.healthattendanceinfo[1].height+"cm";
        t2weight=global.healthattendanceinfo[1].weight+"kg";
        generic=global.healthattendanceinfo[1].generic; 
        specific=global.healthattendanceinfo[1].speccomment; 
        }
        if(global.healthattendanceinfo.length==3){
        adterm3=global.healthattendanceinfo[2].attendance; 
        wdterm3=global.healthattendanceinfo[2].working_days;
        pterm3=parseFloat((global.healthattendanceinfo[2].attendance/global.healthattendanceinfo[2].working_days)*100).toFixed(2)+"%";
        t3height=global.healthattendanceinfo[2].height+"cm";
        t3weight=global.healthattendanceinfo[2].weight+"kg";
        generic=global.healthattendanceinfo[2].generic; 
        specific=global.healthattendanceinfo[2].speccomment; 
        }

        var engarr=[];
        var matharr=[];
        var evsarr=[];
        var hinarr=[];
        var comarr=[];
        var gkarr=[];
        var acarr=[];
        var mdarr=[];
        var gamearr=[];
        var parr=[];
        var dancearr=[];
        
        for(var i=0;i<global.scholasticinfo.length;i++){          
          var obj={"category":"","t1grade":"","t2grade":"","t3grade":"","comment":""};          
          if(global.scholasticinfo[i].subject_name=="English"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;    
            engarr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="Mathematics"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            matharr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="EVS"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            evsarr.push(obj);
          }
          if((global.scholasticinfo[i].subject_name).trim()=="Hindi"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            hinarr.push(obj);
          }
           if((global.scholasticinfo[i].subject_name).trim()=="Kannada"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            hinarr.push(obj);
          }
          if((global.scholasticinfo[i].subject_name).trim()=="Computer"){            
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            comarr.push(obj);            
          }          
          if(global.scholasticinfo[i].subject_name=="GK"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            gkarr.push(obj);
          }          
                   
          if(global.scholasticinfo[i].subject_name=="Art&Craft"){            
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;     
            acarr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="music"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            mdarr.push(obj);
          }
          if(global.scholasticinfo[i].subject_name=="dance"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            dancearr.push(obj);
          }

          if(global.scholasticinfo[i].subject_name=="Games"){
            obj.category=global.scholasticinfo[i].category;
            obj.comment=global.scholasticinfo[i].description;
            if(global.scholasticinfo[i].term_name=="term1")
            obj.t1grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term2")
            obj.t2grade=global.scholasticinfo[i].term_cat_grade;
            if(global.scholasticinfo[i].term_name=="term3")
            obj.t3grade=global.scholasticinfo[i].term_cat_grade;
            gamearr.push(obj);
          }

        if(global.scholasticinfo[i].subject_name=="Personality Development"){ 
          obj.category=global.scholasticinfo[i].category; 
          obj.comment=global.scholasticinfo[i].description;      
          if(global.scholasticinfo[i].term_name=="term1"){            
          obj.t1grade=global.scholasticinfo[i].term_cat_grade;
          }
          if(global.scholasticinfo[i].term_name=="term2"){            
          obj.t2grade=global.scholasticinfo[i].term_cat_grade;
          }
          if(global.scholasticinfo[i].term_name=="term3"){            
          obj.t3grade=global.scholasticinfo[i].term_cat_grade;
          }
          parr.push(obj);          
        }
       }



       var et1="";
       var et2="";
       var et3="";
       var mt1="";
       var mt2="";
       var mt3="";
       var evt1="";
       var evt2="";
       var evt3="";
       var ht1="";
       var ht2="";
       var ht3="";
       var ct1="";
       var ct2="";
       var ct3="";
       var gt1="";
       var gt2="";
       var gt3="";
       var at1="";
       var at2="";
       var at3="";
       var mdt1="";
       var mdt2="";
       var mdt3="";
       var gat1="";
       var gat2="";
       var gat3="";
       var pdt1="";
       var pdt2="";
       var pdt3="";
       var dant1="";
       var dant2="";
       var dant3="";
       for(var i=0;i<global.overalltermwisegrade.length;i++){
                  
          if(global.overalltermwisegrade[i].subject_id=="English"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            et1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            et2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            et3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Mathematics"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            mt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            mt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            mt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="EVS"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            evt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            evt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            evt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Hindi"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            ht1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            ht2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            ht3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Kannada"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            ht1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            ht2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            ht3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Computer"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            ct1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            ct2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            ct3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="GK"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            gt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            gt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            gt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Art&Craft"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            at1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            at2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            at3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="music"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            mdt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            mdt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            mdt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="dance"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            dant1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            dant2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            dant3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Games"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            gat1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            gat2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            gat3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          if(global.overalltermwisegrade[i].subject_id=="Personality Development"){      
            if(global.overalltermwisegrade[i].term_name=="term1")
            pdt1=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term2")
            pdt2=global.overalltermwisegrade[i].grade;
            if(global.overalltermwisegrade[i].term_name=="term3")
            pdt3=global.overalltermwisegrade[i].grade;   
            // engarr.push(obj);
          }
          }
         

    console.log('....................schoolname.........................');
    console.log(req.query.schoolname+"   "+req.query.academicyear); 
    console.log('.......................................................');
    var header = "<table class='logo' style='width:100%;height: 15%; margin-top: 4%;'><tr><th><img src='./app/images/zeesouth.png' height='100px' width='100px'></img></th><th>"
    header += "<img src='./app/images/mount.png' height='110px' width='200px' style='margin-left:100px'></img><center><p>"+req.query.schoolname+"</p>ACHIEVEMENT RECORD("+req.query.academicyear+")</center></th>"
    header += "<th><img src='./app/images/zee.gif' height='100px' width='100px'></img></th></tr></table><br>"
    header += "<div class='saph' style='margin-left: 3%;'><img src='./app/images/saph.jpg' height='120px' width='630px'></img></div>";

    var studinfo= "<table class='studentinfo' style='border-collapse: collapse;width:95%;height: 10%;margin-left: 3%;margin-top: 5%;'><tr><th align='left'>Student Name: </th>"
    studinfo += "<th align='left' colspan='3' style='background-color: white;'>"+global.studentinfo[0].student_name+"</th></tr><tr style='height: 10px;'><th colspan='4'></th></tr><tr>"
    studinfo += "<th align='left'>Parent Name: </th><th align='left' colspan='3' style='background-color: white;'>"+global.studentinfo[0].parent_name+"</th></tr><tr style='height: 10px;'><th colspan='4'></th></tr><tr><th align='left'>Class: </th>";    
    studinfo += "<th align='left' style='background-color: white;'>"+global.healthattendanceinfo[0].grade+"&nbsp;&nbsp;"+global.healthattendanceinfo[0].section+"</th><th align='left'>Admission No: </th><th align='left' style='background-color: white;'>"+global.studentinfo[0].student_id+"</th></tr></table> <br><br><br>";
     
    var attendance= "<table style='border-collapse: collapse;width:95%;height: 15%; margin-left: 3%;margin-top: 5%;' class='attendance'><tr><th style='width: 25%;'>Attendance</th><th colspan='2' style='width: 25%;'>Term1</th><th colspan='2' style='width: 25%;'>Term2</th><th colspan='2' style='width: 25%;'>Term3</th></tr>"
    attendance += "<tr style='height: 10px;'><th colspan='7'></th></tr><tr><td style='width: 25%;'>Total Attended Days</td><td align='right' style='width: 13%;'>"+adterm1+"</td>"
    attendance += "<td rowspan='2' align='right'><div class='fab'>"+pterm1+"</div></td><td align='right' style='width: 13%;'>"+adterm2+"</td>"
    attendance += "<td rowspan='2' align='right'><div class='fab'>"+pterm2+"</div></td><td align='right' style='width: 13%;'>"+adterm3+"</td>"
    attendance += "<td rowspan='2' align='right'><div class='fab'>"+pterm3+"</div></td></tr><tr style='height: 10px;'><th colspan='7'></th></tr>"
    attendance += "<tr><td style='width: 25%;'>Total Working Days</td><td align='right' style='width: 13%;'>"+wdterm1+"</td>"
    attendance += "<td align='right' style='width: 13%;'>"+wdterm2+"</td><td align='right' style='width: 13%;'>"+wdterm3+"</td></tr></table><br><br><br>"
    attendance += "<table  style='width: 95%;margin-left: 3%;' class='general'> <tr><th style='width: 25%;'>General Feedback: </th><th style='background-color: white;'>"+generic+"</th></tr></table><br><br>"
    attendance += "<table  style='width: 95%;margin-left: 3%;' class='specific'> <tr><th style='width: 25%;'>Specific Feedback: </th><th style='background-color: white;'>"+specific+"</th></tr></table><br><br><br><br><br>";


    var signature= "<table  style='width: 650px;margin-left:10px;' class='signature'>"
    signature +="<tr><th style='text-align:center;'><img width='100px' height='45px' src='"+img1+"'></th><th width='100px'></th><th style='text-align:center;'><img width='100px' height='45px' src='"+img2+"'></th><th></th></tr>"
    signature += "<tr><th>----------------------------------------</th><th></th><th>---------------------------------------</th><th></th>"
    signature += "<th>----------------------------------------</th><th></th></tr><tr><th><center>Class Teacher</center></th><th></th><th><center>Principal</center></th><th></th><th><center>Parent</center></th><th></th></tr></table><br><br><br><br>";

    console.log('signature done....');

    var clr;
    var subjecteng = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #4d94ff;'><th style='width: 35%;'>ENGLISH</th><th style='width:5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width:50%;'>Comments</th></tr>"
    subjecteng += "<tr style='background: #4d94ff;'><th style='width: 35%;text-align: center;'></th><th style='width:5%;text-align:center;'>"+et1+"</th><th style='width: 5%;text-align: center;' >"+et2+"</th><th style='width: 5%;text-align: center;'>"+et3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<engarr.length; i++) {
    if(i%2!=0){
    subjecteng += "<tr class='eng' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+engarr[i].category+"</th><th style='width: 5%;'>"
    subjecteng += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+engarr[i].comment+"</th></tr>"  
    }else{ 
    subjecteng += "<tr class='eng' style='background:#b3d1ff'><th style='width: 35%;text-align: left;'>"+engarr[i].category+"</th><th style='width: 5%;'>"
    subjecteng += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+engarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+engarr[i].comment+"</th></tr>"
    }
    }
    subjecteng += "</table>";

    console.log('eng done....');

    var subjectmath = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #86b300;'><th style='width: 35%;' >MATHEMATICS</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectmath += "<tr style='background: #86b300;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+mt1+"</th><th style='width: 5%;text-align:center;'>"+mt2+"</th><th style='width: 5%;text-align: center;'>"+mt3+"</th><th style='width:50%;text-align: left;'></th></tr>"
    for(var i=0; i<matharr.length; i++) {
    if(i%2!=0)
    {
    subjectmath += "<tr class='math' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+matharr[i].category+"</th><th style='width: 5%;'>"
    subjectmath += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+matharr[i].comment+"</th></tr>"
    }
    else{
    subjectmath += "<tr class='math' style='background:#dfff80'><th style='width: 35%;text-align: left;'>"+matharr[i].category+"</th><th style='width: 5%;'>"
    subjectmath += "<div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+matharr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+matharr[i].comment+"</th></tr>"
    }
    }
    subjectmath += "</table>";

    console.log('math done....');

    var subjectevs = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #ffad33;'><th style='width: 35%;'>EVS</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectevs += "<tr style='background: #ffad33;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+evt1+"</th><th style='width: 5%;text-align: center;'>"+evt2+"</th><th style='width: 5%;text-align: center;'>"+evt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<evsarr.length; i++) {
    if(i%2!=0)
    subjectevs += "<tr class='evs' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+evsarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+evsarr[i].comment+"</th></tr>"
    else
    subjectevs += "<tr class='evs' style='background:#ffd699'><th style='width: 35%;text-align: left;'>"+evsarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+evsarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+evsarr[i].comment+"</th></tr>"
    }
    subjectevs += "</table>";

    console.log('evs done....');

    var subjecthindi = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #ac39ac;'><th style='width: 35%;'>HINDI/KANNADA(II Language)</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjecthindi += "<tr style='background: #ac39ac;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+ht1+"</th><th style='width: 5%;text-align: center;'>"+ht2+"</th><th style='width: 5%;text-align: center;'>"+ht3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<hinarr.length; i++) {
    if(i%2!=0)
    subjecthindi += "<tr class='hin' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+hinarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+hinarr[i].comment+"</th></tr>"
    else
    subjecthindi += "<tr class='hin' style='background:#d98cd9'><th style='width: 35%;text-align: left;'>"+hinarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+hinarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+hinarr[i].comment+"</th></tr>"
    }
    subjecthindi += "</table>";

    console.log('hindi done....');

    var subjectcomputer = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #4d94ff;'><th style='width: 35%;'>COMPUTER SCIENCE</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectcomputer += "<tr style='background: #4d94ff;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+ct1+"</th><th style='width: 5%;text-align: center;'>"+ct2+"</th><th style='width: 5%;text-align: center;'>"+ct3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<comarr.length; i++) {
    if(i%2!=0)
    subjectcomputer += "<tr class='comp' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+comarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+comarr[i].comment+"</th></tr>"
    else
    subjectcomputer += "<tr class='comp' style='background:#b3d1ff'><th style='width: 35%;text-align: left;'>"+comarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+comarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+comarr[i].comment+"</th></tr>"
    }
    subjectcomputer += "</table>";

    console.log('computer done....');

    var subjectgk = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background: #ac39ac;'><th style='width: 35%;'>GENERAL KNOWLEDGE</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectgk += "<tr style='background: #ac39ac;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+gt1+"</th><th style='width: 5%;text-align: center;'>"+gt2+"</th><th style='width: 5%;text-align: center;'>"+gt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<gkarr.length; i++) {
    if(i%2!=0)
    subjectgk += "<tr class='gk' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+gkarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gkarr[i].comment+"</th></tr>"
    else
    subjectgk += "<tr class='gk' style='background:#ffd699'><th style='width: 35%;text-align: left;'>"+gkarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gkarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gkarr[i].comment+"</th></tr>"
    }
    subjectgk += "</table>";

    console.log('gk done....');

    var subjectartcraft = "<table style='width: 95%;margin-left: 3%;' class='subject'> <tr style='background: #86b300;'><th style='width: 35%;'>ART/CRAFT</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectartcraft += "<tr style='background: #86b300;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+at1+"</th><th style='width: 5%;text-align: center;'>"+at2+"</th><th style='width: 5%;text-align: center;'>"+at3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<acarr.length; i++) {
    if(i%2!=0)
    subjectartcraft += "<tr class='art' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+acarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+acarr[i].comment+"</th></tr>"
    else
    subjectartcraft += "<tr class='art' style='background:#dfff80'><th style='width: 35%;text-align: left;'>"+acarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+acarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+acarr[i].comment+"</th></tr>"
    }
    subjectartcraft += "</table>";

    console.log('artcraft done....');

    var subjectmusic = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background:  #ac39ac;'><th style='width: 35%;'>MUSIC</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectmusic += "<tr style='background: #ac39ac;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+mdt1+"</th><th style='width: 5%;text-align: center;'>"+mdt2+"</th><th style='width: 5%;text-align: center;'>"+mdt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<mdarr.length; i++) {
    if(i%2!=0)
    subjectmusic += "<tr class='music' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+mdarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+mdarr[i].comment+"</th></tr>"
    else
    subjectmusic += "<tr class='music' style='background:#d98cd9'><th style='width: 35%;text-align: left;'>"+mdarr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+mdarr[i].comment+"</th></tr>"
    }
    subjectmusic += "</table>";

    console.log('music done....');

    var subjectdance = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background:  #ffad33;'><th style='width: 35%;'>DANCE</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectdance += "<tr style='background: #ffad33;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+dant1+"</th><th style='width: 5%;text-align: center;'>"+dant2+"</th><th style='width: 5%;text-align: center;'>"+dant3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<dancearr.length; i++) {
    if(i%2!=0)
    subjectdance += "<tr class='music' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+dancearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+dancearr[i].comment+"</th></tr>"
    else
    subjectdance += "<tr class='music' style='background:#ffad33'><th style='width: 35%;text-align: left;'>"+dancearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+mdarr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+dancearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+dancearr[i].comment+"</th></tr>"
    }
    subjectdance += "</table>";

    var subjectgames = "<table style='width: 95%;margin-left: 3%;' class='subject'> <tr style='background: #4d94ff;'><th style='width: 35%;'>GAMES</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectgames += "<tr style='background: #4d94ff;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+gat1+"</th><th style='width: 5%;text-align: center;'>"+gat2+"</th><th style='width: 5%;text-align: center;'>"+gat3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<gamearr.length; i++) {
    if(i%2!=0)
    subjectgames += "<tr class='game' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+gamearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gamearr[i].comment+"</th></tr>"
    else
    subjectgames += "<tr class='game' style='background:#b3d1ff'><th style='width: 35%;text-align: left;'>"+gamearr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+gamearr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+gamearr[i].comment+"</th></tr>"
    }
    subjectgames += "</table>";

    console.log('games done....');

    var subjectpersonality = "<table style='width: 95%;margin-left: 3%;' class='subject'><tr style='background:  #86b300;'><th style='width: 35%;'>PERSONALITY DEVELOPMENT</th><th style='width: 5%;'>T1</th><th style='width: 5%;'>T2</th><th style='width: 5%;'>T3</th><th style='width: 50%;'>Comments</th></tr>"
    subjectpersonality += "<tr style='background: #86b300;text-align: center;'><th style='width: 35%;'></th><th style='width:5%;text-align: center;'>"+pdt1+"</th><th style='width: 5%;text-align: center;'>"+pdt2+"</th><th style='width: 5%;text-align: center;'>"+pdt3+"</th><th style='width:50%;'></th></tr>"
    for(var i=0; i<parr.length; i++) {
    if(i%2!=0)
    subjectpersonality += "<tr class='pd' style='background:#f1f1f1'><th style='width: 35%;text-align: left;'>"+parr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+parr[i].comment+"</th></tr>"
    else
    subjectpersonality += "<tr class='pd' style='background:#dfff80'><th style='width: 35%;text-align: left;'>"+parr[i].category+"</th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t1grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t2grade+"</div></th><th style='width: 5%;'><div class='circle' style='width:40px;height:40px;border-radius:50px;font-size:15px;line-height:40px;text-align:center;background:#d6d6c2;'>"+parr[i].t3grade+"</div></th><th style='width: 50%;text-align: left;'>"+parr[i].comment+"</th></tr>"
    }
    subjectpersonality += "</table>   <br><br><br>";

    var health = "<table class='health' border='1' style='border-collapse: collapse;width: 95%;margin-left: 3%;'><tr style='background: #ac39ac;'><th>Health</th><th>T1</th><th>T2</th><th>T3</th></tr>"
    health += "<tr class='health'><th>Height</th><th>"+t1height+"</th><th>"+t2height+"</th><th>"+t3height+"</th></tr>"
    health += "<tr class='health'><th>Weight</th><th>"+t1weight+"</th><th>"+t2weight+"</th><th>"+t3weight+"</th></tr></table><br><br>";

    // $('tr:nth-child(even)').css("background", "red");

    console.log('pd done....');


    var finalpdf=header+studinfo+attendance+signature+subjecteng+subjectmath+subjectevs+subjecthindi+subjectcomputer+subjectgk+subjectartcraft+subjectmusic+subjectdance+subjectgames+subjectpersonality+health;

    htmlToPdf.convertHTMLString(finalpdf, './app/reportcard/'+global.studentinfo[0].student_name+'.pdf',
    function (error, success) {
       if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
            logfile.write('pdf write:'+error+"\n\n");
            res.status(200).json({'returnval': 'error in conversion'}); 
        } else {
          logfile.write('pdf write:success\n\n');
          console.log('Converted');
          res.status(200).json({'returnval': 'converted'});     
        }
    });
});

app.post('/fmailreportcard-service' ,  urlencodedParser,function (req, res)
{
        var adterm1="";
        var adterm2="";
        var adterm3="";
        var wdterm1="";
        var wdterm2="";
        var wdterm3="";
        var pterm1="";
        var pterm2="";
        var pterm3="";
        var t1height="";
        var t2height="";
        var t3height="";
        var t1weight="";
        var t2weight="";
        var t3weight="";
        var generic="";
        var specific="";
        var subjectarr=[];
        var finalarr=[];
        var marks=[];
        var submarks=[];
        var co_lower=[];
        var co_higher=[];
        var co_grade=[];
        var returnval1=global.coscholasticgrade; 
              
          for(var i=0;i<returnval1.length;i++){
          co_lower.push(returnval1[i].lower_limit);
          co_higher.push(returnval1[i].higher_limit);
          co_grade.push(returnval1[i].grade);
        }

        var img1="./app/images/"+req.query.loggedid+req.query.schoolid+".jpg";
        var img2="./app/images/principal"+req.query.schoolid+".jpg";
        console.log('asa');
     /*console.log('.........................healthattendanceinfo....................................');
        console.log(global.healthattendanceinfo.length);
        console.log('.................................................................................');

        if(global.healthattendanceinfo.length==1||global.healthattendanceinfo.length==2||global.healthattendanceinfo.length==3){
        adterm1=global.healthattendanceinfo[0].attendance;
        wdterm1=global.healthattendanceinfo[0].working_days;
        pterm1=parseFloat((global.healthattendanceinfo[0].attendance/global.healthattendanceinfo[0].working_days)*100).toFixed(2)+"%";
        t1height=global.healthattendanceinfo[0].height+"cm";
        t1weight=global.healthattendanceinfo[0].weight+"kg"; 
        generic=global.healthattendanceinfo[0].generic; 
        specific=global.healthattendanceinfo[0].speccomment;        
        }
        if(global.healthattendanceinfo.length==2){
        adterm2=global.healthattendanceinfo[1].attendance;
        wdterm2=global.healthattendanceinfo[1].working_days;
        pterm2=parseFloat((global.healthattendanceinfo[1].attendance/global.healthattendanceinfo[1].working_days)*100).toFixed(2)+"%";
        t2height=global.healthattendanceinfo[1].height+"cm";
        t2weight=global.healthattendanceinfo[1].weight+"kg";
        generic=global.healthattendanceinfo[1].generic; 
        specific=global.healthattendanceinfo[1].speccomment; 
        }*/
       subjectarr=global.subjectinfo;
      var arr=global.fetchmark;
        for(var i=0;i<subjectarr.length;i++){
          var obj={"subject_name":"","FA1":"","FA2":"","SA1":"","tot1":"","FA3":"","FA4":"","SA2":"","tot2":"","FA":"","SA":"","grade":"","point":""};
          this.no=0;
          var flag=0;
          for(var j=0;j<arr.length;j++){
            this.no=parseInt(this.no)+1;
            if(subjectarr[i].subject_name==arr[j].subject_id){
              flag=1;
              obj.subject_name=arr[j].subject_id;
              if(arr[j].category=='FA1'){                
                obj.FA1=arr[j].cat_grade;                
                this.m1=arr[j].total;
              }
              else if(arr[j].category=='FA2'){                
                obj.FA2=arr[j].cat_grade;
                this.m2=arr[j].total;
              }
              else if(arr[j].category=='SA1'){                
                obj.SA1=arr[j].cat_grade;
                this.sm1=arr[j].total;
              }
              else if(arr[j].category=='FA3'){                
                obj.FA3=arr[j].cat_grade;
                this.m3=arr[j].total;
              }
              else if(arr[j].category=='FA4'){                
                obj.FA4=arr[j].cat_grade;
                this.m4=arr[j].total;
              }              
              else if(arr[j].category=='SA2'){                
                obj.SA2=arr[j].cat_grade;
                this.sm2=arr[j].total;
              }
            
              
          }
        }
        console.log('come');
          if(flag==1){
            var t1=parseFloat(((parseFloat(this.m1)+parseFloat(this.m2)+(3*parseFloat(this.sm1)))*2)/10).toFixed(1);
              if(t1>=9.1&&t1<=10)
                obj.tot1='A1';
              if(t1>=8.1&&t1<=9)
                obj.tot1='A2';
              if(t1>=7.1&&t1<=8)
                obj.tot1='B1';
              if(t1>=6.1&&t1<=7)
                obj.tot1='B2';
              if(t1>=5.1&&t1<=6)
                obj.tot1='C1';
              if(t1>=4.1&&t1<=5)
                obj.tot1='C2';
              if(t1>=3.3&&t1<=4)
                obj.tot1='D';
              if(t1>=2.1&&t1<=3.2)
                obj.tot1='E1';
              if(t1>=0&&t1<=2)
                obj.tot1='E2';
              var fatot=parseFloat((parseFloat(this.m1)+parseFloat(this.m2))/2).toFixed(1);
              if(fatot>=9.1&&fatot<=10)
                obj.FA='A1';
              if(fatot>=8.1&&fatot<=9)
                obj.FA='A2';
              if(fatot>=7.1&&fatot<=8)
                obj.FA='B1';
              if(fatot>=6.1&&fatot<=7)
                obj.FA='B2';
              if(fatot>=5.1&&fatot<=6)
                obj.FA='C1';
              if(fatot>=4.1&&fatot<=5)
                obj.FA='C2';
              if(fatot>=3.3&&fatot<=4)
                obj.FA='D';
              if(fatot>=2.1&&fatot<=3.2)
                obj.FA='E1';
              if(fatot>=0&&fatot<=2)
                obj.FA='E2';
              var satot=parseFloat(this.sm1).toFixed(1);
              if(satot>=9.1&&satot<=10)
                obj.SA='A1';
              if(satot>=8.1&&satot<=9)
                obj.SA='A2';
              if(satot>=7.1&&satot<=8)
                obj.SA='B1';
              if(satot>=6.1&&satot<=7)
                obj.SA='B2';
              if(satot>=5.1&&satot<=6)
                obj.SA='C1';
              if(satot>=4.1&&satot<=5)
                obj.SA='C2';
              if(satot>=3.3&&satot<=4)
                obj.SA='D';
              if(satot>=2.1&&satot<=3.2)
                obj.SA='E1';
              if(satot>=0&&satot<=2)
                obj.SA='E2';
              var grand=parseFloat(((parseFloat(this.m1)+parseFloat(this.m2)+(3*parseFloat(this.sm1)))*2)/10).toFixed(1);
              if(grand>=9.1&&grand<=10){
                obj.grade='A1';
                obj.point='10.0';
              }
              if(grand>=8.1&&grand<=9){
                obj.grade='A2';
                obj.point='9.0';
              }
              if(grand>=7.1&&grand<=8){
                obj.grade='B1';
                obj.point='8.0';
              }
              if(grand>=6.1&&grand<=7){
                obj.grade='B2';
                obj.point='7.0';
              }
              if(grand>=5.1&&grand<=6){
                obj.grade='C1';
                obj.point='6.0';
              }
              if(grand>=4.1&&grand<=5){
                obj.grade='C2';
                obj.point='5.0';
              }
              if(grand>=3.3&&grand<=4){
                obj.grade='D';
                obj.point='4.0';
              }
              if(grand>=2.1&&grand<=3.2){
                obj.grade='E1';
                obj.point='3.0';
              }
              if(grand>=0&&grand<=2){
                obj.grade='E2'; 
                obj.point='2.0';                         
              }
              finalarr.push(obj); 
            }}
        var lsarr=[];
        var wkarr=[];
        var vparr=[];
        var avarr=[];
        var ccarr=[];
        var hparr=[];
        var k;
        marks=global.coscholasticinfo;
       submarks=global.scholasticinfo;

         for(var i=0;i<submarks.length;i++){
          var obj={"catcheck":"","subject":"","category":"","grade":"","t1grade":"","t2grade":"","t3grade":"","comment":""};          
          if(submarks[i].subject_name=="Life Skills"){
            
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term3")
            obj.t3grade=submarks[i].category_grade;    
            lsarr.push(obj);
          }
           if(submarks[i].subject_name=="Work Education"){
           
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term3")
            obj.t3grade=submarks[i].category_grade;    
            wkarr.push(obj);
          }
           if(submarks[i].subject_name=="Visual & Performing Arts"){
            // alert('yes');
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            // obj.catcheck=submarks[i].category;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term3")
            obj.t3grade=submarks[i].category_grade;    
            vparr.push(obj);
          }
           if(submarks[i].subject_name=="Attitudes And values"){
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term3")
            obj.t3grade=submarks[i].category_grade;    
            avarr.push(obj);
          }
           if(submarks[i].subject_name=="Co-Curricular Activities"){
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term3")
            obj.t3grade=submarks[i].category_grade;    
            ccarr.push(obj);
          }
           if(submarks[i].subject_name=="Health and Physical Education"){
            // alert('yes');
            obj.subject=submarks[i].subject_name+"@"+req.query.termname;
            // obj.catcheck=submarks[i].category;
            obj.category=submarks[i].category;
            obj.comment=submarks[i].description;
            obj.grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term1")
            obj.t1grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term2")
            obj.t2grade=submarks[i].category_grade;
            if(submarks[i].term_name=="term3")
            obj.t3grade=submarks[i].category_grade;    
            hparr.push(obj);
          }
        }
       
    console.log('....................schoolname.........................');
    console.log(req.query.schoolname+"   "+req.query.academicyear); 
    console.log('.......................................................');
    var header="<div class='bbox' style='position: relative;width: 600px;height: 1210px;border: 10px solid green;top:50px;left: 20px;' id='fivescorecard'><div class='relative' style='position: relative;width: 500px;height: 200px;border: 3px solid black;top:60px;left: 20px'>"
      header+="<img src='../../images/zeesouth.png' height='100px' width='90px'/>"
      header+="<table border='0' class='scoretbl' style='position:relative;width: 500px;height: 200px;text-align: left;'>"
      header+="<tr><th colspan='3'><h2><center>"+req.query.schoolname+"</center></h2></th></tr>"
      header+="<tr><th colspan='3'><center>"+req.query.schooladdress+"</center></th></tr>"
      header+="<tr><th>Affiliation No:</th><th colspan='2'>&nbsp;"+req.query.affno+"</th></tr>" 
      header+="<tr><th> Email Id:</th><th colspan='2'>"+req.query.email+"</th></tr>"
       header+="<tr><th> Website:</th><th>"+req.query.website+"</th><th>Phone No :"+req.query.phno+"</th></tr></table></div>";
     var studentprofile="<div class='absolute' style='position: absolute;top: 50px;width: 110px; height: 100px;left: 50px;'><img src='../../images/zeesouth.png' height='100px' width='90px'/></div>"
     studentprofile+="<div class='pr' style='position: relative;width: 700px;height: 170px;left: 100px;top:100px;'><center><h2>PERFORMANCE PROFILE</h2>Class:"+req.query.grade+" (Session: "+req.query.academicyear+")<h3>CONTINUOUS AND COMPREHENSIVE EVALUATION </h3>"
     studentprofile+="<h4>(Issued by School as per directives of Central Board of Secondary Educational, Delhi)</h4> </center></div>"
     studentprofile+="<div class='stupr' style='position: relative;width: 700px;top:150px;left: 50px;'><h3>Student Profile</h3></div> <table class='tbl1' style=' position: relative;text-align: left;top:80px;left: 50px' cellspacing='10'>"
     studentprofile+="<tr ><th>Admission No.</th><th>:</th><th>"+global.studentinfo[0].student_id+"</th></tr><tr><td>(allotted by the school)</td></tr>"
     studentprofile+="<tr ><th>Name </th><th>:</th><th>"+global.studentinfo[0].student_name+"</th></tr><tr><th>Date of Birth </th> <th>:</th><th>"+global.studentinfo[0].dob+"</th></tr>"
     studentprofile+="<tr ><th>Mother's Name</th><th>:</th><th>"+global.studentinfo[0].mother_name+"</th></tr><tr > <th>Father's Name </th><th>:</th><th>"+global.studentinfo[0].parent_name+"</th></tr>"
     studentprofile+="<tr rowspan='2'><th>Residential Address </th><th>:</th><th>"+global.studentinfo[0].address1+" "+global.studentinfo[0].address2+" "+global.studentinfo[0].address3+" "+global.studentinfo[0].city+" "+global.studentinfo[0].pincode+"</th></tr><tr><th>Telephone No </th><th>:</th><th>"+global.studentinfo[0].mobile+"</th></tr></table>"  
     studentprofile+="<table class='attable' style='position: relative;text-align: left;top:150px;width: 700px;left: 50px;'><tr height='25px'><th width='250px'>Attendance:</th><th colspan='3'>Term1</th><th colspan='3'>Term2</th></tr>"
     studentprofile+="<tr></tr><tr height='25px'><th>Total attendance of the student</th><th colspan='7'>"+"global.healthattendanceinfo[0].attendance"+"</th><th colspan='3'>"+"global.healthattendanceinfo[1].attendance"+"</th></tr>"
     studentprofile+="<tr height='25px'><th> Total Working Days</th><th colspan='7'>"+"global.healthattendanceinfo[0].working_days"+"</th><th colspan='3'>"+"global.healthattendanceinfo[1].working_days"+"</th></tr></table>"
     studentprofile+="<br><br><table class='health' style=' position: relative;text-align: left;top:150px;width: 750px;left: 50px;border: 1px solid black;'><tr height='20px'><th colspan='3'> Health Status</th><th colspan='3'></th><th colspan='3'></th></tr>"
     studentprofile+="<tr></tr><tr height='22px'><th colspan='3'>Height </th><th>"+"global.healthattendanceinfo[0].height"+"</th><th colspan='7'>Weight </th><th>"+"global.healthattendanceinfo[0].width"+"</th><th colspan='3'></th></tr>"
     studentprofile+="<tr height='25px'><th colspan='3'>Blood Group </th><th>"+"global.healthattendanceinfo[0].blood_group"+"</th><th colspan='7'>Vision(L) </th><th>"+"global.healthattendanceinfo[0].left_vision"+"</th><th colspan='3'>(R) </th><th>"+"global.healthattendanceinfo[0].right_vision"+"</th></tr>"
     studentprofile+="<tr height='25px'><th colspan='3'>Dental Hygiene </th><th>"+"global.healthattendanceinfo[0].dental"+"</th><td colspan='7'></td><td colspan='3'></td></tr></table><br><br><br><br><br><br><br><br><br>";

 var signatures="<table  class='signature' style='margin-left: 20%;'><tr><th><img id='img1' width='100px;height:30px;''></th><th></th><th></th><th><img id='img2' width='130px;height:40px;'></th><th></th><th></th><th></th></tr>"
    signatures+="<tr><th>---------------------------------</th><th></th><th></th><th>---------------------------------</th><th></th><th></th>"
    signatures+=" <th>----------------------------------</th><th></th><th></th></tr>"
    signatures+="<tr><th>Class Teacher</th><th></th><th></th><th>Principal</th><th></th><th></th><th>Parent</th><th></th><th></th></tr></table><br><br><br><br></div>";

var scholasticvalue="<div class='bbbox' style=' position: relative; width: 900px; height: auto; border: 20px solid green; top:90px; left: 100px'><table border='1'><tr><th colspan='16'> <h2>PART1-ACADEMIC PERFOMANCE: Scholastic Areas</h2><br> "   
  scholasticvalue+= "</th></tr><tr><th colspan='4'>Subject Code and Name</th><th colspan='4'>Term1(grade)</th><th colspan='4'>Term2(grade)</th><th colspan='4'>Overall Term1+Term2</th></tr><tr><th colspan='4'></th><th>FA1</th><th>FA2</th><th>SA1</th><th>TOT1</th><th>FA3</th><th>FA4</th><th>SA2</th><th>TOT2</th><th>FA</th><th>SA</th><th>Overallgrade</th><th>GradePoint(Gp)</th></tr>"
  for(var i=0;i<finalarr.length;i++)
  {
 scholasticvalue+= " <tr><td colspan='4'>"+finalarr[i].subject_name+"</td>"
   scholasticvalue+=  "<td>"+finalarr[i].FA1+"</td><td>"+finalarr[i].FA2+"</td><td>"+finalarr[i].SA1+"</td><td>"+finalarr[i].tot1+"</td>"
    scholasticvalue+= "<td>"+finalarr[i].FA3+"</td><td>"+finalarr[i].FA4+"</td><td>"+finalarr[i].SA2+"</td><td>"+finalarr[i].tot2+"</td>"
    scholasticvalue+= "<td>"+finalarr[i].FA+"</td><td>"+finalarr[i].SA+"</td><td>"+finalarr[i].grade+"</td><td>"+finalarr[i].point+"</td></tr>"
  }
    scholasticvalue+="<tr><th colspan='16'>CumlativeGradePointAverage<br>"
     scholasticvalue+="<p>the CGPAis the average of grade point obtained in all the subjects excluding additional 6th subject as per Scheme of studies An indicative eqivalence of grade point and percentage of marks can be completed as-subject wise indicative percentage of markes=9.5*of the subject overallindicative percentage of mark=9.5*CGPA</p></th></tr>"
   scholasticvalue+="<tr><th colspan='16'><br><h2>part2- Co-Scholastic Areas</h2> </th></tr><tr><th colspan='16'>2(A) Life Skills</th></tr><tr><th colspan='8'>Life Skills</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
    for(var i=0;i<lsarr.length;i++)
  {
   scholasticvalue+="<tr><th colspan='8' style='text-align: left;'>"+lsarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+lsarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+lsarr[i].comment+"</th></tr>"
   }
    scholasticvalue+=" <tr><th colspan='16'>2(B) Work Education</th></tr><tr><th colspan='8'>Work Education</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
    for(var i=0;i<wkarr.length;i++)
  {
   scholasticvalue+=" <tr><th colspan='8' style='text-align: left;'>"+wkarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+wkarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+wkarr[i].comment+"</th></tr>"
  }
  scholasticvalue+="  <tr><th colspan='16'>2(C)Visual And Performing Art</th></tr><tr><th colspan='8'>Visual And Performing Art</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"   
     for(var i=0;i<vparr.length;i++)
  {
  scholasticvalue+="  <tr><th colspan='8' style='text-align: left;'>"+vparr[i].category+"</th><th colspan='3' style='text-align: center;'>"+vparr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+vparr[i].comment+"</th></tr>"
    }
    
   scholasticvalue+=" <tr><th colspan='16'>2(D) Attitudes And Values</th></tr><tr><th colspan='8'>Attitudes And Values</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
    for(var i=0;i<avarr.length;i++)
  {
   scholasticvalue+=" <tr><th colspan='8' style='text-align: left;'>"+avarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+avarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+avarr[i].comment+"</th></tr>"
    }
    
   scholasticvalue+=" <tr><th  colspan='16'><br><h2>Part-3:Co-Scholastic Activities</h2></th></tr><tr><th colspan='16'>3(A)Co-Curricular Activity</th></tr><tr><th colspan='8'>Co-Curricular Activity</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
     for(var i=0;i<ccarr.length;i++)
  {
   scholasticvalue+=" <tr><th colspan='8' style='text-align: left;'>"+ccarr[i].category+"</th><th colspan='3' style='text-align: center;'>"+ccarr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+ccarr[i].comment+"</th></tr>"
    }

   scholasticvalue+=" <tr><th colspan='16'>3(B) Health & Physical Activities</th></tr><tr><th colspan='8'>Health & Physical Activities</th><th colspan='3' style='text-align: center;'>Term1</th><th colspan='5' style='text-align: center;'>Descriptive Indicators</th></tr>"
     for(var i=0;i<hparr.length;i++)
  {
  scholasticvalue+="<tr><th colspan='8' style='text-align: left;'>"+hparr[i].category+"</th><th colspan='3' style='text-align: center;'>"+hparr[i].grade+"</th><th colspan='5' style='text-align: left;'>"+hparr[i].comment+"</th></tr>"
    }
  scholasticvalue+="  <tr><th colspan='16'><h4>Result:Qualified/Eligiblefor Improvement of perfomance(EIOP)</h4></th> </tr><tr><th colspan='16'><h4>Self Awarness:</h4></th></tr><tr><th colspan='16'><br><h4>MyGoals:</h4></th></tr><tr><th colspan='16'><h4>MyStrengths:</h4></th></tr><tr><th colspan='16'><h4>MyInterest and Hobbies</h4></th></tr><tr><th colspan='16'><h4>ResposibilityDischarge/ExceptionalAchievements</h4></th></tr></table></div>";


    console.log('pd done....');


    var finalpdf=header+studentprofile+signatures+scholasticvalue;
    // console.log("....................................");
    // console.log(finalpdf);

    htmlToPdf.convertHTMLString(finalpdf, './app/reportcard/'+global.studentinfo[0].student_name+'.pdf',
    function (error, success) {
       if (error) {
            console.log('Oh noes! Errorz!');
            console.log(error);
            logfile.write('pdf write:'+error+"\n\n");
            res.status(200).json({'returnval': 'error in conversion'}); 
        } else {
          logfile.write('pdf write:success\n\n');
          console.log('Converted');
          res.status(200).json({'returnval': 'converted'});     
        }
    });
});




app.post('/sendmail-service', urlencodedParser,function (req, res) {

sg.API(request, function(err, response) {
    console.log(err, response);
    if (!err) {
        res.send({
            message: 'An email has been sent to the provided email with further instructions.'
        });
    } else {
        return res.status(400).send({
            message: 'Failure sending email'
        });
    }
});
});

 




app.post('/fetchoveralltermwisegrade-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,term_name,avg(rtotal),(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_marks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' "+
    " and  student_id='"+req.query.studid+"' group by term_name,subject_id,student_id";
    
    console.log('......................termwise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      global.overalltermwisegrade=rows;
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/fetchhealthinfo-service' ,  urlencodedParser,function (req, res)
{  
    // var qur="select * from tr_term_health where school_id='"+req.query.schoolid+"' and "+
    // "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' "+
    // " and  student_id='"+req.query.studid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
    var qur="SELECT hc.student_id, hc.height, hc.weight, hc.bmi, hc.bmi_remark, hc.vison, hc.dental, hc.hearing, hc.overall_comment"+
" FROM  tr_term_health_copy hc JOIN tr_term_health th ON ( hc.student_id = th.student_id ) WHERE hc.school_id =  '"+req.query.schoolid+"'"+
" AND th.school_id =  '"+req.query.schoolid+"' AND th.academic_year='"+req.query.academicyear+"' and th.term_id='"+req.query.termname+"' "+
     " and  th.student_id='"+req.query.studid+"' and th.grade='"+req.query.grade+"' and th.section='"+req.query.section+"'";
    console.log('......................healthinfo..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchfahealthinfo-service' ,  urlencodedParser,function (req, res)
{  
    // var qur="select * from tr_term_health where school_id='"+req.query.schoolid+"' and "+
    // "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' "+
    // " and  student_id='"+req.query.studid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
    var qur="SELECT student_id, height, weight, bmi, bmi_remark, vison, dental, hearing, overall_comment"+
" FROM  tr_term_health_copy  where student_id='"+req.query.studid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'";
    console.log('......................healthinfo..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchartinfo-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select * from tr_term_art_verticals where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'"+
    " and  student_id='"+req.query.studid+"'";
    
    console.log('......................talent art..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchphysicalinfo-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select * from tr_term_physical_education where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_id='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'"+
    " and  student_id='"+req.query.studid+"'";
    
    console.log('......................talent physical..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/fetchgradeseperation-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select * from tr_term_assesment_marks where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"'"+
    " and  student_id='"+req.query.studid+"' and subject_id='"+req.query.subject+"' and category='"+req.query.category+"'";
    
    console.log('......................fetchgradeseperation..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});


app.post('/updateattendanceimportmarkcheck-service' ,  urlencodedParser,function (req, res)
{
var qur;
if(req.query.subject=='Hindi'||req.query.subject=='Kannada'){
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_assesment_marks "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and subject_id='"+req.query.subject+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"') AS count1, "+
"(select count(*) from tr_student_to_subject where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"') and subject_id="+
"(SELECT subject_id from md_subject where subject_name='"+req.query.subject+"') and school_id='"+req.query.schoolid+"')) AS count2)  AS counts";
}
else{
qur="SELECT CASE WHEN count1 = count2 THEN 'match' ELSE 'mismatch' END as result FROM(SELECT "+
"(select count(distinct(student_id)) from tr_term_attendance "+
"where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' "+
"and term_id='"+req.query.termname+"') AS count1, "+
"(select count(*) from md_student where school_id='"+req.query.schoolid+"' and class_id=(select class_id from mp_grade_section where grade_id=(select grade_id "+
"from md_grade where grade_name='"+req.query.gradename+"') and section_id=(select "+
"section_id from md_section where section_name='"+req.query.sectionname+"' and school_id='"+req.query.schoolid+"'))) AS count2)  AS counts";
}
console.log('----------------------------------------------------------');
console.log(qur);
  connection.query(qur,
      function(err, rows)
      {
    if(!err)
    {
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else
      {
      res.status(200).json({'returnval': 'invalid'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
});


app.post('/updateattendanceimportmark-service' ,  urlencodedParser,function (req, res)
{
    var data={
      school_id:req.query.schoolid,
      grade:req.query.gradename,
      section:req.query.sectionname,
      academic_year: req.query.academicyear,
      term_name:req.query.termname,
      assesment_id:req.query.assesmentid,
      subject:req.query.subject,
      flag:0
    };
    var qur="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and "+
    "grade='"+req.query.gradename+"' and section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' "+
    " and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and subject='"+req.query.subject+"' and flag=0";
    console.log('...............update import..........');
    console.log(qur);
    connection.query(qur,
     function(err, rows)
      {
      if(!err)
      {        
        if(rows.length>0)
        {
          res.status(200).json({'returnval': 'exist'});
        }
        else
        { 
          connection.query('insert into tr_term_assesment_import_marks set ?',[data],
          function(err, rows)
          {
            if(!err)
            {
            res.status(200).json({'returnval': 'succ'});
            }
            else
            {
              console.log('No data Fetched'+err);
            }
          });
        }
      }
      else
      console.log(err);
    });
});


app.post('/updateattendanceflag-service' ,  urlencodedParser,function (req, res)
{    
 var qurcheck="select * from tr_term_assesment_import_marks where flag='"+req.query.flag+"' and school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
 var qur="update tr_term_assesment_import_marks set flag='"+req.query.flag+"' where school_id='"+req.query.schoolid+"' and grade='"+req.query.gradename+"' and  section='"+req.query.sectionname+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"'  and subject='"+req.query.subject+"'";
  
 console.log('--------------Query check in update flag------------------');
 console.log(qurcheck);
 console.log('----------------------------------------------------------');
 console.log('--------------Query in update flag------------------');
 console.log(qur);
 console.log('----------------------------------------------------');
  connection.query(qurcheck,function(err, rows){
    if(!err){
    if(rows.length==0){
    connection.query(qur,function(err, result){
    if(!err)
    {
      if(result.affectedRows>0)
      {
      res.status(200).json({'returnval': 'updated'});
      }
      else
      {
      res.status(200).json({'returnval': 'not updated'});
      }
    }
    else
    {
      console.log('No data Fetched'+err);
    }
    });
    }
    else
      res.status(200).json({'returnval': 'exist'});
    }
  });
});

app.post('/fetchapprovalstatus-service' ,  urlencodedParser,function (req, res)
{    

 // var checkqur="SELECT grade_id FROM md_employee where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"'" 
 if(req.query.roleid=='co-ordinator'||req.query.roleid=='headmistress'){
 var qur1="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject!='attendance'";
 var qur2="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and grade in(SELECT grade_name from md_grade where grade_id in(SELECT grade_id FROM mp_teacher_grade where id='"+req.query.loggedid+"' and role_id='"+req.query.roleid+"')) and subject!='attendance'";
 }
 else if(req.query.roleid=='principal'||req.query.roleid=='viceprincipal'){
 var qur1="select * from tr_term_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject!='attendance'";
 var qur2="select * from tr_term_fa_assesment_import_marks where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and subject!='attendance'";
 }
 console.log('--------------approval status------------------');
 console.log(qur1);
 console.log(qur2);
connection.query(qur1,function(err, rows){
  if(rows.length>0){
     res.status(200).json({'returnval': rows});
  }
  else{
  connection.query(qur2,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
  }
});
});




app.post('/updatestudentinfo-service' ,  urlencodedParser,function (req, res)
{    
 var qur="update md_student set student_name='"+req.query.name+"' where school_id='"+req.query.schoolid+"' and "+
 " id='"+req.query.enrno+"'";
 var qur1="update parent set mother_name='"+req.query.mothername+"',address1='"+req.query.address+"',parent_name='"+req.query.pname+"',alternate_mail='"+req.query.alternatemail+"',email='"+req.query.pmail+"' where school_id='"+req.query.schoolid+"' and "+
 " student_id='"+req.query.enrno+"'"; 
 var qur2=" select * from parent where school_id='"+req.query.schoolid+"' and "+
 " student_id='"+req.query.enrno+"'";
 var qur3="insert into parent values('"+req.query.schoolid+"','"+req.query.enrno+"','"+req.query.pname+"','"+req.query.pmail+"','','"+req.query.address+"','','','',0,'','"+req.query.mothername+"')";  
 console.log('--------------updateinfo status------------------');
 console.log(qur);
 console.log(qur1);
 console.log(qur2);
 console.log(qur3);


  connection.query(qur,function(err, rows){
    if(!err){
      connection.query(qur2,function(err, rows){
        if(rows.length==0){
          console.log('insert');
          connection.query(qur3,function(err, rows){
            if(!err)
            res.status(200).json({'returnval': 'Parent detail not found added newly!!'});
            else
              console.log(err);
          });
        }
        else{
        connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
    }
    else
      res.status(200).json({'returnval': 'no rows'});
  });
});



app.post('/studentinfo-service' ,  urlencodedParser,function (req, res)
{    
 var qur="select * from md_student where school_id='"+req.query.schoolid+"' and id='"+req.query.enrno+"'";
  
 console.log('--------------studinf status------------------');
 console.log(qur);

  connection.query(qur,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});

app.post('/studentparentinfo-service' ,  urlencodedParser,function (req, res)
{    
 var qur="select * from parent where school_id='"+req.query.schoolid+"' and student_id='"+req.query.enrno+"'";
  
 console.log('--------------studparent status------------------');
 console.log(qur);

  connection.query(qur,function(err, rows){
    if(!err){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});


app.post('/insertoverallfagrade-service' ,  urlencodedParser,function (req, res)
{    
 var response={
            school_id:req.query.schoolid,
            academic_year:req.query.academicyear,
            term_name:req.query.termname,
            grade:req.query.grade,
            section:req.query.section,
            subject_id:req.query.subject,
            category:req.query.category,
            student_id:req.query.studentid,
            student_name:req.query.studentname,
            total:req.query.total,
            cat_grade:req.query.catgrade
 }
  
 console.log('--------------insery status------------------');
 // console.log(qur);

  connection.query("INSERT INTO tr_term_overallfa_assesment_marks SET ?",[response],function(err, rows){
    if(!err){
      res.status(200).json({'returnval': 'succ'});
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});
  

app.post('/rolecreation-service' ,  urlencodedParser,function (req, res)
{  
    var response={"id":req.query.roleid,"role_name":req.query.rname}; 

    //console.log(JSON.stringify(response));

    connection.query("SELECT * FROM md_role WHERE  id='"+req.query.roleid+"' or role_name='"+req.query.rname+"'",
      function(err, rows)
    {
    if(rows.length==0)
    {
    connection.query("INSERT INTO md_role SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'failed'});
    }
  });
});



app.post('/fetchrole-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_role";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows}); 
      }
      else
      {
        res.status(200).json({'returnval': empty}); 
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});
app.post('/thirdlangrefret-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT subject_id as subid,( select subject_name from md_subject where subject_id=subid)as subjectid FROM tr_student_to_subject where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade='"+req.query.gradeid+"' and class_id='"+req.query.classid+"' and student_id='"+req.query.id+"'";
  console.log("------------------askcnsa--------------");
  console.log(qur);
  console.log("-----------------zcknkcs---------------");
  
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows}); 
      }
      else
      {
        res.status(200).json({'returnval':'empty'}); 
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});
app.post('/deleterole-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  md_role where  id='"+req.query.roleid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});



  app.post('/sddsdsdsdqda-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="delete  FROM md_book_value  where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and academic_year='"+req.query.academic_year+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"' and value_id='"+req.query.value_id+"'";
  console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
  });
 
    
});
/*app.post('',urlencodedParser,function (req, res)
{  
   console.log("------------------1----------------");
var qur="DELETE FROM md_book_value where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and academic_year='"+req.query.academic_year+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"' and value_id='"+req.query.value_id+"'";
console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});
*/
app.post('/thirdlangrefret1-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="delete FROM tr_student_to_subject where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade='"+req.query.gradeid+"' and class_id='"+req.query.classid+"' and student_id='"+req.query.id+"'";
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
  }); });
 
  app.post('/thirdlangrefret11-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="delete  FROM md_student where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and class_id='"+req.query.classid+"' and id='"+req.query.id+"'";
  console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
  });
 
    
});
app.post('/updaterole-service' ,  urlencodedParser,function (req, res)
{  
   var rval=(req.query.roleid);
   var val=(req.query.rname);
  var qur="UPDATE  md_role SET role_name='"+val+"', id='"+rval+"' where  id='"+req.query.oldid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
    //  console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});


app.post('/subjectcreation-service' ,  urlencodedParser,function (req, res)

{  
    var response={"subject_id":req.query.subjectid,
    "subject_name":req.query.subjectname,"subject_category":req.query.category,"language_pref":req.query.preflang}; 
  var qqq="SELECT * FROM md_subject WHERE subject_id='"+req.query.subjectid+"' or subject_name='"+req.query.subjectname+"'";
     //console.log(qqq);
    //console.log(response);

    connection.query(qqq,
    function(err, rows)
    {
    if(rows.length==0)
    {
        connection.query("INSERT INTO md_subject SET ?",[response],
          function(err, rows)
          {
            if(!err)
            {
              var tempseq=parseInt((req.query.subjectid).substring(1))+1;
              connection.query("UPDATE sequence SET subject_seq='"+tempseq+"'", function (err,result){
              if(result.affectedRows>0)
                  res.status(200).json({'returnval': 'Inserted!'});
              });
            }
              else
              {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
              }
            });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
  });
});

app.post('/fetchmastercategoryname-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_category_type";
    //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': ''}); 
  });
});
app.post('/fngetpasssectinvalue-service',  urlencodedParser,function (req,res)
  {  
    /* var obj={"school_id":"","schooltype":"","acadamicyear":""};
*/  var qur="SELECT * FROM allow_student_section where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"' and acadamic_year='"+req.query.acadamicyear+"'";
    //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': ''}); 
  });
});


app.post('/fetchsubjectseq-service',  urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fetchmastersubject-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT subject_id,subject_name ,(select category_name from md_category_type where category_type=subject_category) as category,subject_category from md_subject";
  //console.log(JSON.stringify(qur));
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});


app.post('/deletesubjectname-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="DELETE FROM  md_subject where subject_id='"+req.query.subjectid+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});

app.post('/updatesubjectname-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="UPDATE  md_subject SET subject_name='"+req.query.subjectname+"' where subject_id='"+req.query.subjectid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});
app.post('/fetchconsolidatedtermwise-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_assesmentmarks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,student_id order by subject_id";
    
    console.log('......................overalltermwise..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/consolidateddatanalysisreport-service' ,  urlencodedParser,function (req, res)
{  
    var qur="select student_id,subject_id,round(avg(rtotal),1) as total,(SELECT grade FROM md_grade_rating WHERE "+
    "lower_limit<=round(avg(rtotal),1) and higher_limit>=round(avg(rtotal),1)) as grade "+
    "from tr_term_assesment_overall_assesmentmarks  where school_id='"+req.query.schoolid+"' and "+
    "academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' "+
    "and grade='"+req.query.grade+"' and section='"+req.query.section+"' group by subject_id,student_id order by subject_id";
    
    console.log('......................consolidated analysis report..............................');
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});

app.post('/deletemarks-service' ,  urlencodedParser,function (req, res)
{  
var qur="DELETE FROM tr_term_assesment_marks WHERE  school_id LIKE  '"+req.query.schoolid+"' "+
"AND academic_year LIKE  '"+req.query.academicyear+"' AND assesment_id LIKE  '"+req.query.assesmentid+"' "+
"AND  term_name LIKE  '"+req.query.termname+"' AND  student_id LIKE  '"+req.query.studentid+"' AND  grade LIKE  '"+req.query.grade+"' "+
"AND  section LIKE  '"+req.query.section+"' AND  subject_id LIKE  '"+req.query.subject+"'";
    
    console.log('......................delete mark..............................');
    //console.log(qur);
    connection.query(qur,
    function(err, result)
    {
    if(!err)
    {
    if(result.affectedRows>0)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    }
    else
      console.log(err);
});
});


app.post('/revertsubmittedmark-service' ,  urlencodedParser,function (req, res)
{  
  if(req.query.grade=="Grade-1"||req.query.grade=="Grade-2"||req.query.grade=="Grade-3"||req.query.grade=="Grade-4")
  var qur="DELETE FROM tr_term_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and flag='0'";
  else
  var qur="DELETE FROM tr_term_fa_assesment_import_marks WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and term_name='"+req.query.termname+"' and assesment_id='"+req.query.assesmentid+"' and grade='"+req.query.grade+"' and section='"+req.query.section+"' and subject='"+req.query.subject+"' and flag='0'";
   console.log('-----------------------');
   console.log(qur);
   connection.query(qur,function(err, result)
    {
    if(result.affectedRows>0){
      res.status(200).json({'returnval': 'Reverted!'});
    }
    else
      res.status(200).json({'returnval': 'Unable to revert!'});
    });
});


app.post('/schooltypecreation-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_type_id":req.query.schooltypeid,"school_type_name":req.query.stypename};
   //console.log(JSON.stringify(collection));
   connection.query("SELECT * FROM md_school_type WHERE school_type_name='"+req.query.stypename+"' or school_type_id='"+req.query.schooltypeid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_school_type SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'failed'});
    }
    });
  });


app.post('/updateschooltypename-service' ,  urlencodedParser,function (req, res)
{  
   var sval=(req.query.schooltypeid);
   var val=(req.query.stypename);
   var qur="UPDATE  md_school_type SET school_type_name='"+val+"', school_type_id='"+sval+"' WHERE school_type_id='"+req.query.oldscltypeid+"' "; 
    //console.log(qur);    
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
  });


app.post('/fetchschool-service' ,  urlencodedParser,function (req, res)
{  
  var qur="SELECT * FROM md_school where id not in('School')";
   console.log('-----------------------');
   //console.log(qur);
   connection.query(qur,function(err, rows)
    {
    if(rows.length>0){
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': 'no rows!'});
    });
});



app.post('/fetchsclidseq-service',  urlencodedParser,function (req,res)
   {  
     // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
    var qur="SELECT * FROM sequence";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/fnschoolidgenerate-service',  urlencodedParser,function (req,res)

{  
     var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
    //console.log(e);
  var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"'and flag='active'";
    //console.log(e);
  var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"'and flage='active'";

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/Fnsaveschoolinfo-service' ,  urlencodedParser,function (req, res)
{  
   
 var qur="UPDATE  md_school SET name='"+req.query.school+"',telno='"+req.query.telnum+"',mobile_no='"+req.query.MobileNumber+"',email_id='"+req.query.Emailid+"',website='"+req.query.Website+"',affiliation_no='"+req.query.affiliation+"',address='"+req.query.addr+"',address1='"+req.query.addr1+"',Board='"+req.query.Boardselection+"',address2='"+req.query.addr2+"',address3='"+req.query.addr3+"' where  id='"+req.query.schoolid1+"'";
 //console.log(JSON.stringify(qur));
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});

app.post('/FnSetschoolInfo-service' , urlencodedParser,function (req, res)
{  
    var response={ 
      id:req.query.schoolid1,     
      name:req.query.school,
      mobile_no:req.query.MobileNumber,
      telno:req.query.Telephone,
      email_id:req.query.Emailid,
      address:req.query.address,
      address1:req.query.address1,
      address2:req.query.address2,
      address3:req.query.address3,
      affiliation_no:req.query.affiliation,
      website:req.query.Website,
      Board:req.query.Board
      
    };   
   
     //  console.log(JSON.stringify(response));
    var qur="SELECT * FROM  md_school WHERE id='"+req.query.schoolid1+"'";
   // var qurr="SELECT subject_type FROM md_language_type_master where subject_id='"+req.query.seclang11+"'";
    var qur1="update md_school set name='"+req.query.school+"',address='"+req.query.address+"',address1='"+req.query.address1+"',address2='"+req.query.address2+"',address3='"+req.query.address3+"',telno='"+req.query.Telephone+"',mobile_no='"+req.query.MobileNumber+"',affiliation_no='"+req.query.affiliation+"',email_id='"+req.query.Emailid+"',Board='"+req.query.Board+"',website='"+req.query.website+"'where id='"+req.query.schoolid1+"'";

    connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
      //console.log(qur);
     connection.query("INSERT INTO md_school SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
     
    var tempseq1=parseInt((req.query.schoolid1).substring(4))+1;
      connection.query("UPDATE sequence SET school_seq='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted!'});
      });

    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       //console.log(qur1);
        connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
     
 });
});
app.post('/Fndeleteinfo-service' ,  urlencodedParser,function (req, res)
{  
  var qur="DELETE FROM md_school WHERE id='"+req.query.schoolid1+"';DELETE FROM md_employee_creation WHERE school_id='"+req.query.schoolid1+"'";
  console.log(qur);  
 var qur1="DELETE FROM  md_school where  id='"+req.query.schoolid1+"'";
console.log(qur);
  connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
    //  console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
});
app.post('/fnschoolcreation-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="select * from md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
      res.status(200).json({'returnval': rows});
      }
      else if(rows.length==0 || rows.length==null)
      {
        res.status(200).json({'returnval': "empty"});
      }
    }
    else
      res.status(200).json({'returnval': 'invalid'});
  });
});



 /*app.post('/empgetschooltype11-service',  urlencodedParser,function (req,res)


    // app.post('/fnschoolidgenerate-service',  urlencodedParser,function (req,res)

    {  
         var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
        console.log(e);
      var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"'";
      connection.query(qur,
        function(err, rows)
        {
        if(!err)
        { 
          console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });
*/
app.post('/SelectSchoolName-service' ,urlencodedParser, function (req, res)
{  
  var e={id:req.query.school_id};
  console.log(e);
  var qur="select * from md_school where id='"+req.query.school_id+"'";
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
      console.log(rows);
    }

    else
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });
});
app.post('/fnsetgrademapping-service',  urlencodedParser,function (req,res)
{  
   //  var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM md_school_type ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschoolgradeset-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
    // console.log(e);
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/counttypevalue-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
    // console.log(e);
  var qur="SELECT * FROM allow_student_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradeid+"' and  acadamic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fetchcategoryseq-service',  urlencodedParser,function (req,res)
   {  
     // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
    var qur="SELECT * FROM sequence";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fetchmastercategory-service',  urlencodedParser,function (req,res)
  {  
  var qur="SELECT * FROM md_category_type";
  //console.log(JSON.stringify(qur));
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
       else if(rows.length==0|| row.length==null)
        { 
          //console.log(JSON.stringify(rows));  
          res.status(200).json({'returnval': 'empty'});
        }
    }
        
    else
      res.status(200).json({'returnval': 'invalid'});
    });

});

app.post('/categorynewcreation-service' , urlencodedParser,function (req, res)
 {  
  var collection = {"category_id":req.query.categoryid,
  "category_name":req.query.cname,"category_type":req.query.categorytype};

   //console.log(JSON.stringify(collection));

   connection.query("SELECT * FROM md_category_type WHERE  category_name='"+req.query.categoryname+"' or category_id='"+req.query.categoryid+"' ",function(err, rows)
    {
    if(rows.length==0)
    {
      //console.log(rows);
      connection.query("INSERT INTO md_category_type SET ? ",[collection],
      function(err, rows)
      {

    if(!err)
    {
      var tempseq=parseInt((req.query.categorytype).substring(8))+1;
      //console.log(tempseq);
      connection.query("UPDATE sequence SET category_seq='"+tempseq+"'",
      function (err,result)
      {
        if(result.affectedRows>0)
              res.status(200).json({'returnval': 'Inserted!'});
      });
    }
        else 
        {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
        }
     });
     }
     else
    {
      res.status(200).json({'returnval': 'failed'});
    }
    });
  });
app.post('/deletecategoryname-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="DELETE FROM  md_category_type where category_id='"+req.query.categoryid+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/bookvaldel-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="delete from md_book_value where value_id='"+req.query.valueid+"' and  capter_id='"+req.query.capterid+"' and concept_id='"+req.query.conceptid+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });



app.post('/fnschooltypegradmapz1-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur=" DELETE FROM md_school_grade_mapping WHERE school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'and grade_id='"+req.query.gradeid+"'and grade_name='"+req.query.gradename+"'and academic_year='"+req.query.academic_year+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
 app.post('/masterfetchgrade-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
        //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
      }
      else
      {
        res.status(200).json({'returnval': empty});
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});




app.post('/updatecategoryname-service' ,  urlencodedParser,function (req, res)

{
  var cval=(req.query.categoryid);
   var val=(req.query.cname);
  var qur="UPDATE  md_category_type SET category_name='"+val+"', category_id='"+cval+"'  where category_id='"+req.query.oldcatid+"'";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    });
app.post('/fetchgradeseq-service',  urlencodedParser,function (req,res)
{  
  
  var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/gradecreation-service' ,  urlencodedParser,function (req, res)
{  
    var response={"grade_id":req.query.gradeid,"grade_name":req.query.gradename}; 

    //console.log(JSON.stringify(response));

    connection.query("SELECT * FROM md_grade WHERE grade_id='"+req.query.gradeid+"' or grade_name='"+req.query.gradename+"'",function(err, rows)
    {
    if(rows.length==0)
    {
            connection.query("INSERT INTO md_grade SET ?",[response],
            function(err, rows)
            {
            if(!err)
            {
              var tempseq={"grade_seq":parseInt((req.query.gradeid).substring(1))+1};
                      connection.query('UPDATE sequence SET ?',[tempseq],
                        function (err,result){
                        if(result.affectedRows>0)
                      res.status(200).json({'returnval': 'Inserted!'});
                    });
            }
            else
            {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
            }
            });
    }
    else
    {

      res.status(200).json({'returnval': 'failed'});
    }
  });
});

app.post('/deletegrade-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  md_grade where  grade_id='"+req.query.gradeid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    
});

app.post('/updategrade-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="UPDATE  md_grade SET grade_name='"+req.query.gradename+"' where  grade_id='"+req.query.gradeid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {   
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});
app.post('/fnempgenerateid-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/Generatesectionid-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM sequence";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/tranfergradeinfo-service', urlencodedParser,function (req,res)
{      
     
  var qur="SELECT * FROM md_grade";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/selectschooltype-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschooltypez-service',  urlencodedParser,function (req,res)
{  
 
   var qur="SELECT * FROM  md_school_grade_mapping_dummy where school_type='"+req.query.schooltypeid+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/selectrolename-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_role where id!='management' and id!='superadmin' and id!='schooladmin'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschoolemployeepersonal-service',  urlencodedParser,function (req,res)
{  

var qur="SELECT * FROM md_employee_creation where school_id='"+req.query.school_id+"'  and academic_year='"+req.query.academic_year+"' and flage='active'";

console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      
      res.status(200).json({'returnval': rows}); 
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});

app.post('/emppersonaldetails-service' ,  urlencodedParser,function (req, res)

{  
    var response={"emp_id":req.query.empid,
    "emp_name":req.query.name,"school_id":req.query.school_id,"emp_phone":req.query.Telephone,"emp_password":req.query.password,"emp_mobile":req.query.MobileNumber,"emp_mail":req.query.mailid,"flage":req.query.flage,academic_year:req.query.academic_year}; 
    console.log('-----------personal detail creation--------');
    console.log(JSON.stringify(response));

connection.query("SELECT * FROM md_employee_creation WHERE emp_id='"+req.query.empid+"'and school_id='"+req.query.school_id+"' and emp_phone='"+req.query.Telephone+"'and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
            connection.query("INSERT INTO md_employee_creation SET ?",[response],
            function(err, rows)
            {
            if(!err)
            {
              var tempseq=parseInt((req.query.empid).substring(3))+1;
                      connection.query("UPDATE sequence SET emp_sequence='"+tempseq+"'", function (err,result){
                        if(result.affectedRows>0)
                      res.status(200).json({'returnval': 'Inserted!'});
                    });
            }
            else
            {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
            }
            });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
  });
});
app.post('/empschooltypemapping-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"emp_id":req.query.empid,"school_type":req.query.schooltypeid,"emp_name":req.query.name,"flage":req.query.flage,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));

connection.query("SELECT * FROM employee_to_school_type_category_mapping WHERE emp_id='"+req.query.empid+"' and school_type='"+req.query.schooltypeid+"'and school_id='"+req.query.school_id+"'and emp_name='"+req.query.name+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO employee_to_school_type_category_mapping SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });





app.post('/sectioncreationmapping-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"grade_id":req.query.grade_id,"section_id":req.query.sectionid,"class_id":req.query.classid, "academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
     // var obj={"school_id":"","grade_id":"","sectionid":"","classid":""};
    console.log('-----------emp creation role creation-------');  
    var qur="SELECT * FROM mp_grade_section WHERE school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"'and section_id='"+req.query.sectionid+"' and  academic_year='"+req.query.academic_year+"'";
    connection.query(qur,function(err, rows)
    {
    if(rows.length==0)
    {
  
     connection.query("INSERT INTO mp_grade_section SET ?",[collection],
            function(err, rows)
            {
            if(!err)
            {
              var tempseq=parseInt((req.query.classid).substring(3))+1;
              console.log('-----tempseq------');
                      connection.query("UPDATE sequence SET sec_sequence='"+tempseq+"'", function (err,result){
                        if(result.affectedRows>0)
                      res.status(200).json({'returnval': 'Inserted!'});
                    });
            }
            else
            {
              //console.log(err);
              res.status(200).json({'returnval': 'Not Inserted!'});
            }
            });
         }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/sectioncreationmapping1-service' , urlencodedParser,function (req, res)
{  
     //    var obj={"school_id":"","sectionname":"","sectionid":""};
     
 var collection = {"school_id":req.query.school_id,"section_id":req.query.sectionid,"section_name":req.query.sectionname,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
connection.query("SELECT * FROM md_section WHERE section_id='"+req.query.sectionid+"' and section_name='"+req.query.sectionname+"'and school_id='"+req.query.school_id+"' and  academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_section SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
      //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/sectioncreationmapping2-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"id":req.query.classid,"section":req.query.sectionid,"class":req.query.grade_name,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
   //      var obj={"school_id":"","grade_name":"","sectionid":"","classid":""};
   
connection.query("SELECT * FROM md_class_section WHERE school_id='"+req.query.school_id+"' and class='"+req.query.grade_name+"'and section='"+req.query.sectionid+"'and id='"+req.query.classid+"'and  academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_class_section SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });


app.post('/fnschooltypegradmapz-service' , urlencodedParser,function (req, res)
{  
     var obj={"school_id":"","schooltype":"","gradename":""};
      
  var collection = {"school_id":req.query.school_id,"school_type":req.query.schooltype,"grade_id":req.query.gradeid,"grade_name":req.query.gradename,"academic_year":req.query.academic_year};
   console.log(JSON.stringify(collection));
connection.query("SELECT * FROM md_school_grade_mapping WHERE school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'and grade_id='"+req.query.gradeid+"'and grade_name='"+req.query.gradename+"'and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_school_grade_mapping SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
  app.post('/emprolemapping-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"id":req.query.empid,"role_id":req.query.roleid,"password":req.query.password,"name":req.query.name,"flage":req.query.flage,"academic_year":req.query.academic_year};
   //console.log(JSON.stringify(collection));
    var qur="SELECT * FROM md_employee WHERE school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'  and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academic_year+"'";
    console.log('--------emp role creation---------');
    console.log(qur);
    console.log(JSON.stringify(collection));
    console.log('----------------------------------');
    connection.query(qur,function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_employee SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        console.log('--------------error--------------');
        console.log(err);
        console.log('----------------------------');
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
  app.post('/selectschooltype11-service',urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
   //console.log(qur);
   var m={"school_id":req.query.school_id};
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/selectrolename11-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_role where id!='management' and id!='superadmin' and id!='schooladmin'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschooltypegradmapzdb-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school_grade_mapping where  school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"'";
  //console.log(JSON.stringify(qur));   
      
  connection.query(qur,

    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/getempschoolrole-service' ,  urlencodedParser,function (req, res)
{  
    // var obj={"school_id":"","emp_id":"","emp_name":"","emp_schol_type":""};
               
    var qur="DELETE FROM  md_employee where school_id='"+req.query.school_id+"' and id='"+req.query.emp_id+"' and  name='"+req.query.emp_name+"' and role_id='"+req.query.school_role_id+"' and password='"+req.query.emp_psw+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/getempschooltype-service' ,  urlencodedParser,function (req, res)
{  
     //var obj={"school_id":"","emp_id":"","emp_name":"","emp_schol_type":""};
               
    var qur="DELETE FROM  employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"' and emp_id='"+req.query.emp_id+"' and emp_name='"+req.query.emp_name+"' and school_type='"+req.query.emp_schol_type+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else  
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/fnschooltypesaveinfo-service' , urlencodedParser,function (req, res)
{
 var collection = {"school_id":req.query.school_id,"emp_id":req.query.emp_id,"emp_name":req.query.emp_name,"school_type":req.query.emp_schol_type,"flage":req.query.flage,"academic_year":req.query.academic_year,};
   //console.log(JSON.stringify(collection));
connection.query("SELECT * FROM employee_to_school_type_category_mapping WHERE school_id='"+req.query.school_id+"' and emp_id='"+req.query.emp_id+"' and emp_name='"+req.query.emp_name+"'  and school_type='"+req.query.emp_schol_type+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO employee_to_school_type_category_mapping SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/fnrolesaveinfo-service' , urlencodedParser,function (req, res)
{  
       
  var collection = {"school_id":req.query.school_id,"id":req.query.emp_id,"name":req.query.emp_name,"role_id":req.query.emp_role_id,"password":req.query.password,"flage":req.query.flage,"academic_year":req.query.academic_year};
   console.log(JSON.stringify(collection));
 connection.query("SELECT * FROM md_employee WHERE school_id='"+req.query.school_id+"' and id='"+req.query.emp_id+"' and name='"+req.query.emp_name+"' and  role_id='"+req.query.emp_role_id+"' and password='"+req.query.password+"' and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_employee SET ?",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/Fnpersonalinfo-service' ,  urlencodedParser,function (req, res)
 {  
  var qur="UPDATE  md_employee_creation SET   emp_name='"+req.query.employeename+"' , emp_phone='"+req.query.employeephone+"' , emp_password='"+req.query.employeepassword+"' , emp_mobile='"+req.query.employeemobile+"' where emp_id='"+req.query.employeeid+"' and school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"'"; 
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'updated!'});
    }
    else
    {
     res.status(200).json({'returnval': 'Not updated!'});
    }
    });
    
});
app.post('/Fnempdeleteinfoz-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  md_employee_creation set flage='"+req.query.flage+"' where emp_id='"+req.query.employeeid+"' and emp_name='"+req.query.employeename+"' and school_id='"+req.query.school_id+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
    });
    
});app.post('/Fnempdeleteinforole-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  md_employee  set  flage='"+req.query.flage+"' where school_id='"+req.query.school_id+"' and id='"+req.query.employeeid+"'  and name='"+req.query.employeename+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
    });
    
});
app.post('/fnschoolsubjetflage-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  md_employee_subject  set  flage='"+req.query.flage+"' where school_id='"+req.query.school_id+"' and emp_id='"+req.query.employeeid+"'  and emp_name='"+req.query.employeename+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
     });
    });
app.post('/empsubjectdective-service' ,  urlencodedParser,function (req, res)
  {  
  var qur="update  mp_teacher_grade set flage='"+req.query.flage+"' where school_id='"+req.query.school_id+"' and id='"+req.query.employeeid+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }

    });
    });

app.post('/Fnempdeleteinfotype-service' ,  urlencodedParser,function (req, res)
{  
  var qur="update  employee_to_school_type_category_mapping set flage='"+req.query.flage+"' where emp_id='"+req.query.employeeid+"' and emp_name='"+req.query.employeename+"' and school_id='"+req.query.school_id+"'";
    //console.log(qur);
    connection.query(qur,function(err, rows)
     {
    if(!err)
    {
      res.status(200).json({'returnval': 'update!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not update!'});
    }
    });
    });
app.post('/fnschoolemployeeschooltype-service',  urlencodedParser,function (req,res)
   {  
   var qur="SELECT * FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"' and emp_id='"+req.query.employeeid+"'  and academic_year='"+req.query.academic_year+"' and flage='active'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnschoolemployeerole-service',  urlencodedParser,function (req,res)
 {  
   var qur="SELECT * FROM md_employee where school_id='"+req.query.school_id+"' and id='"+req.query.employeeid+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/SelectSchoolName-service' ,urlencodedParser, function (req, res)
    {  
     // var e={id:req.query.school_id};
      //console.log(e);
      var qur="select * from md_school where id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          //console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
   });
    });
app.post('/sectioncreategrade-service' ,urlencodedParser, function (req, res)
    {    
      //var e={id:req.query.school_id};
    //  console.log(e);
      var qur="select * from md_school_grade_mapping where school_id='"+req.query.school_id+"' and school_type='"+req.query.sectionschooltypeid+"' and academic_year='"+req.query.academic_year+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
       //   console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
   });
    });

app.post('/sectioncreategrade1-service' ,urlencodedParser, function (req, res)
    {  
     var qur="SELECT s.grade_id,s.grade_name,UPPER(p.section_id)as section_id, p.class_id FROM md_school_grade_mapping s join mp_grade_section p  on s.grade_id=p.grade_id  where p.school_id='"+req.query.school_id+"' and s.school_id='"+req.query.school_id+"' and p.academic_year='"+req.query.academic_year+"' and s.academic_year='"+req.query.academic_year+"' and s.school_type='"+req.query.sectionschooltypeid+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
   });
    });


app.post('/termrecovery-service',urlencodedParser,function (req,res)
{ 
//  var obj={"workingschoolid":"","acadamicyear":"","termids":"","termgrade":""};
        
  var qur="SELECT * FROM md_workingdays where school_id='"+req.query.workingschoolid+"' and academic_year='"+req.query.acadamicyear+"'and term_name='"+req.query.termids+"' and type='"+req.query.termgrade+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/terminsert-service' , urlencodedParser,function (req, res)
{  
    var response={
      school_id:req.query.school_id,
      academic_year:req.query.acadamicyears,
      school_type:req.query.schootypids,
      type:req.query.gradename,
      no_of_days:req.query.termvalue,
      term_name:req.query.termid,

      };
      console.log(response);
  var qur="SELECT * FROM md_workingdays WHERE school_id='"+req.query.school_id+"' and academic_year='"+req.query.acadamicyears+"' and school_type='"+req.query.schootypids+"' and type='"+req.query.gradename+"' and term_name='"+req.query.termid+"'";

    var qur1="update md_workingdays set no_of_days='"+req.query.termvalue+"' where school_id='"+req.query.school_id+"' and academic_year='"+req.query.acadamicyears+"' and school_type='"+req.query.schootypids+"' and term_name='"+req.query.termid+"'and type='"+req.query.gradename+"'";

    console.log(qur);
    console.log(qur1)
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO md_workingdays SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});


app.post('/fnsectiostudentpassvalue-service' , urlencodedParser,function (req, res)
{  
var response={
            school_id:req.query.school_id,
            acadamic_year:req.query.acadamicyears,
            grade_id:req.query.gradeid,
            grade_name:req.query.gradename,
            no_of_section:req.query.section,
            no_of_student:req.query.student,
            school_type:req.query.schootypids,
            capacity:req.query.capacity,
         }
     //var obj={"workingschoolid":"","acadamicyear":"","termids":"","termgrade":"","noofdays":""};
        

    console.log(JSON.stringify(response));
    var qur="SELECT * FROM allow_student_section WHERE school_id='"+req.query.school_id+"' and acadamic_year='"+req.query.acadamicyears+"' and grade_id='"+req.query.gradeid+"' and school_type='"+req.query.schootypids+"'";

    var qur1="update allow_student_section set no_of_section='"+req.query.section+"',no_of_student='"+req.query.student+"',capacity='"+req.query.capacity+"'where school_id='"+req.query.school_id+"' and acadamic_year='"+req.query.acadamicyears+"' and grade_id='"+req.query.gradeid+"' and school_type='"+req.query.schootypids+"'";

   /* console.log(qur);
    console.log(qur1)*/
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO allow_student_section SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});



app.post('/checksctionvalue-service', urlencodedParser,function (req,res)
{  
     
  var qur="SELECT COUNT(DISTINCT class_id) AS section_id FROM mp_grade_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/countsectionvalue-service', urlencodedParser,function (req,res)
 {  
var qur="SELECT * FROM allow_student_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"'and acadamic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/studenttranferinfo-service',  urlencodedParser,function (req,res)
{ 
  var qur="SELECT school_id,class_id,school_type,id,student_name,school_type,(select class from md_class_section where id= class_id) as class,(select section from md_class_section where id= class_id) as section  FROM md_student where id='"+req.query.studentname+"'and school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/tranfersection-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_class_section where class='"+req.query.setgradeid+"' and school_id='"+req.query.school_id+"' and  academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/insertgradeinfo-service',urlencodedParser,function (req, res)
{  
 var qurr="select school_type from md_school_grade_mapping where grade_name='"+req.query.setgradeid+"' and academic_year='"+req.query.academic_year+"'";  
 //console.log(qurr);

 var response={class_id:req.query.tranfersection,
  school_type:req.query.setgradeid};
//console.log(response);

var qur1="UPDATE md_student SET ? WHERE id='"+req.query.studentname+"' and school_id='"+req.query.school_id+"' and "+" academic_year='"+req.query.academic_year+"'";
//console.log(qur1);
  connection.query(qurr,
    function(err, rows){
    response.school_type=rows[0].school_type;
   
   connection.query(qur1,[response],
    function(err, rows)
    {
    if(!err)
    {  console.log(rows);
      res.status(200).json({'returnval': 'Updated!'});
    }
    else
    {
     // console.log(err);
      res.status(200).json({'returnval': 'Not Updated!'});
    }
     });
    });
  });
app.post('/deletegradeinfo-service' ,urlencodedParser,function (req, res)
{  
var qur="DELETE FROM  md_student where school_id='"+req.query.school_id+"' and school_type='"+req.query.setgradeid+"' and class_id='"+req.query.tranfersection+"' and id='"+req.query.studentname+"'and academic_year='"+req.query.academic_year+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/fndelsectiongrade1-service' ,urlencodedParser,function (req, res)
{  
     var obj={"school_id":"","sectionname":"","sectionid":""};
      
var qur="DELETE FROM  md_section where school_id='"+req.query.school_id+"' and section_name='"+req.query.sectionname+"' and section_id='"+req.query.sectionid+"'";
console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });


app.post('/fndelsectiongrade11-service',  urlencodedParser,function (req,res)
{  
  // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
  var qur="SELECT * FROM md_student where grade_id='"+req.query.grade_id+"' and school_id='"+req.query.school_id+"'and class_id='"+req.query.classid+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      if(rows.length>0)
      {
       //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows}); 
      }
      else
      {
        res.status(200).json({'returnval':'empty'}); 
      }
      
    }
    else
      res.status(200).json({'returnval': 'Invalid'});
  });
});
app.post('/fndelsectiongrade-service' ,urlencodedParser,function (req, res)
{  
var qur="DELETE FROM  mp_grade_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and class_id='"+req.query.classid+"' and section_id='"+req.query.sectionid+"' and academic_year='"+req.query.academic_year+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/fndelsectiongrade2-service' ,urlencodedParser,function (req, res)
{  
 //       var obj={"school_id":"","grade_name":"","sectionid":"","classid":""};
   
var qur="DELETE FROM  md_class_section where school_id='"+req.query.school_id+"' and class='"+req.query.grade_name+"' and section='"+req.query.sectionid+"' and id='"+req.query.classid+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });

app.post('/getstudentname-service',  urlencodedParser,function (req, res)
{
 /*var qur="SELECT id,student_name,(SELECT class FROM scorecarddb.md_class_section where id=class_id and class='"+req.query.grade_id+"') as grade FROM scorecarddb.md_student where school_id='"+req.query.school_id+"'";
*/
  var qur1="SELECT id,student_name,(SELECT class FROM md_class_section where id= class_id)as grade FROM md_student where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and class_id in (SELECT id FROM md_class_section where id=class_id and school_id='"+req.query.school_id+"'and class='"+req.query.grade_id+"') and academic_year='"+req.query.academic_year+"'";

  connection.query(qur1,
        function(err, rows)
        {
    if(!err)
    {
    if(rows.length>0)
    {
//console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
  }
  else{
     console.log(err);
  }
});
});
app.post('/getschoolTypename-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/getschoolTypename-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
  
app.post('/selectsectiongrade-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnsetpasssectinvalue-service',  urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"'  and academic_year='"+req.query.acadamicyear+"'";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {   
    if(!err)      
     { 
       res.status(200).json({'returnval': rows});
      }
    else
      res.status(200).json({'returnval': ''});  
  });
});
app.post('/SchooltypetoGrademapping-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM md_school_type ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/masterschoolmapping-service',  urlencodedParser,function (req,res)
{  
   //  var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM master_school_type ";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
 app.post('/insertschoolTypename-service' , urlencodedParser,function (req, res)
{  
   var collection = {"school_id":req.query.schoolid,"school_type_id":req.query.schooltypeid,"school_type_name":req.query.schooltypes};
  //console.log(JSON.stringify(collection));
   connection.query("SELECT * FROM master_school_type WHERE school_type_id='"+req.query.schooltypeid+"' and school_id='"+req.query.schoolid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO master_school_type SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/Fngradeinsetschool-service' , urlencodedParser,function (req, res)
{  
     
  var collection = {"school_id":req.query.schoolid,"grade_id":req.query.gradeid,"grade_name":req.query.gradename,"school_type":req.query.schooltypeid};
   //console.log(JSON.stringify(collection));
connection.query("SELECT * FROM md_school_grade_mapping_dummy WHERE school_id='"+req.query.schoolid+"' and grade_id='"+req.query.gradeid+"' and school_type='"+req.query.schooltypeid+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_school_grade_mapping_dummy SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/FnschoolgettheGrade-service',  urlencodedParser,function (req,res)
{  
    var qur="SELECT grade_id,grade_name FROM md_grade where grade_id not in(select grade_id from md_school_grade_mapping_dummy)";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
    //  console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empsubjectTeacher-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_employee where school_id='"+req.query.school_id+"' and role_id='subject-teacher'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empcategory-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_subject_category";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/FnschoolgettheGrade1-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM md_school_grade_mapping_dummy WHERE school_type='"+req.query.schooltypeid+"' and school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));
    if(rows.length==0){
           res.status(200).json({'returnval': 'empty'});
          
        }
       else if(rows.length>0){   
      res.status(200).json({'returnval': 'fill'});
    }
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/empschooltype-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
/*app.post('/fngetempsubject-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

 if(req.query.categoryid=="category1")
 {  
  qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and school_category_id='"+req.query.categoryid+"' and  langugage_pref='"+req.query.emplangprefernce+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 
}
else 
 {
 qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 

}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});*/
app.post('/emplangschooltypegetcategorywww-service',  urlencodedParser,function (req,res)
{  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"' and language_pref='"+req.query.language_pref+"'";
     console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/emplangschooltypegetcategorywwws-service',  urlencodedParser,function (req,res)
{  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"' and language_pref='"+req.query.langugage_pref+"'";
     console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
app.post('/fnempsubjectdetails-service' , urlencodedParser,function (req, res)
{  
  var collection = {"school_id":req.query.school_id,"emp_id":req.query.emp_id,"emp_name":req.query.emp_name,
  "subjectid":req.query.subjectid,"school_type_id":req.query.schooltypeid,"school_category_id":req.query.categoryid,"flage":req.query.flage,"langugage_pref":req.query.emplanpreff,"academic_year":req.query.academic_year};

 var qur="SELECT * FROM md_employee_subject WHERE school_id='"+req.query.school_id+"' and emp_id='"+req.query.emp_id+"' and emp_name='"+req.query.emp_name+"' and subjectid='"+req.query.subjectid+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and academic_year='"+req.query.academic_year+"'";
 console.log('--------------------');
 console.log(qur);
 console.log('--------------------');
 connection.query(qur,function(err, rows)
      {
    if(rows.length==0)
    {
      connection.query("INSERT INTO md_employee_subject SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }    
      else 
      {
        console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {   
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });

app.post('/empgetschooltype111-service',  urlencodedParser,function (req,res)

    {    
      var qur="SELECT distinct emp_name,emp_id FROM md_employee_subject where school_id='"+req.query.school_id+"'and school_type_id='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"' and flage='active'";
      console.log(qur);
      connection.query(qur,
        function(err, rows)
        {
        if(!err)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });
app.post('/empgetschooltype11-service',  urlencodedParser,function (req,res)

    {    
  // var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
     //   console.log(e);
    var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"' and flage='active'";
    console.log(qur);
      connection.query(qur,
        function(err, rows)
        {
        if(!err)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });

app.post('/dynamicinfo-service',  urlencodedParser,function (req,res)


    // app.post('/fnschoolidgenerate-service',  urlencodedParser,function (req,res)

    {  
  // var e={school_id:req.query.school_id,school_type:req.query.schooltypeid};
     //   console.log(e);
      var qur="SELECT distinct emp_name,emp_id FROM employee_to_school_type_category_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and flage='active'";
      connection.query(qur,
        function(err, rows)
        {
        if(!err)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
        else
          res.status(200).json({'returnval': ''});
      });
    });

app.post('/schooltypegetcategorywww-service',  urlencodedParser,function (req,res)
{  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"'";
    connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
    });
});
//fetching student names
app.post('/fetchstudnameforenable-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.schoolid};
  var gradeid={grade_id:req.query.grade};
  var sectionid={section_id:req.query.section};

  var qur="SELECT * FROM md_student where class_id=(select class_id from mp_grade_section where grade_id=(select grade_id from md_grade where grade_name='"+req.query.grade+"') and section_id=(select section_id from md_section where section_name='"+req.query.section+"' and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"') and school_id='"+req.query.schoolid+"' and feepaid_status='No'";

  connection.query(qur,
    function(err, rows)
    {
    if(!err)

    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/deletesubjectz-service' ,  urlencodedParser,function (req, res)
{  
   
    var qur="DELETE FROM  md_employee_subject where school_id='"+req.query.school_id+"' and emp_id='"+req.query.empid+"' and emp_name='"+req.query.empname+"' and subjectid='"+req.query.subjectid+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"'  and academic_year='"+req.query.academic_year+"'";
  console.log(qur);
    connection.query(qur,function(err, rows)
    {   
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/deletesubjectz11-service' ,  urlencodedParser,function (req, res)
{  
   /*      var qur="SELECT * FROM mp_teacher_grade where school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'and subject_id='"+req.query.subjectid+"'"; 
   */             
    var qur="DELETE FROM   mp_teacher_grade where school_id='"+req.query.school_id+"' and school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'and subject_id='"+req.query.subjectid+"'";
  //console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
 app.post('/DelteschoolTypename-service' ,  urlencodedParser,function (req, res)
 {  
     // var obj={"schooltypes":"","schooltypeid":"","schoolid":""};
  var qur="DELETE FROM  master_school_type where school_id='"+req.query.schoolid+"' and school_type_id='"+req.query.schooltypeid+"'";
    console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
  app.post('/schooltypegetcategorywww-service',  urlencodedParser,function (req,res)
    {  
     var qur="SELECT * FROM md_subject where subject_category='"+req.query.schoolcategoryid+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/deletesubjectz1-service',  urlencodedParser,function (req,res)
     {  
     var qur="SELECT * FROM mp_teacher_grade where school_id='"+req.query.school_id+"' and id='"+req.query.empid+"'and subject_id='"+req.query.subjectid+"'";
      //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
        if(rows.length>0){
                res.status(200).json({'returnval': rows});
   
     }
       else if(rows.length==0){
             res.status(200).json({'returnval': 'empty'});
   
         }
     // console.log(JSON.stringify(rows));   
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/tranfersection-service', urlencodedParser,function (req,res)
{  
  var qur="SELECT * FROM md_class_section where class='"+req.query.setgradeid+"' and school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/empmappingsubject-service',urlencodedParser,function (req,res)
{  

  var qur="SELECT school_id,subjectid,emp_id,emp_name,(select subject_name from md_subject where subject_id =subjectid) as subject FROM md_employee_subject where school_id='"+req.query.school_id+"' and emp_id='"+req.query.empselectid+"' and flage='active' and academic_year='"+req.query.academicyear+"' and school_type_id='"+req.query.schooltype+"'";

  console.log("--------------------------------------------------------------");
 
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fnsavesection-service' , urlencodedParser,function (req, res)
{
  //   var obj={"school_id":"","empid":"","empgradeid":"","empsubjectid":"","empsectionid":""};
        
 var collection = {"school_id":req.query.school_id,"id":req.query.empid,"grade_id":req.query.empgradeid,"subject_id":req.query.empsubjectid,"section_id":req.query.empsectionid,"role_id":req.query.rolename,"flage":req.query.flage,"class_id":req.query.empsectionid1,"academic_year":req.query.academic_year,"school_type":req.query.schooltypeid};
   //console.log(JSON.stringify(collection));

connection.query("SELECT * FROM mp_teacher_grade WHERE school_id='"+req.query.school_id+"' and id='"+req.query.empid+"' and grade_id='"+req.query.empgradeid+"'and subject_id='"+req.query.empsubjectid+"'  and section_id='"+req.query.empsectionid+"' and role_id='"+req.query.rolename+"'  and class_id='"+req.query.empsectionid1+"' and school_type='"+req.query.schooltypeid+"'  and academic_year='"+req.query.academic_year+"'",function(err, rows)
    {
    if(rows.length==0)
    {
      connection.query("INSERT INTO mp_teacher_grade SET ? ",[collection],
      function(err, rows)
      {

      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
      }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/empgetsectionvalues-service',  urlencodedParser,function (req,res)
   {
    // var qur="SELECT grade FROM MD_GRADE_RATING WHERE lower_limit<='"+req.query.score+"' and higher_limit>='"+req.query.score+"'";
var qur="SELECT id,s.grade_id,s.id,section_id ,subject_id,(SELECT id FROM md_class_section where id=s.class_id and school_id='"+req.query.school_id+"') as classid FROM mp_teacher_grade s  where s.school_id='"+req.query.school_id+"' and s.id='"+req.query.empselectid+"' and s.role_id='subject-teacher' and s.academic_year='"+req.query.academic_year+"' and s.school_type='"+req.query.schooltypeid+"'and flage='active'";
   // console.log(qur);
    /*  var qur="SELECT id,s.grade_id,s.id,section_id ,subject_id,(SELECT id FROM md_class_section where section=s.section_id and school_id='"+req.query.school_id+"') as classid FROM mp_teacher_grade s  where s.school_id='"+req.query.school_id+"' and s.id='"+req.query.empselectid+"' and s.grade_id='"+req.query.setgradeidz+"' and flage='active'";*/
    //console.log(qur);
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));  
       if(rows.length>0) {
      res.status(200).json({'returnval': rows});
    }else{
      res.status(200).json({'returnval': 'empty'});
      
    }
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/getschooltypeas-service',  urlencodedParser,function (req,res)
{  
    var e={school_id:req.query.school_id,school_type:req.query.schooltypename};
   
var qurr="SELECT p.school_type,p.grade_id,p.grade_name,s.section_id,s.class_id FROM md_school_grade_mapping p join mp_grade_section s  on(s.grade_id=p.grade_id) where s.school_id='"+req.query.school_id+"' and p.school_id='"+req.query.school_id+"' and  s.academic_year='"+req.query.academic_year+"'  and p.academic_year='"+req.query.academic_year+"' and p.school_type='"+req.query.schooltypeid+"'";

   var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"'";
  // console.log("-------------value------------------------");
 // console.log(qurr);
  //  console.log("-------------value------------------------");
 
  connection.query(qurr,
    function(err, rows)
    {
    if(!err)   
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/getschooltype1-service',  urlencodedParser,function (req,res)
{  
    var e={school_id:req.query.school_id,school_type:req.query.schooltypename};
   
var qur1="SELECT grade_id,grade_name  FROM md_school_grade_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"' and grade_name in(select distinct class from md_class_section where  class=grade_name  and  school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"' and school_type='"+req.query.schooltypeid+"')";

   //var qur="SELECT * FROM md_school_grade_mapping where";
   console.log(qur1);
  connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/getschooltype-service',  urlencodedParser,function (req,res)
{  
    var e={school_id:req.query.school_id,school_type:req.query.schooltypename};
   

   var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.school_id+"'and school_type='"+req.query.schooltypeid+"' and academic_year='"+req.query.academic_year+"'";
  //console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/empsectionclass-service' ,  urlencodedParser,function (req, res)
{  
 
   var qur="DELETE FROM  mp_teacher_grade where school_id='"+req.query.school_id+"' and id='"+req.query.employeeidz+"' and grade_id='"+req.query.empgradeidz+"' and subject_id='"+req.query.empsubjectidz+"'and section_id='"+req.query.employeesectionnamez+"' and school_type='"+req.query.schooltypeid+"'";
  //  console.log(qur);
    connection.query(qur,function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
  });
app.post('/schoolGradetype-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/fngetstudent-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM mp_grade_section where school_id='"+req.query.school_id+"' and grade_id='"+req.query.stugradeid+"' and  academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/FngetStudentpasssection-service',  urlencodedParser,function (req,res)
{  
   var e={school_id:req.query.schoolid};
  var qur="SELECT * FROM md_admission where school_id='"+req.query.school_id+"' and class_for_admission='"+req.query.stugrade+"' and academic_year='"+req.query.academic_year+"'";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      //console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});
app.post('/SchoolCategorytype-service',  urlencodedParser,function (req,res)
{  
     var e={school_id:req.query.schoolid};
  //   console.log(e);
  var qur="SELECT * FROM md_subject_category";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});  
app.post('/fnsubjecttocategorysaving-service' ,  urlencodedParser,function (req, res)
{    
    var response={
            school_id:req.query.school_id,
            grade_id:req.query.gradename,
            subject_id:req.query.subjectid,
            subject_category:req.query.categoryname,
            school_type_id:req.query.schootypename,
            "academic_year":req.query.academic_year,
            lengpref:req.query.emplanpreff
          };
          
       // console.log(response);
  connection.query("SELECT * FROM mp_grade_subject WHERE school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradename+"' and subject_id='"+req.query.subjectid+"' and subject_category='"+req.query.categoryname+"'  and school_type_id='"+req.query.schootypename+"'and academic_year='"+req.query.academic_year+"'and lengpref='"+req.query.emplanpreff+"'",function(err, rows){
    if(rows.length==0)
    {
      connection.query("INSERT INTO mp_grade_subject SET ? ",[response],
      function(err, rows)
      {


      if(!err)
       {
        //console.log(rows);
        res.status(200).json({'returnval': 'Inserted!'});
        }
      else 
      {
        //console.log(err);
        res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else
    {
      res.status(200).json({'returnval': 'Already Exit'});
    }
    });
  });
app.post('/fngetThefunction-service',  urlencodedParser,function (req,res)
{  
  var qur;

     if(req.query.schooltypesubjectid=="category1"){

    qur="select * FROM  mp_grade_subject where  school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and subject_category='"+req.query.schooltypesubjectid+"' and lengpref='"+req.query.lengpref+"' and academic_year='"+req.query.academic_year+"'";
   }
    else{
     qur="select * FROM  mp_grade_subject where  school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and subject_category='"+req.query.schooltypesubjectid+"'and academic_year='"+req.query.academic_year+"'";

 }
//  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else   
     
      res.status(200).json({'returnval': ''});
  });
});

  




app.post('/fngetempsubject-service' ,  urlencodedParser,function (req, res)
{ 
 var qur;

 if(req.query.categoryid=="category1")
 {  
  qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and school_category_id='"+req.query.categoryid+"' and  langugage_pref='"+req.query.emplangprefernce+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 
}
else 
 {
 qur="SELECT * FROM md_employee_subject where school_id='"+req.query.school_id+"' and school_type_id='"+req.query.schooltypeid+"' and school_category_id='"+req.query.categoryid+"' and academic_year='"+req.query.academic_year+"'and  flage='active'";
 

}
connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      // console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
});
});






app.post('/Fngetcategoryandsubject-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="Delete from mp_grade_subject where school_id='"+req.query.school_id+"'and subject_id='"+req.query.subjectname+"' and grade_id='"+req.query.gradename+"' and subject_category='"+req.query.categoryname+"'and school_type_id='"+req.query.schootypename+"' and academic_year='"+req.query.academic_year+"'";
//console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
    {
      //console.log(err);

      res.status(200).json({'returnval': 'Not Updated!'});
    }
    });
    
});


app.post('/deleteschooltype-service' ,  urlencodedParser,function (req, res)
{  
   
var qur="DELETE FROM  md_school_type where  school_type_id='"+req.query.schooltypeid+"'";
 connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {  
      res.status(200).json({'returnval': 'Deleted!'});


    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Deleted!'});
    }
    });
    });
app.post('/FnselecttoSection-service' ,urlencodedParser,
  function (req, res)

{  
  
  var qur1="select * from md_class_section where school_id='"+req.query.subjectselectid+"'and class='"+req.query.FnStosGradeid+"'  and academic_year='"+req.query.acadamicyear+"' and id in (SELECT distinct class_id FROM `md_student` WHERE  grade_id='"+req.query.gradeid+"'  and academic_year='"+req.query.acadamicyear+"' and school_id='"+req.query.subjectselectid+"')";

 // console.log(qur1);
  connection.query(qur1,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
       //console.log(rows);
    }

    else
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });
});
app.post('/SbjecttoStudentmapping-service',  urlencodedParser,function (req,res)
{   
  var schoolid={school_id:req.query.subjectselectid};
  var gradeid={grade_id:req.query.FnStosGradeid};
  var sectionid={section_id:req.query.FnStoSSectionid};
  
     var quer="SELECT * FROM md_student where  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"' and class_id='"+req.query.class_id+"'";
  connection.query(quer,function(err, rows){
     if(!err){

      res.status(200).json({'returnval': rows});
         }

    else
      res.status(200).json({'returnval': 'Fail!'});
    
    });
});     


//enable student names
app.post('/enablestudent-service',  urlencodedParser,function (req,res)
{   
  var qur="update md_student set feepaid_status='Yes' where school_id='"+req.query.schoolid+"' and feepaid_status='No' and id='"+req.query.studentid+"'";


  connection.query(qur,
    function(err, rows)
    {
    if(!err)

    {  
      res.status(200).json({'returnval': 'Enabled successfully!!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Unable to process!'});
    }  

  });
});    
app.post('/FnSubjecttostudentlanguage-service',  urlencodedParser,function (req, res)
{
    
  connection.query('SELECT * from md_subject where language_pref="Second Language"',
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/fnbookplansubject-service',  urlencodedParser,function (req, res)
{
    
  connection.query('SELECT * from md_subject',
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/SbjecttoStudentmapping1-service',  urlencodedParser,function (req, res)
{
      var qur='SELECT * from tr_student_to_subject where school_id="'+req.query.subjectselectid+'"and academic_year="'+req.query.FnStoStermid+'" and grade="'+req.query.FnStosGradeid+'" and class_id="'+req.query.FnStoSSectionid+'"';
     // console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/FnSubjecttostudentthirdlanguage-service',  urlencodedParser,function (req, res)
{
connection.query("SELECT * from md_subject where language_pref!='Core subject' and subject_category='category1'",
    function(err, rows)
    {
    if(!err)
    {   
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});
app.post('/FnSecondLangSubjectToStudent-service' , urlencodedParser,function (req, res)
{  
    var response={
      school_id:req.query.schoolnames,
      student_id:req.query.studentid,
      academic_year:req.query.Acadamicyear,
      grade:req.query.gradeid,
      section:req.query.sectionname,
      subject_id:req.query.subjectid,
      student_name:req.query.studentname,
      class_id:req.query.sectionid,
     lang_pref:req.query.langugagepref,
    }; 
     // console.log(response);

var qur="SELECT * FROM  tr_student_to_subject WHERE school_id='"+req.query.schoolnames+"' and student_id='"+req.query.studentid+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and  class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"'";
 

 
  var qur1=  "update tr_student_to_subject set subject_id='"+req.query.subjectid+"' where school_id='"+req.query.schoolnames+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and student_id='"+req.query.studentid+"' and class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"'";
   
    //console.log(qur);
   // console.log(qur1);
   
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);

      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
        //  console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
    });

app.post('/FnSecondLangSubjectToStudentsets-service' , urlencodedParser,function (req, res)
{  
  
  var response={
      school_id:req.query.schoolnames,
      student_id:req.query.studentid,
      academic_year:req.query.Acadamicyear,
      grade:req.query.gradeid,
      section:req.query.sectionname,
      subject_id:req.query.subjectid,
      student_name:req.query.studentname,
      class_id:req.query.sectionid,
     lang_pref:req.query.langugagepref,
      //studentid,studentname,schoolnames,termsname,gradenamesssss,Sectionnames,seclang,thirdlang,Sectionnameseeee
    }; 
     // console.log(response);

var qur="SELECT * FROM  tr_student_to_subject WHERE school_id='"+req.query.schoolnames+"' and student_id='"+req.query.studentid+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and  class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"'";
 

 
  var qur1=  "update tr_student_to_subject set subject_id='"+req.query.subjectid+"' where school_id='"+req.query.schoolnames+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and student_id='"+req.query.studentid+"' and class_id='"+req.query.sectionid+"' and lang_pref='"+req.query.langugagepref+"'";
   
    //console.log(qur);
   // console.log(qur1);
   
  
     connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          //console.log('update');
        if(!err)
        {
         res.status(200).json({'returnval': 'updated successfully'}); 
        }  
        
        else
        {
          res.status(200).json({'returnval': 'not updated'});
        }
        
        });
        } 
      });
 });

app.post('/FnThirdLangSubjectToStudent-service' , urlencodedParser,function (req, res)
{  
    var response={

     
      school_id:req.query.schoolnames,
      student_id:req.query.studentid,
      academic_year:req.query.Acadamicyear,
      grade:req.query.gradeid,
      section:req.query.sectionname,
      subject_id:req.query.subjectid,
      student_name:req.query.studentname,
      class_id:req.query.sectionid,
       lang_pref:req.query.langugagepref
  
    }; 

    //console.log(JSON.stringify(response));
 var qur="SELECT * FROM  tr_student_to_subject WHERE school_id='"+req.query.schoolnames+"' and student_id='"+req.query.studentid+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and section='"+req.query.sectionname+"' and  student_name='"+req.query.studentname+"' and lang_pref='"+req.query.langugagepref+"'";


   
    var qur1="update tr_student_to_subject set subject_id='"+req.query.subjectid+"' where student_id='"+req.query.studentid+"' and school_id='"+req.query.schoolnames+"' and academic_year='"+req.query.Acadamicyear+"' and grade='"+req.query.gradeid+"' and student_name='"+req.query.studentname+"'and class_id='"+req.query.sectionid+"'and lang_pref='"+req.query.langugagepref+"'";

   connection.query(qur,function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO tr_student_to_subject SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          //console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
 });

app.post('/SelectSchoolName-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      //console.log(e);
      var qur="select * from md_school where id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          //console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });
   app.post('/SelectSchoolgrades-service' ,urlencodedParser,
  function (req, res)

{  
  var qur="select grade_id,grade_name from md_grade";
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
       //console.log(rows);
    }

    else
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });    
});


app.post('/fetchschooltypename-service',  urlencodedParser,function (req,res)
{ 
  var qur="SELECT * FROM md_school_type";
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
      if(rows.length>0)  
        { 
          //console.log(JSON.stringify(rows));   
          res.status(200).json({'returnval': rows});
        }
       else if(rows.length==0|| row.length==null)
        { 
          //console.log(JSON.stringify(rows));  
          res.status(200).json({'returnval': 'empty'});
        }
    }
          
    else
      res.status(200).json({'returnval': 'invalid'});
    });
    
});
app.post('/selectschooltype1-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      //console.log(e);
      var qur="select * from master_school_type where school_id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }
   
        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });

app.post('/selectschoolnames-service' ,urlencodedParser, function (req, res)
    {  
      var qur="select * from md_school";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }
   
        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });


app.post('/studentsectiontype-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      ///console.log(e);
      var qur="select * from master_school_type where school_id='"+req.query.school_id+"'";
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });
app.post('/fnretrivestudent-service' ,urlencodedParser, function (req, res)
    {  
      var e={id:req.query.school_id};
      ///console.log(e);
      var qur="select * from md_student where school_id='"+req.query.school_id+"' and grade_id='"+req.query.gradeid+"' and academic_year='"+req.query.academic_year+"'";
    //  console.log(qur);
      connection.query(qur,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });

app.post('/fnsetz-service' ,urlencodedParser, function (req, res)
    {  
     var qur3="SELECT * FROM md_book_value  where capter_id='"+req.query.chapterid+"'";

    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });

app.post('/buffset-service' ,urlencodedParser, function (req, res)
    {  
     var qur3="SELECT * FROM md_chapter  where capter_id='"+req.query.capter_id+"'";

    console.log(qur3);
      connection.query(qur3,function(err, rows){
        if(!err){

          res.status(200).json({'returnval': rows});
          console.log(rows);
        }

        else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});

      });
    });





app.post('/fnsetstudentinfo-service' , urlencodedParser,function (req, res)
{  
   var response={

     
      school_id:req.query.school_id,
      id:req.query.id,
      student_name:req.query.student_name,
      class_id:req.query.classid,
      dob:req.query.dob,
      school_type:req.query.school_type,
      gender:req.query.Gender,
      grade_id:req.query.stugradeid,
      academic_year:req.query.academic_year,
      }; 
  // console.log(JSON.stringify(response));
   var qur= "SELECT * FROM  md_student WHERE school_id='"+req.query.school_id+"' and id='"+req.query.id+"' and student_name='"+req.query.student_name+"' and  academic_year='"+req.query.academic_year+"'";
   
    var qur1="update md_student set class_id='"+req.query.classid+"',grade_id='"+req.query.stugradeid+"',school_type='"+req.query.school_type+"' where school_id='"+req.query.school_id+"' and id='"+req.query.id+"' and     academic_year='"+req.query.academic_year+"'";

   // console.log(qur);
   // console.log(qur1)
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     // console.log('1');
     connection.query("INSERT INTO md_student SET ?",[response],
    function(err, rows)
    {
    if(!err)
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });   
        } 
      });   
});


app.post('/fngetpasssectinvaluezzz-service',  urlencodedParser,function (req,res)
  {  
   var qur="SELECT * FROM md_workingdays where school_id='"+req.query.school_id+"' and school_type='"+req.query.schooltype+"' and academic_year='"+req.query.acadamicyear+"'";
    //console.log(qur);
     connection.query(qur,
    function(err, rows)
    {
    if(!err)
    { 
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': ''}); 
  });
});



app.post('/fetchschooltypesforgradetorolemap-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM master_school_type where school_id='"+req.query.schoolid+"' ";
   // console.log('------------school type-------------');
    //console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchgradesforgradetorolemap-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_school_grade_mapping where school_id='"+req.query.schoolid+"' and school_type='"+req.query.type+"' and academic_year='"+req.query.academicyear+"'";
   // console.log('------------school grade-------------');
   // console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fetchrolesforgradetorolemap-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_role where priority='1'";
   // console.log('------------school role-------------');
   // console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});


app.post('/generateroletogrademappinginfo-service',  urlencodedParser,function (req,res)
  {  
    var qur1="SELECT * FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and grade_id='"+req.query.gradeid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"'";
    var qur2="SELECT *,g.grade_id FROM md_class_section c join md_grade g on (g.grade_name=class) WHERE school_id='"+req.query.schoolid+"' and class='"+req.query.gradename+"' and academic_year='"+req.query.academicyear+"'";
    var qur3="select * from employee_to_school_type_category_mapping m join md_employee e "+
             "on(m.emp_id=e.id) where m.school_id='"+req.query.schoolid+"' and e.school_id='"+req.query.schoolid+"' and  "+
             "e.academic_year='"+req.query.academicyear+"' and m.academic_year='"+req.query.academicyear+"' and "+
             "m.school_type='"+req.query.type+"' and e.role_id='"+req.query.roleid+"' and m.flage='active'";
   // console.log('------------school role-------------');
    //console.log(qur1);
    //console.log('------------------------------------');
    //console.log(qur2);
    //console.log('------------------------------------');
    //console.log(qur3);
    //console.log('------------------------------------');
    var maparr=[];
    var secarr=[];
    var emparr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    maparr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    secarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    { 
    emparr=rows;
      res.status(200).json({'maparr': maparr,'secarr':secarr,'emparr':emparr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});
app.post('/fngetskill-service',  urlencodedParser,function (req,res)
  {  

 var qur1="SELECT * FROM md_skill where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";
 
 var qur3="SELECT * FROM md_book_value  where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and  grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";


    var qur2="SELECT * FROM master_value";
    console.log(qur1);
    console.log(qur2);
    console.log(qur3);
    var skillarr=[];
    var valuearr=[];
    var masstrvaluearr=[];
  
  connection.query(qur1,function(err, rows){
    if(!err)
    {  
     if(rows.length>0)
    {
      //console.log(rows);
     skillarr=rows;
     }
    else
    {
    skillarr="empty";
    }
    connection.query(qur3,function(err, rows){
    if(!err)
    {  
    if(rows.length>0)
    {
      //console.log(rows);
     valuearr=rows;
     }
    else
    {
    valuearr="empty";
    }
    connection.query(qur2,function(err, rows){
    if(!err)
    { 
    masstrvaluearr=rows;
      res.status(200).json({'skillarr': skillarr,'valuearr':valuearr,'masstrvaluearr':masstrvaluearr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});
app.post('/generateroletogrademappinginfo-service1',  urlencodedParser,function (req,res)
  {  
    var qur1="SELECT * FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and role_id='"+req.query.roleid+"' and academic_year='"+req.query.academicyear+"'";
    var qur2="SELECT * FROM md_school_grade_mapping WHERE school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academicyear+"' and school_type='"+req.query.type+"'";
   var qur3="select * from employee_to_school_type_category_mapping m join md_employee e "+
             "on(m.emp_id=e.id) where m.school_id='"+req.query.schoolid+"' and e.school_id='"+req.query.schoolid+"' and  "+
             "e.academic_year='"+req.query.academicyear+"' and m.academic_year='"+req.query.academicyear+"' and "+
             "m.school_type='"+req.query.type+"' and e.role_id='"+req.query.roleid+"' and m.flage='active'";
    var maparr=[];
    var secarr=[];
    var emparr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    maparr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    secarr=rows;
    connection.query(qur3,function(err, rows){
    if(!err)
    { 
    emparr=rows;
      res.status(200).json({'maparr': maparr,'secarr':secarr,'emparr':emparr});
    }
    });
    }
    });
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/deletegraddeleteetorolemapping-service',  urlencodedParser,function (req,res)
  {  
    if(req.query.roleid=='class-teacher')
    var qur="DELETE FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' and grade_id='"+req.query.class+"' "+
    " and school_type='"+req.query.schooltype+"' and role_id='"+req.query.roleid+"'";
    if(req.query.roleid=='co-ordinator'||req.query.roleid=='headmistress')
    var qur="DELETE FROM mp_teacher_grade WHERE school_id='"+req.query.schoolid+"' and "+
    " academic_year='"+req.query.academicyear+"' "+
    " and school_type='"+req.query.schooltype+"' and role_id='"+req.query.roleid+"'";
    console.log('------------school role-------------');
   // console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Deleted!'});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/savegradetorolemapping-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO mp_teacher_grade SET ?";
    var response={
      school_id:req.query.schoolid,
      id:req.query.empid,
      grade_id:req.query.class,
      subject_id:"",
      role_id:req.query.roleid,
      section_id:req.query.section,
      flage:req.query.flage,
      class_id:req.query.classid,
      academic_year:req.query.academicyear,
      school_type:req.query.schooltype
    };
    console.log('------------school role-------------');
   // console.log(qur);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});
  

 app.post('/Selectemp-service' ,urlencodedParser,
  function (req, res)

{  
 /* var qur="select distinct id,(select emp_name from md_employee_creation where emp_id=id and school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"') as name from mp_teacher_grade where school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"' and flage='active'";*/
 var qur="select emp_id,emp_name from md_employee_creation where school_id='"+req.query.school_id+"'and academic_year='"+req.query.academic_year+"'";
    console.log(qur);
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
      console.log(rows);
    }

    else
    //  console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });    
});



 app.post('/empreport-service' ,urlencodedParser,
  function (req, res)

{  
   var em={school_id:req.query.school_id,academic_year:req.query.academic_year,id:req.query.empid};
  var qur="SELECT s.id,p.grade_id,UPPER(p.grade_name)as grade_name,UPPER(s.section_id) as section_id,r.subject_id,UPPER(r.subject_name) as subject_name,(Select UPPER(emp_name) from md_employee_creation WHERE  emp_id=id and school_id= '"+req.query.school_id+"' and  academic_year='"+req.query.academic_year+"') as name FROM  mp_teacher_grade s join md_grade p on (s.grade_id=p.grade_id) join  md_subject r  on(s.subject_id=r.subject_id)  WHERE s.school_id= '"+req.query.school_id+"' and  s.academic_year='"+req.query.academic_year+"' and s.id='"+req.query.id+"'";
  console.log(qur);
  connection.query(qur,function(err, rows){
    if(!err){

      res.status(200).json({'returnval': rows});
      console.log(rows);
    }

    else
    //  console.log(err);
      res.status(200).json({'returnval': 'invalid'});

  });    
});





app.post('/studentgrade-service',  urlencodedParser,function (req,res)
{
  var qur1="SELECT grade_name,grade_id FROM md_school_grade_mapping where school_id='"+req.query.schoolid+"'  and academic_year='"+req.query.academic_year+"'";
//  console.log(qur1);

   connection.query(qur1,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
         // console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});



app.post('/selectclass-service',  urlencodedParser,function (req,res)
{
 
/* var qur="SELECT UPPER(section_id),class_id FROM master.mp_grade_section where school_id='"+req.query.schlid+"' and grade_id='"+req.query.gradeid+"' and  academic_year='"+req.query.academic_year+"'";*/

 var qur="SELECT UPPER(p.section_id)as section_id, p.class_id FROM md_school_grade_mapping s join mp_grade_section p  on s.grade_id=p.grade_id  where p.school_id='"+req.query.schlid+"' and s.school_id='"+req.query.schlid+"' and p.grade_id='"+req.query.gradeid+"' and p.academic_year='"+req.query.academic_year+"' and s.academic_year='"+req.query.academic_year+"'";
  console.log(qur);

   connection.query(qur,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});


app.post('/selectallsection-service',  urlencodedParser,function (req,res)
{
  var qur1="select s.id,s.student_name,g.grade_name,a.admission_status,(select UPPER(section_id) from mp_grade_section ss where ss.grade_id='"+req.query.gradeid+"' and ss.class_id=s.class_id) as section from md_student s join md_school_grade_mapping g on (s.grade_id=g.grade_id) join md_admission a on(s.id=a.admission_no) where s.school_id='"+req.query.schlid1+"' and a.school_id='"+req.query.schlid1+"' and g.school_id='"+req.query.schlid1+"'and s.grade_id='"+req.query.gradeid+"' and s.academic_year='"+req.query.academic_year+"' and g.academic_year='"+req.query.academic_year+"' order by student_name";

console.log("-------Report---------");
  console.log(qur1);

   connection.query(qur1,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          //console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});
app.post('/selectallsection1-service',  urlencodedParser,function (req,res)
{ 
  var qur1="select s.id,s.student_name,g.grade_name,a.admission_status,(select UPPER(section_id) from mp_grade_section ss where ss.grade_id='"+req.query.gradeid+"' and ss.class_id=s.class_id) as section from md_student s join md_school_grade_mapping g on (s.grade_id=g.grade_id) join md_admission a on (s.id=a.admission_no) where s.school_id='"+req.query.schlid1+"' and a.school_id='"+req.query.schlid1+"' and g.school_id='"+req.query.schlid1+"'and s.grade_id='"+req.query.gradeid+"' and s.academic_year='"+req.query.academic_year+"' and g.academic_year='"+req.query.academic_year+"' and s.class_id='"+req.query.classname+"' order by student_name";

  console.log(qur1);

   connection.query(qur1,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          //console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});

app.post('/fetchchapter-service',  urlencodedParser,function (req,res)
{ 
  var qur2=" select * from md_chapter where school_id='"+req.query.schoolid+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"' and academic_year='"+req.query.academic_year+"'";

  console.log(qur2);

   connection.query(qur2,
    function(err, rows){
      if(!err)
      {
          res.status(200).json({'returnval': rows});
          //console.log(rows);
      }

      else
          //console.log(err);
          res.status(200).json({'returnval': 'invalid'});
      });
});







app.post('/bookreffixcapterdate-service',  urlencodedParser,function (req, res)
{
   var qur1;

if(req.query.roleid=='co-ordinator'){
 qur1="select emp_id,subject_id,section_id,grade_id,concept_id as consid,(select concept  from md_concept where  concept_id=consid) as conceptname, capter_id as capterid ,innovation,skill, (select s.capter from md_chapter s where s.capter_id=capterid    and s.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academic_year+"' and s.gradeid='"+req.query.gradeid+"' and s.subjectid='"+req.query.subjectid+"') as chaptername from md_skill where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and capter_id='"+req.query.chapterid+"' and concept_id='"+req.query.conceptid+"' and flag='active'";
}
else if(req.query.roleid=='class-teacher'){
 qur1="select * from md_chapter where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"'";   
} 
else if(req.query.roleid=='subject-teacher'){
 qur1="select * from md_chapter where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"'";   
}
else if(req.query.roleid=='principal' ||req.query.roleid=='headofedn'||req.query.roleid=='headmistress'||req.query.roleid=='viceprincipal'){

 qur1="select emp_id,subject_id,section_id,grade_id,concept_id as consid,(select concept  from md_concept where  concept_id=consid) as conceptname, capter_id as capterid ,innovation,skill, (select s.capter from md_chapter s where s.capter_id=capterid    and s.school_id='"+req.query.schoolid+"' and s.academic_year='"+req.query.academic_year+"' and s.gradeid='"+req.query.gradeid+"' and s.subjectid='"+req.query.subjectid+"') as chaptername from md_skill where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"'  and  section_id='"+req.query.sectionid+"' and emp_id='"+req.query.empid+"' and flag='coaprove' and flag!='preaprove'";

}
  console.log(qur1);

  connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/bookrefsectioncapter-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO md_chapter SET ?";
    var response={ 
      school_id:req.query.school_id,
      gradeid:req.query.gradeid,
      subjectid:req.query.subjectid,
      academic_year:req.query.academic_year,
      capter:req.query.capter,
      capter_id:req.query.capter_id,
      period:req.query.period,
      buffer_period:req.query.buffer_period
    };
    console.log('------------school book-------------');
    console.log(response);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {   

    var tempseq1=parseInt((req.query.capter_id).substring(2))+1;
      connection.query("UPDATE sequence SET chapter_sequence='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });
   }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});


app.post('/getcaptervalue-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_chapter where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and gradeid='"+req.query.grade_id+"' and subjectid='"+req.query.subject_id+"'";
    
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});  


app.post('/fngetconceptvalue11-service',  urlencodedParser,function (req,res)
  {  
    var qur="SELECT * FROM md_concept where capter_id='"+req.query.capter_id+"'";
    console.log(qur);
    connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': rows});
    }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});


app.post('/fnsendconcept-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO md_concept SET ?";
    var response={ 
       concept_id:req.query.concept_id,
       concept:req.query.concept,
       capter_id:req.query.capter_id,
       period:req.query.period,
       planned_date:req.query.planned_date,
       };
    console.log('------------school book-------------');
    console.log(response);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {   

    var tempseq1=parseInt((req.query.concept_id).substring(3))+1;
      connection.query("UPDATE sequence SET concept_sequence='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });
   }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/fnsetcoskill-service',  urlencodedParser,function (req,res)
  {  
    var qur="INSERT INTO md_concept SET ?";
    var response={ 
       concept_id:req.query.concept_id,
       concept:req.query.concept,
       capter_id:req.query.capter_id,
       period:req.query.period,
       skill:req.query.skill,
       innovation:req.query.innovation,
       planned_date:req.query.planned_date,
       remark:req.query.remark,
       completestatus:req.query.completestatus,
       };
    console.log('------------school book-------------');
    console.log(response);
    connection.query(qur,[response],
    function(err, rows)
    {
    if(!err)
    {   

    var tempseq1=parseInt((req.query.concept_id).substring(3))+1;
      connection.query("UPDATE sequence SET concept_sequence='"+tempseq1+"'", function (err,result)
      {
        if(result.affectedRows>0)
         res.status(200).json({'returnval': 'Inserted'});
      });
   }
    else
     res.status(200).json({'returnval': 'no rows'}); 
  });
});

app.post('/skillvalue-service' , urlencodedParser,function (req, res)
{  

 
    var response={ 
      concept_id:req.query.concept_id,
      skill:req.query.skillvalue,
      innovation:req.query.innovation,
      capter_id:req.query.capter_id,
      grade_id:req.query.grade_id,
      subject_id:req.query.subject_id,
      academic_year:req.query.academic_year,
      school_id:req.query.school_id,
      todate:req.query.todate,
      fromdate:req.query.fromdate,
      flag:req.query.flag,
      period:req.query.period

   };

      console.log(response);
  var qur="SELECT * FROM md_skill WHERE  school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and academic_year='"+req.query.academic_year+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";

    var qur1="UPDATE md_skill set skill='"+req.query.skillvalue+"',innovation='"+req.query.innovation+"', fromdate='"+req.query.fromdate+"',todate='"+req.query.todate+"',period='"+req.query.period+"'  where school_id='"+req.query.school_id+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and academic_year='"+req.query.academic_year+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";
    console.log(qur);
    console.log(qur1)
   connection.query(qur,
    function(err, rows)
    {
     if(rows.length==0){
     connection.query("INSERT INTO md_skill SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
    }
    else{
       connection.query(qur1,function(err, rows){  
          console.log('update');
        if(!err)
        res.status(200).json({'returnval': 'updated successfully'});
        else
        res.status(200).json({'returnval': 'not updated'});
        });
        } 
      });
});
app.post('/captvalues-service' , urlencodedParser,function (req, res)
{  

   var response={ 
      concept_id:req.query.concept_id,
      value_id:req.query.value_id,
      value_name:req.query.value_name,
      capter_id:req.query.capter_id,
      flag:req.query.flag
      };
     connection.query("INSERT INTO md_book_value SET ?",[response],
    function(err, rows)
    {
    if(!err)   
    {
      res.status(200).json({'returnval': 'Inserted!'});
    }
    else
    {
      res.status(200).json({'returnval': 'Not Inserted!'});
    }
    });
});
app.post('/emplschooltype11-service',  urlencodedParser,function (req, res)
{

 var qur="select distinct(t.id),t.subject_id,t.grade_id,UPPER(t.section_id)as section_id,UPPER(e.emp_name)as emp_name,(select UPPER(grade_name) from md_grade g where g.grade_id=t.grade_id)as grade_name,(select UPPER(subject_name) from md_subject  where subject_id=t.subject_id)as subject_name from mp_teacher_grade t join md_employee_creation e  on(e.emp_id=t.id) where t.school_id='"+req.query.school_id+"' and t.academic_year='"+req.query.academic_year+"' and t.school_type='"+req.query.schooltypeid+"' and e.school_id='"+req.query.school_id+"'and e.academic_year='"+req.query.academic_year+"' and t.role_id LIKE '%subject-teacher%'";

  console.log("----------Employee with School type----------");
  console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      //console.log(rows);
      res.status(200).json({'returnval': rows});
    }
    else
    {
      //console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});


app.post('/Selectempschooltype-service',  urlencodedParser,function (req,res)
{  
   var qur="SELECT * FROM master_school_type where school_id='"+req.query.school_id+"'";
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/fndateconcept-service',  urlencodedParser,function (req,res)
{  
 var qur1="SELECT * FROM md_concept where capter_id='"+req.query.capter_id+"'";
  var qur2="SELECT * FROM md_concept_date where capter_id='"+req.query.capter_id+"'and flage='active'";
     var conceptarr=[];
 var conceptdatearr=[];
  
   connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
  conceptdatearr=rows;
  res.status(200).json({'conceptarr':conceptarr,'conceptdatearr':conceptdatearr});
    }
    });
    }
     else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/getappovedcoordinator-service',  urlencodedParser,function (req,res)
{  
   var qur="select distinct grade_id as gradeid ,(select grade_name from  md_grade where grade_id=gradeid) as gradename from mp_teacher_grade where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and id='"+req.query.emp_id+"' and role_id='"+req.query.roleid+"'";
   console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/bookapprvvalsubject-service',urlencodedParser,function (req,res)
{  
  var qur1="select   distinct subject_id as subjectid,(select subject_name from md_subject where subject_id=subjectid) as subjectname from mp_teacher_grade where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'  and class_id='"+req.query.section+"'";
  console.log(qur1);

     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


app.post('/masterbookz-service',urlencodedParser,function (req,res)
{  
  var qur1="select * from master_value";
  console.log(qur1);

     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/bookvaluez-service',urlencodedParser,function (req,res)
{  
  var qur1;
   if(req.query.roleid=='co-ordinator'){
    qur1="select * from md_book_value where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"'  and  section_id='"+req.query.section_id+"' and emp_id='"+req.query.emp_id+"' and flag='active'";
  
   }
   else if(req.query.roleid=='principal' ||req.query.roleid=='headofedn'||req.query.roleid=='headmistress'||req.query.roleid=='viceprincipal'){

     qur1="select * from md_book_value where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"'  and  section_id='"+req.query.section_id+"' and emp_id='"+req.query.emp_id+"' and flag='coaprove'and  flag!='preaprove'";
  
   }
   
  console.log(qur1);

     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});

app.post('/fngetconceptvalue-service',  urlencodedParser,function (req,res)
  {  
      var qur1="SELECT * FROM md_concept where capter_id='"+req.query.capter_id+"'";
      var qur2="SELECT * FROM md_chapter where capter_id='"+req.query.capter_id+"'";
   console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var chapterarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    chapterarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'chapterarr':chapterarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});


app.post('/fngetclassbooksubjectvalue-service',  urlencodedParser,function (req,res)
  {  
   
     var qur1="select capter_id ,capter from md_chapter where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and gradeid='"+req.query.gradeid+"' and subjectid='"+req.query.subjectid+"' and capter_id in(select r.capter_id from md_concept r where r.capter_id=capter_id)";
     
    var qur2="SELECT distinct class_id,section_id FROM mp_teacher_grade  where grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"' and role_id='subject-teacher'";

     var qur3="SELECT distinct class_id,section_id FROM mp_teacher_grade  where grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"' and role_id='subject-teacher' and class_id  not in( select distinct  section_id FROM final_book_sug where grade_id='"+req.query.gradeid+"' and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and subject_id='"+req.query.subjectid+"')";
   
    console.log(qur1);
    console.log(qur2);
    console.log(qur3);
    var conceptarr=[];
    var sectionarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    sectionarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'sectionarr':sectionarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fetchconcept-service',  urlencodedParser,function (req,res)
  {  
      var qur1="SELECT * FROM md_concept where capter_id='"+req.query.chapterid+"'";
      var qur2="SELECT * FROM md_chapter where capter_id='"+req.query.chapterid+"'";
    console.log(qur1);
    console.log(qur2);
    var conceptarr=[];
    var chapterarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    conceptarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    chapterarr=rows;
    res.status(200).json({'conceptarr': conceptarr,'chapterarr':chapterarr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/bookrefsection-service',  urlencodedParser,function (req,res)
  {  
    var qur1="select subject_id as subjectid,subject_name as subjectname from md_subject";
    var qur2="SELECT * FROM md_class_section where  school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and class='"+req.query.gradename+"'";
    console.log(qur1);
    console.log(qur2);
    var subjectarr=[];
    var sectionarr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    subjectarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    sectionarr=rows;
    res.status(200).json({'subjectarr': subjectarr,'sectionarr':sectionarr});
    }
    });
    }
    else
     res.status(200).json({'':'no rows'}); 
  });
});

app.post('/fetchclassconcept-service', urlencodedParser,function (req,res)
  {  
var qur1="select * from md_concept where capter_id='"+req.query.chapterid+"'";

var qur2="SELECT distinct id as empid,(select distinct emp_name from md_employee_creation where emp_id=empid and school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"') as empname FROM mp_teacher_grade where  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"' and subject_id='"+req.query.subjectid+"' and class_id='"+req.query.sectoinid+"' ";
    console.log(qur1);
    console.log(qur2);
    var skillarr=[];
    var emparr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    skillarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    emparr=rows;
    res.status(200).json({'skillarr': skillarr,'emparr':emparr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/fnbookplangrade-service',  urlencodedParser,function (req,res)
  {  
      var qur1="select distinct grade_id as gradeid,(select distinct grade_name from md_grade where grade_id=gradeid) as gradename from mp_teacher_grade where academic_year='"+req.query.academic_year+"' and id='"+req.query.emp_id+"' and  role_id='"+req.query.roleid+"' and school_id='"+req.query.schoolid+"'";

 
     connection.query(qur1,
    function(err, rows)
    {
    if(!err)
    {    
     // console.log(JSON.stringify(rows));   
      res.status(200).json({'returnval': rows});
    }
    else
      res.status(200).json({'returnval': ''});
  });
});


/*app.post('/fngetskill-service',  urlencodedParser,function (req,res)
  {  

    var qur1="SELECT * FROM md_skill where school_id='"+req.query.school_id+"' and academic_year='"+req.query.academic_year+"' and emp_id='"+req.query.emp_id+"' and grade_id='"+req.query.grade_id+"' and subject_id='"+req.query.subject_id+"' and  section_id='"+req.query.section_id+"' and capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";
   
    var qur2="SELECT * FROM master_value";
    console.log(qur1);
    console.log(qur2);
    var skillarr=[];
    var valuearr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    skillarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  
    if(rows.length>0)
    {
      //console.log(rows);
     valuearr=rows;
     }
    else
    {
    valuearr="empty";
    }
    res.status(200).json({'skillarr': skillarr,'valuearr':valuearr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});
*/
app.post('/fngetclassbookpdf-service',  urlencodedParser,function (req,res)
  {  
    var qur1="SELECT  concept_id as consid,(select concept  from md_concept where  concept_id=consid) as conceptname, capter_id as capterid ,innovation,skill, (select s.capter from md_chapter s where s.capter_id=capterid    and s.academic_year='"+req.query.academic_year+"' and s.gradeid='"+req.query.grade_id+"' and s.subjectid='"+req.query.subject_id+"') as chaptername  FROM md_skill where emp_id='"+req.query.emp_id+"' and  subject_id='"+req.query.subject_id+"' and  section_id='"+req.query.section_id+"' and  grade_id='"+req.query.grade_id+"'  and flag='preaprove' and academic_year='"+req.query.academic_year+"'";

  var qur2=" SELECT  concept_id as consid,(select concept  from md_concept where  concept_id=consid) as conceptname, capter_id as capterid ,value_id,value_name, (select s.capter from md_chapter s where s.capter_id=capterid  and s.academic_year='"+req.query.academic_year+"' and s.gradeid='"+req.query.grade_id+"' and s.subjectid='"+req.query.subject_id+"') as chaptername  from md_book_value where emp_id='"+req.query.emp_id+"' and  subject_id='"+req.query.subject_id+"' and  section_id='"+req.query.section_id+"' and  grade_id='"+req.query.grade_id+"' and flag='preaprove' and academic_year='"+req.query.academic_year+"'";

    console.log("---------------------");
    console.log(qur1);
    console.log("----------------------");
    console.log(qur2);
    var skillarr=[];
    var valuearr=[];
    connection.query(qur1,function(err, rows){
    if(!err)
    {  
    skillarr=rows;
    connection.query(qur2,function(err, rows){
    if(!err)
    {  

    valuearr=rows;
    //console.log(skillarr);
    res.status(200).json({'skillarr': skillarr,'valuearr':valuearr});
    }
    });
    }
    else
     res.status(200).json({'': 'no rows'}); 
  });
});

app.post('/getbookinteacher-service',  urlencodedParser,function (req, res)
{
  var schoolid={school_id:req.query.schoolid};
  var roleid={role_id:req.query.roleid};
  console.log(roleid);

 var qur="select distinct id as empid,(select  distinct emp_name from md_employee_creation where emp_id=empid and  school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"') as empname  from mp_teacher_grade  where school_id='"+req.query.schoolid+"' and academic_year='"+req.query.academic_year+"' and grade_id='"+req.query.gradeid+"'";
  
  console.log('-------------------grade----------------------');
  console.log(qur);
     connection.query(qur, function(err, rows)
    {
    if(!err)
    {
    if(rows.length>0)
    {
      res.status(200).json({'returnval': rows});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'invalid'});
    }
    }
    else
      console.log(err);
  });
});

app.post('/fnbookupdatevalue-service',  urlencodedParser,function (req, res)
{  
   /* var obj={"capter_id":"","concept":"","concept_id":"","showdate":""};
   */
var qur="update md_concept set  concept='"+req.query.concept+"',planned_date='"+req.query.planned_date+"',period='"+req.query.period+"' where capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});
app.post('/fnbookeditskill-service',  urlencodedParser,function (req, res)
{  
   
   var qur="update md_concept set  concept='"+req.query.concept+"',period='"+req.query.period+"',skill='"+req.query.skill+"',innovation='"+req.query.innovation+"',remark='"+req.query.remark+"',completestatus='"+req.query.completestatus+"' where capter_id='"+req.query.capter_id+"' and concept_id='"+req.query.concept_id+"'";
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


app.post('/buffset1-service',  urlencodedParser,function (req, res)
{  
   
   var qur="update md_chapter set  buffer_period='"+req.query.bufperiod+"' where capter_id='"+req.query.capter_id+"'";
console.log(qur);

  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});

app.post('/buffdel-service',  urlencodedParser,function (req, res)
{  
   
   var qur="update md_chapter set  period='"+req.query.delperiod+"' where capter_id='"+req.query.capter_id+"'";
  console.log(qur);
  connection.query(qur,
    function(err, rows)
    {
    if(!err)
    {    
      res.status(200).json({'returnval': 'Updated'});
    }
    else
    {
      console.log(err);
      res.status(200).json({'returnval': 'fail'});
    }  

  });
});


var server = app.listen(3000, function () {
var host = server.address().address
var port = server.address().port
console.log("Example app listening at http://%s:%s", host, port)
});



