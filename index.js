const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cookieParser = require ('cookie-parser')
const { response } = require('express');
const csurf = require('csurf');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded())
app.use(bodyParser.json());
app.use(express.static('public'));


var connection = mysql.createConnection({

    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'kubik'
});

var db = connection.connect(
    function (err) {
        if (err) {
            console.error('error connectin:' + err.stack);
            return;
        }
        console.log('connecting is Ok');
    }
);

//ПОЛУЧЕНИЕ

app.get('/', function (req, res) {
    connection.query('SELECT IDCourse, NameCourse, Age, AboutCourse, NameSort FROM course LEFT JOIN sort ON IDSort = ID_Sort WHERE ID_Sort=1', function (err, rows1) {
        if (err) throw err;
        connection.query('SELECT IDCourse, NameCourse, Age, AboutCourse, NameSort FROM course LEFT JOIN sort ON IDSort = ID_Sort WHERE ID_Sort=2', function (err, rows2) {
            if (err) throw err;
            connection.query('SELECT IDCourse, NameCourse, Age, AboutCourse, NameSort FROM course  LEFT JOIN sort ON IDSort = ID_Sort WHERE ID_Sort = 5', function (err, rows3) {
                if (err) throw err;
                connection.query('SELECT TextFeedback, Author FROM Feedback WHERE ID_StRev = 1', function (err, feed_row) {
                    if (err) throw err;
                    res.render('indexadap.hbs', { menu1: rows1, menu2: rows2, menu3: rows3, menu4: feed_row });
                });
            });
        });
    });
});



app.get('/aboutcourse/:productid', function (req, res) {
    let idcourse = req.params["productid"]
    connection.query(`SELECT  IDCourse,NameCourse, Age, AboutCourse,LessonInCourse, LessonInWeek, Duration, NameFormat\
    from course, kformat\
    where IDCourse = "${idcourse}"\
    and course.ID_Format = kformat.IDFormat`, function (err, cour) {
        if (err) throw err;
        connection.query(`SELECT TextInfo from Info where info.IDCourse = ${idcourse} `, function (err, info) {
            res.render('\aboutcourse.hbs', { menu10: cour, menu11: info });

        });
    });
});
// страницы учеников
app.get('/studtask/:idstudent',function (req, res) {
    let idstudent = req.params["idstudent"];
    connection.query(`select * from todolist m
    inner join kuser k on m.ID_User = k.IDUser
    where k.Login = "${idstudent}"`,(err,task)=>{
        connection.query(`select * from kuser
        WHERE Login= "${idstudent}"`, (err, stuid)=>{
            let numstud = stuid.map(a=> a.IDUser)[0];
            res.render('\Student/studtask.hbs',{ idstudent, menutask:task, numstud})
        })
    
    })
})
app.get('/studschedule/:idstudent',function (req, res) {
    let idstudent = req.params["idstudent"];
    connection.query(`select IDStudent,Login, DateLesson, NameCourse, p.NamePerson as NameStudent, per.NamePerson as NameTeacher  from kschedule sch
    inner join kgroup kg on sch.ID_Group = kg.IDGroup
    inner join study st on kg.ID_Study = st.IDStudy
    inner join student s on st.IDStudy = s.ID_Study
    inner join person p on s.ID_Person = p.IDPerson
    inner join course c on kg.ID_Course = c.IDCourse
    inner join teacher t on c.ID_Teacher = t.IDTeacher
    inner join person per on t.ID_Person = per.IDPerson
    inner join kuser k on p.ID_User = k.IDUser
    where Login = "${idstudent}"`, (err,sch)=>{
        res.render('\Student/studschedule.hbs', { idstudent, menusch:sch})
    })
   
})
app.get('/message/:idstudent', function (req, res) {

    let idstudent = req.params["idstudent"];
    connection.query(`select * from message m
    inner join kuser k on m.ID_User = k.IDUser
    where k.Login = "${idstudent}"`,(err,mas)=>{
        res.render('\Student/message.hbs', { idstudent,masmes:mas})
    })
   
})
app.get('/studentpanel/:idstudent', function (req, res) {
    let idstudent = req.params["idstudent"];
    connection.query(`select IDCourse, NameGroup,NameCourse,DateStudy, ku.Login NamePerson from kgroup kg
                        inner join course c on kg.ID_Course = c.IDCourse
                        inner join study st on kg.ID_Study = st.IDStudy
                        inner join student s on st.IDStudy = s.ID_Study
                        inner join person p on s.ID_Person = p.IDPerson
                        inner join kuser ku on p.ID_User = ku.IDUser
                        Where ku.Login = '${idstudent}' `, (err, teac) =>{
                            let Course = teac.map(a => a.IDCourse);
                            connection.query(`select IDCourse,NameCourse, NumberLesson, Topic, DocForTeacher, DocForStudent from course c
                            inner join lesson l on l.ID_Course = c.IDCourse
                            where c.IDCourse = ${Course}`, (err, teach)=> {
                                res.render('\Student/student.hbs', { masinfo : teach, masscor: teac, idstudent})
                            })
                            
                        })
                        
})

app.get('/course/:idteacher/:idcourse', (req,res) =>{
    let course = req.params['idcourse'];
    let idteacher = req.params["idteacher"];

    connection.query(`SELECT Topic, DocForTeacher FROM lesson
    WHERE ID_Course = ${course}`, function(err, cour){
        connection.query(`SELECT NameCourse FROM course
        WHERE IDCourse = ${course}`, (err,cour2)=>{
            NCourse = cour2.map(a => a.NameCourse)
            res.render('\Teacher/course.hbs', { mas: cour, idteacher, NCourse})
        })
        
    })
})

//страницы преподавателей
app.get('/teacherpanel/:idteacher', function (req, res) {
    let idteacher = req.params["idteacher"];
    connection.query(`select IDCourse, NameCourse, ku.Login, NamePerson from  teacher t
    inner join person p on t.ID_Person = p.IDPerson
    inner join course c on c.ID_Teacher = t.IDTeacher
    inner join kuser ku on ku.IDUser = p.ID_User
    where ku.Login = '${idteacher}'`, function(err, teach) {
        if (err) throw err;
        let Course = teach.map(a=>a.IDCourse)
        connection.query(`select NamePerson from teacher t
        inner join person p on t.ID_Person = p.IDPerson
        inner join kuser ks on p.ID_user = ks.IDUser
        where ks.Login = '${idteacher}'`, function(err, nam){
            connection.query(`select IDCourse,NameCourse, NumberLesson, Topic, DocForTeacher, DocForStudent from course c
            inner join lesson l on l.ID_Course = c.IDCourse`, function( err,cor){
                if (err) throw err;
                res.render('\Teacher/teacher.hbs',{menuteach:teach, menucor:cor, menunam:nam, idteacher })
            })
           
        })
        
    })
 
})
// расписание преподавателя
app.get('/teacherschedule/:idteacher', function (req, res) {
    let idteacher = req.params["idteacher"];
    connection.query(`  select DateLesson, NameCourse, NameGroup from kschedule ks
    inner join teacher t on ks.ID_Teacher = t.IDTeacher
    inner join course c on  ks.ID_Course = c.IDCourse
    inner join kgroup kg on ks.ID_Group = kg.IDGroup
    inner join person p on t.ID_Person = p.IDPerson
    inner join kuser k on p.ID_User = k.IDUser
    where k.Login = "${idteacher}"`, function(err, sch){
        if (err) throw err;
        res.render('\Teacher/teacherschedule.hbs', {menusch:sch, idteacher})
    })

   
})
app.get('/teachertask/:idteacher',  function (req, res) {
    let idteacher = req.params["idteacher"];
    connection.query(`select * from todolist m
    inner join kuser k on m.ID_User = k.IDUser
    where k.Login = "${idteacher}"`,(err,task)=>{
        connection.query(`select * from kuser
        WHERE Login= "${idteacher}"`, (err, teacid)=>{
            let numstud = teacid.map(a=> a.IDUser);
            res.render('\Teacher/teachertask.hbs',{idteacher, menutask:task, numstud})
        })
        
    })
})
//добавление уведомление препод
app.get('/teachermessage/:idteacher',function (req, res) {
    let idteacher = req.params["idteacher"];
    connection.query(`select NamePerson, IDUser from person p
    inner join kuser ks on p.ID_User = ks.IDUser
    inner join student st on p.IDPerson = st.ID_Person`, function(err, st){
        if (err) throw err;
        connection.query(`select * from message m
        inner join kuser ks on m.ID_User = ks.IDUser
        where ks.Login = "${idteacher}"`, function(err, mes){
          if (err) throw err;
            connection.query(`select * from kuser where Login = "${idteacher}"`, function(err, nt){
                if (err) throw err;
                connection.query(`select IDMessage,TextMessage, ks.Login as LoginFrom, k.IDUser as IDTo, ks.IDUser as IDFrom, p.NamePerson as NameTo,  p.NamePerson as NameFrom from message m
                inner join kuser k on m.ID_User = k.IDUser 
                inner join person p on p.ID_User = k.IDUser
                inner join kuser ks on m.ID_UserFrom = ks.IDUser
                inner join person per on per.ID_User = ks.IDUser
                where ks.Login = "${idteacher}"`, function(err, my){
                    res.render('\Teacher/teachermessage.hbs', {idteacher, menust:st, menumes:mes, menunt:nt, menumy:my})
                })
                
            })
           
        })
        
    })
    
})
// препод новое сообщение
app.post('/teachermessage/AddMes', function(req, res){
    let IDUs = req.body.NameSt;
    let Txt = req.body.txt;
    let IDFrom = req.body.NameTeach;
    let idteacher = req.body.stud;
    console.log(idteacher)
    connection.query(`INSERT INTO message (TextMessage, ID_User, ID_UserFrom) VALUES ('${Txt}',${IDUs}, ${IDFrom})`, function(err,mes){
        res.redirect('/teachermessage/'+idteacher)
    })
})
// удалить сообщение препод
app.post('/teachermessage/DelMes', function (req, res) {
    let IDMes = req.body.Mes;
    let idteacher = req.body.stud;
    connection.query(`DELETE FROM message WHERE IDMessage = ${IDMes}`)
        res.redirect('/teachermessage/'+idteacher)
});
//изменить сообщение препод
app.post('/teachermessage/UpMes',function(req, res){
    let Txt = req.body.Txt;
    let IDMes = req.body.Mes;
    let idteacher = req.body.teach;
   console.log(idteacher)
    connection.query(`UPDATE message SET TextMessage = '${Txt}' where IDMessage = '${IDMes}'`, function(err, mes){
        res.redirect('/teachermessage/'+ idteacher)
    })

})
// препод задачи добавление
app.post('/teachertask/AddTaskT', function (req, res) {
    let Task = req.body.Task;
    let idteacher = req.body.stud;
    let numst = req.body.num;
    console.log(Task+"  "+numst);
    connection.query(`INSERT INTO todolist(TextList,ID_User) VALUES ('${Task}',${numst}) `, (err, mas) => {
        res.redirect('/teachertask/'+idteacher)
    })
});
//ученик удаление задач
app.post('/studtask/delTaskSt', function (req, res) {
    let Task = req.body.ToName;
    let idstudent = req.body.stud;
    connection.query(`DELETE FROM todolist WHERE IDToDoList = ${Task}`)
        res.redirect('/studtask/'+idstudent)
});
app.get('/reviews', function (req, res) {

    //menu12
    connection.query('Select * from feedback f inner join statusrev s on f.ID_StRev = s.IDStRev', function (err, revs) {
        if (err) throw err;
        connection.query(`select * from statusrev`, function(err,st){
            res.render('\Admin/reviews.hbs', { menu12: revs, menu13:st });
        })
       
    })
});

app.get('/info',function (req, res) {
    connection.query('select IDInfo, TextInfo, NameCourse, c.IDCourse from info i, course c\
    where i.IDCourse = c.IDCourse', function (err, inf) {
        if (err) throw err;
        connection.query('select IDCourse, NameCourse from course', function (err, cor) {
            if (err) throw err;
            res.render('\Admin/info.hbs', { menuin: inf, menucor: cor });
        })

    })
})
//studgroup
app.get('/studgroup', function (req, res) {

    //menu13
    connection.query('select NameGroup, DateStudy, NameCourse, NamePerson\
    from kgroup, study, course, person,teacher\
    where kgroup.ID_Study = study.IDStudy\
    and kgroup.ID_course = course.IDCourse\
    and course.ID_teacher = teacher.IDTeacher\
    and teacher.ID_person = person.IDPerson', function (err, dt) {
        if (err) throw err;
        res.render('\Admin/studgroup.hbs', { menu13: dt, });

    })
});

//admintype
app.get('/admintype',  function (req, res) {
    connection.query('SELECT * FROM sort', function (err, sor) {
        res.render('\Admin/admintype.hbs', { menusor: sor })
    })

})
//programma
app.get('/programma', function (req, res) {
    connection.query('select IDCourse, IDLesson, NumberLesson, Topic, DocForTeacher, DocForStudent, NameCourse\
    from lesson, course\
    where lesson.ID_Course = course.IDCourse', function (err, sor) {
        if (err) throw err;
        connection.query('select * from course', function (err, cor) {
            res.render('\Admin/programma.hbs', { menusor: sor, menucor: cor })
        })

    })

})



//adminmessage
app.get('/adminmessage',  function (req, res) {
    connection.query(`select IDTeacher, IDPerson, NamePerson, ks.IDUser as IDT from kuser ks
    inner join person per on ks.IDUser = per.ID_User
    inner join teacher tr on per.IDPerson = tr.ID_Person`, function (err, per) {
        if (err) throw err;
        connection.query(`select IDStudent, IDPerson, NamePerson, IDUser from kuser ks
        inner join person p on ks.IDUser = p.ID_user
        inner join student st on p.IDPerson = st.ID_Person`, function (err, st) {
            if (err) throw err;
            connection.query('select * from kgroup', function (err, gr) {
                if (err) throw err;
                connection.query(`select IDMessage, TextMessage, NamePerson from message m
                inner join kuser  k on m.ID_User = k.IDUser 
                inner join person p on k.IDUser = p.ID_User`, function(err, ms){
                    res.render('\Admin/adminmessage.hbs', { menuper: per, menust: st, menugr: gr, menums:ms })
                })
              
            })
        })
    })

})

//admincourse
app.get('/admincourse', function (req, res) {
    connection.query('select IDCourse, IDSort, IDFormat, NameCourse, Age, AboutCourse, NameFormat, LessonInCourse, LessonInWeek, Duration, NameSort,NamePerson, IDTeacher\
    from course, sort, kformat, teacher, person\
    where course.ID_sort = sort.IDSort\
    and course.ID_format = kformat.IDFormat\
    and course.ID_teacher = teacher.IDTeacher\
    and teacher.ID_person = person.IDPerson', function (err, sor) {
        if (err) throw err;
        connection.query('select * from sort', function (err, sort) {
            if (err) throw err;
            connection.query('select * from kformat', function (err, form) {
                if (err) throw err;
                connection.query('select p.NamePerson,IDTeacher,IDPerson from teacher t\
                inner join person p on p.IDPerson =  t.ID_Person', function (err, teach) {
                    res.render('\Admin/admincourse.hbs', { menusor: sor, menusort: sort, menuform: form, menuteach: teach })
                })

            })

        })

    })
})

//date
app.get('/date',  function (req, res) {
    connection.query('SELECT IDStudy, DateStudy From study', function (err, dat) {
        if (err) throw err;
        res.render('\Admin/date.hbs', { menu16: dat })
    })
})

//users
app.get('/users', function (req, res) {
    connection.query('select * from kuser', function (err, us) {
        if (err) throw err;
        res.render('\Admin/users.hbs', { menuus: us })
    })

})
//person
app.get('/person', function (req, res) {
    connection.query('select * from person, kuser where person.ID_User = kuser.IDUser', function (err, pers) {
        if (err) throw err;
        connection.query('select * from kuser', function (err, us) {
            if (err) throw err;
            res.render('\Admin/person.hbs', {menupers: pers, menuus: us })
        })
    })

});
//student
app.get('/student', function (req, res) {
    connection.query('select per.NamePerson as NamePar, per2.NamePerson as NameStud, p.IDParent, s.IDStudent, st.DateStudy, IDStudent from parent p\
    inner join student s on p.IDParent =  s.ID_Parent\
    inner join person per on p.ID_Person = per.IDPerson\
    inner join person per2 on per2.IDPerson = s.ID_Person \
    inner join study st on s.ID_study = st.IDStudy', function (err, per) {
        if (err) throw err;
        connection.query('select  per.NamePerson as NamePar, p.IDParent, ID_Person from parent p\
        inner join person per on p.ID_Person = per.IDPerson', function (err, nam) {
            if (err) throw err;
            connection.query('select * from study', function (err, st) {
                if (err) throw err;
                connection.query('select * from person', function (err, np) {
                    if (err) throw err;
                    res.render('\Admin/student.hbs', { menuper: per, menunam: nam, menust: st, menunp: np })
                })

            })
        })
    })
})


//Adminstud
app.get('/adminstud', function (req, res) {
    connection.query(`select p.NamePerson as StN, p.Phone as StP, p.Birthday as StB,
    per2.NamePerson as ParN, per2.Phone as ParP, DocContract, Login,KPassword
     from student st
    inner join person p on st.ID_person = p.IDPerson
    inner join kuser ks on p.ID_User = ks.IDUser
    inner join parent par on st.ID_Parent = par.IDParent
    inner join person per2 on par.ID_Person = per2.IDPerson
    inner join contract con on st.IDStudent = con.ID_Student`, function (err, studs) {
        if (err) throw err;
        connection.query('select IDParent, parent.ID_Person AS PersonParentB,NamePerson, Phone\
        from person, parent\
        where parent.ID_Person = person.IDPerson', function (err, par) {
            if (err) throw err;
            connection.query('Select NameGroup from kgroup', function (err, gr) {
                res.render('\Admin/adminstud.hbs', { menustuds: studs, menupar: par, menup: par.length, menugr: gr, menug: gr.length });
            })

        })

    })

});

//parent
app.get('/parent',  function (req, res) {
    connection.query(`select * from parent p
    inner join person per on p.ID_person = per.IDPerson`, function (err, pers) {
        if (err) throw err;
        connection.query('select*from person', function (err, nam) {
            if (err) throw err;
            res.render('\Admin/parent.hbs', { menupers: pers, menunam: nam })
        })
    })

})
//teacher
app.get('/teacher',  function (req, res) {

    connection.query('select * from teacher, person\
        where teacher.ID_Person = person.IDPerson', function (err, pers) {
        if (err) throw err;
        connection.query('select * from  person', function (err, np) {
            res.render('\Admin/teacher.hbs', { menuper: pers, menunp: np })
        })


    })
})
//group
app.get('/group', function (req, res) {

    connection.query('select * from kgroup, study, course\
        where kgroup.ID_study = study.IDStudy\
        and kgroup.ID_Course = course.IDCourse', function (err, pers) {
        if (err) throw err;
        connection.query('select * from course', function (err, cor) {
            if (err) throw err;
            connection.query(`select * from study`, function (err, st){
                res.render('\Admin/group.hbs', { menuper: pers, menucor: cor, menust:st })
            })
           
        })
    })
})
//adminparent
app.get('/adminparent',function (req, res) {
    connection.query('select NamePerson, Address, Phone, Email, DocContract, DateContract, TheAmount\
    from parent, person, student, contract\
    where parent.ID_Person = person.IDPerson\
    and student.ID_Parent = parent.IDParent\
    and contract.ID_Student = student.IDStudent', function (err, par) {
        if (err) throw err;
        res.render('\Admin/adminparent.hbs', {menupar: par })
    })

})
//conract
app.get('/contract', function (req, res) {
    connection.query(`select * from student st
    inner join contract c on st.IDStudent = c.ID_Student
    inner join person p on st.ID_Person = p.IDPerson`, function (err, contr) {
        if (err) throw err;
        connection.query(`select * from student s
        inner join person p on s.ID_Person = p.IDPerson`, function(err,st){
            res.render('\Admin/contract.hbs', {  menucon: contr, menust:st })
        })
       
    })

})
//request
app.get('/request', function (req, res) {
    connection.query('select * from request', function (err, req) {
        if (err) throw err;
        res.render('\Admin/request.hbs', { menureq: req })
    })
})
app.post('/newrequest', function(req,res){
    let NameR = req.body.nameReq;
    let Req = req.body.Reques;
    connection.query(`INSERT INTO feedback (TextFeedback, Author) VALUES ("${Req}", "${NameR}")`, function (err, req) {
        res.redirect('/')
    })
})
app.post('/requestFine', function (req, res) {
    let NameSt = req.body.nameReqSt;
    let NameTe = req.body.nameReqTe;
    let Reques = req.body.Reques;
    let RadS = req.body.RadioConStudent;
    if (RadS == "on"){
        connection.query(`INSERT INTO message (TextMessage, ID_User) VALUES ("${Reques}", ${NameSt})`, function (err, req) {
            res.redirect('/adminmessage')
            console.log("massege Student")
        })
    } 
    else{
        connection.query(`INSERT INTO message (TextMessage, ID_User) VALUES ("${Reques}", ${NameTe})`, function (err, req) {
            res.redirect('/adminmessage')
            console.log("massege Teacher")
    })}
})
    
//обратная связь
app.post('/NewClient', function (req, res) {
    let Name = req.body.name;
    let Phone = req.body.phone;
    let Email = req.body.email;
    let Comment = req.body.msg;
    let Status = "Новый";
    connection.query(`INSERT INTO request (NameClient, Phone,Email,Comment,Status) VALUES \
    ('${Name}', '${Phone}','${Email}','${Comment}','${Status}')`, function (err, req) {
        res.redirect('/')
    })
})
app.post('/aboutcourse/NewClient', function (req, res) {
    let Name = req.body.name;
    let Phone = req.body.phone;
    let Email = req.body.email;
    let Comment = req.body.msg;
    let Status = "Новый";
    connection.query(`INSERT INTO request (NameClient, Phone,Email,Comment,Status) VALUES \
    ('${Name}', '${Phone}','${Email}','${Comment}','${Status}')`, function (err, req) {
        res.redirect('/aboutcourse')
    })
})
//adminteacher
app.get('/adminteacher',  function (req, res) {

    connection.query('select * from teacher, person, kuser\
    where teacher.ID_Person = person.IDPerson\
    and person.ID_User = kuser.IDUser', function (err, pers) {
        if (err) throw err;
        connection.query('select group_concat(distinct NameCourse) as course  from teacher,  course\
        where course.ID_teacher = teacher.IDTeacher\
            group by IDTeacher', function (err, cor) {
            if (err) throw err;
            res.render('\Admin/adminteacher.hbs', { menuper: pers, menucor: cor })
        })
    })
})


app.get('/adminpanel',function (req, res) {
    //menu5
    connection.query(`select * from kschedule ks
    inner join course c on ks.ID_Course = c.IDCourse
    inner join kgroup kg on ks.ID_Group = kg.IDGroup
    inner join teacher t on ks.ID_teacher = t.IDTeacher
    inner join lesstatus st on ks.ID_Status = st.IDStatus
    inner join person per on t.ID_Person = per.IDPerson`, function (err, sch) {
        if (err) throw err;
        //menu6
        connection.query('SELECT  * From course', function (err, cr) {
            if (err) throw err;
            //menu7
            connection.query('SELECT IDGroup, NameGroup From kgroup', function (err, gr) {
                if (err) throw err;
                //menu8
                connection.query(`select IDTeacher,NamePerson,IDPerson from teacher
                inner join person on teacher.ID_Person = person.IDPerson`, function (err, teach) {
                    if (err) throw err;
                    //menu9
                    connection.query('SELECT IDStatus,TypeStatus from lesstatus', function (err, stat) {
                        if (err) throw err;

                        res.render('\Admin/adminpanel.hbs', {  menu5: sch, menu6: cr, menu7: gr, menu8: teach, menu9: stat });

                    });
                });
            });
        });

    });

});

let failtest = '';
let globip = '';
app.get('/authorization', function (req, res) {
    let ip = req.ip;
    if (globip == ip) {
        res.render('authorization.hbs', { failtest })
    } else res.render('authorization.hbs')
    console.log(ip)
    console.log(globip)
});
app.get('/task', function(req,res){
    connection.query(`select * from todolist where ID_User = 15`, function(err, tas){
        if (err) throw err;
        res.render('\Admin/task.hbs', {csrfToken:req.csrfToken, menutas:tas})
    })
})
 

// ИЗМЕНЕНИЯ

app.post('/authorization', function (req, res) {
    let login = req.body.username;
    let password = req.body.password;
    globip = req.ip;
    let i = 0;
    connection.query('SELECT s.IDStudent NamePerson, Login, KPassword FROM student s, person p, kuser k\
        Where s.ID_Person = p.IDPerson and\
        p.ID_User = k.IDUser', function (err, stud) {
        connection.query(`select * from teacher t
        inner join person p on t.ID_Person = p.IDPerson
        inner join kuser k on p.ID_User = k.IDUser`, (err, teac) => {
            connection.query("select * from kuser where IDUser = 15", function (err, ad){

            
            if (err) throw err;
            let LoginS = stud.map(a => a.Login);
            let auth = false;
            let PasswordS = stud.map(a => a.KPassword);
            while (i < LoginS.length) {
                if (login == LoginS[i] && password == PasswordS[i]) {
                    res.redirect('/studentpanel/'+LoginS[i])
                    auth = true
                }
                i++;
            }
            i = 0;
            let LoginT = teac.map(a => a.Login);
            let PasswordT = teac.map(a => a.KPassword);
            while (i < LoginT.length) {
                if (login == LoginT[i] && password == PasswordT[i]) {
                    res.redirect('/teacherpanel/'+LoginT[i])
                    auth = true
                }
                i++;
            }
            i = 0;
            let LoginA = ad.map(a => a.Login);
            let PasswordA = ad.map(a => a.KPassword);
            while (i < LoginA.length) {
                if (login == LoginA[i] && password == PasswordA[i]) {
                    res.redirect('/adminpanel')
                    auth = true
                }
                i++;
            }
            if (auth){
                failtest = "Ошибка логина или пароля"
            }
        })
      })
    })
});





//добавление юзера
app.post('/AddUser', function (req, res) {
    let L = req.body.Log;
    let P = req.body.Pas;
    connection.query(`INSERT INTO kuser (Login, KPassword) VALUES ('${L}','${P}')`, function (err, sch) {
        res.redirect('users')
    })
});
//удаление юзера
app.post('/DelUser',function (req, res) {
    let IDUs = req.body.Us;
    connection.query(`DELETE FROM  kuser WHERE IDUser = ${IDUs}`, function (err, sch) {
        res.redirect('users')
    })
});
//добавление даты
app.post('/AddDate', function (req, res) {
    let D = req.body.Dat

    connection.query(`INSERT INTO study (DateStudy) VALUES ('${D}')`, function (err, sch) {
        res.redirect('date')
    })
});
//удаление даты
app.post('/DelDate', function (req, res) {
    let IDSt = req.body.St;
    connection.query(`DELETE FROM  study WHERE IDStudy = ${IDSt}`, function (err, sch) {
        res.redirect('date')
    })
});

//добавление расписание
app.post('/AddSch', function (req, res) {
    let Dat = req.body.DateSch;
    let date = Dat.replace("T", " ");
    let IDC = req.body.Course;
    let IDT = req.body.Teacher;
    let IDS = req.body.Status;
    let IDG = req.body.Group;
    connection.query(`INSERT INTO kschedule (DateLesson, ID_Course,ID_Teacher, ID_Status,ID_Group\
    ) VALUES ('${date}',${IDC},${IDT},${IDS},${IDG})`, function (err, sch) {
        res.redirect('adminpanel')
    })
})
//удаление расписания
app.post('/DelSch', function (req, res) {
    let IDSch = req.body.Schedule;
    connection.query(`DELETE FROM  kschedule WHERE IDSchedule = ${IDSch}`, function (err, sch) {
        res.redirect('adminpanel')
    })
});
//добавление курса
app.post('/AddCourse',  function (req, res) {
    let NameCourse = req.body.NameCourse;
    let Age = req.body.Age;
    let About = req.body.About;
    let LesCourse = req.body.LesCourse;
    let LesWeek = req.body.LesWeek;
    let Dur = req.body.Dur;
    let IDS = req.body.Sort;
    let IDF = req.body.Format;
    let IDT = req.body.Teacher;

    connection.query(`INSERT INTO course (NameCourse,Age,AboutCourse, LessonInCourse,LessonInWeek, Duration,\
    ID_Sort,ID_Format, ID_Teacher) VALUES ('${NameCourse}','${Age}','${About}',${LesCourse},${LesWeek},${Dur},${IDS},\
    ${IDF},${IDT})`, function (err, sch) {
        res.redirect('admincourse')
    })
});
//удаление курса
app.post('/DelCourse', function (req, res) {
    let IDCourse = req.body.Course;
    connection.query(`DELETE FROM  course WHERE IDCourse = ${IDCourse}`, function (err, sch) {
        res.redirect('admincourse')
    })
});
//Изменение курса
app.post('/UpCourse',function (req, res) {
    let IDCourse = req.body.Course;
    let NameCourse = req.body.NameCourse;
    let Age = req.body.Age;
    let About = req.body.About;
    let LesCourse = req.body.LesCourse;
    let LesWeek = req.body.LesWeek;
    let Dur = req.body.Dur;
    let IDS = req.body.Sort;
    let IDF = req.body.Format;
    let IDT = req.body.Teacher;
    connection.query(`UPDATE course SET NameCourse = '${NameCourse}', Age = '${Age}', AboutCourse = '${About}', \
    LessonInCourse = ${LesCourse}, LessonInWeek = ${LesWeek}, Duration = ${Dur}, ID_Sort = ${IDS}, ID_Format = ${IDF},\
    ID_Teacher= ${IDT} WHERE IDCourse = ${IDCourse} `, function (err, sch) {
        res.redirect('admincourse')
    })
});
//изменение расписания
app.post('/SaveLesson', function(req, res){
    let D = req.body.Date;
    let C = req.body.Course;
    let G = req.body.Group;
    let T = req.body.Person;
    let S = req.body.Status;
    let Sch = req.body.Schedule;
    console.log(D+' '+C+' '+G+' '+T+' '+S+' '+Sch)
    connection.query(`UPDATE kschedule SET DateLesson = '${D}', ID_Course = ${C}, ID_Group = ${G}, ID_Teacher = ${T}, ID_Status = ${S} where IDSchedule = ${Sch}`, function(err, sch){
        res.redirect('adminpanel')
    })
})
//добавление направления
app.post('/AddSort', function (req, res) {
    let S = req.body.Sor;

    connection.query(`INSERT INTO sort (NameSort) VALUES ('${S}')`, function (err, sch) {
        res.redirect('admintype')
    })
});
//удаление направления
app.post('/DelSort',  function (req, res) {
    let IDSr = req.body.Sr;
    connection.query(`DELETE FROM  sort WHERE IDSort = ${IDSr}`, function (err, sch) {
        res.redirect('admintype')
    })
});
//добавление программы
app.post('/AddProg', function (req, res) {
    let IDCour = req.body.Cr;
    let N = req.body.NumLes;
    let T = req.body.Topic;
    let DT = req.body.DocT;
    let DS = req.body.DocS;

    connection.query(`INSERT INTO lesson (NumberLesson, Topic, DocForTeacher, DocForStudent, ID_Course) VALUES (${N},'${T}','${DT}','${DS}',${IDCour})`, function (err, sch) {
        res.redirect('programma')
    })
});
//Изменение программа
app.post('/UpProg', function (req, res) {
    let IDLes = req.body.Les;
    let IDCour = req.body.Cr;
    let N = req.body.NumLes;
    let T = req.body.Topic;
    let DT = req.body.DocT;
    let DS = req.body.DocS;
    console.log(DT);
    connection.query(`UPDATE lesson SET NumberLesson = ${N}, Topic = '${T}', DocForTeacher = '${DT}', \
    DocForStudent = '${DS}', ID_Course = ${IDCour} WHERE IDLesson = ${IDLes} `, function (err, sch) {
        res.redirect('programma')
    })
});
//удаление программы
app.post('/DelProg', function (req, res) {
    let IDLes = req.body.Les;
    connection.query(`DELETE FROM lesson WHERE IDLesson = ${IDLes}`, function (err, sch) {
        res.redirect('programma')
    })
});

//добавление договора
app.post('/AddContract', function (req, res) {
    let Doc = req.body.Doc;
    let Dat = req.body.DocDate;
    let Sum = req.body.DocSum;
    let St = req.body.DocSt;


    connection.query(`INSERT INTO contract (DateContract, TheAmount, DocContract, ID_Student) VALUES ('${Dat}',${Sum},'${Doc}',${St})`, function (err, sch) {
        res.redirect('contract')
    })
});

//удаление договора
app.post('/DelContract', function (req, res) {
    let IDContr = req.body.Contract;

    connection.query(`DELETE FROM contract WHERE IDContract= ${IDContr}`, function (err, sch) {
        res.redirect('contract')
    })
});
//изменение договора
app.post('/UpContract', function (req, res) {
    let IDContr = req.body.Contract;
    let Doc = req.body.Doc;
    let Dat = req.body.DocDate;
    let Sum = req.body.DocSum;
    let St = req.body.DocSt;
    console.log(St);
    connection.query(`UPDATE contract SET DateContract = '${Dat}', TheAmount = ${Sum}, DocContract = '${Doc}', \
    ID_Student = ${St} WHERE IDContract = ${IDContr} `, function (err, sch) {
        res.redirect('contract')
    })
});
//добавление инфо
app.post('/AddInfo',  function (req, res) {
    let T = req.body.Text;
    let IDCor = req.body.Cours;
    connection.query(`INSERT INTO info (TextInfo, IDCourse) VALUES ('${T}',${IDCor})`, function (err, sch) {
        res.redirect('info')
    })
});
//удаление инфо
app.post('/DelInfo',  function (req, res) {
    let IDIn = req.body.Info;
    connection.query(`DELETE FROM info where IDInfo = ${IDIn}`, function (err, sch) {
        res.redirect('info');
    })
})
//изменение инфо
app.post('/UpInfo', function (req, res) {

    let T = req.body.Text;

    let IDIn = req.body.Info;
    connection.query(`UPDATE info SET TextInfo ='${T}' WHERE IDInfo = ${IDIn} `, function (err, sch) {
        res.redirect('info')
    })
});
//добавление персоны
app.post('/AddPers', function (req, res) {
    let NP = req.body.NameP;
    let Dat = req.body.BDay;
    let Ph = req.body.PhoneP;
    let Em = req.body.EmailP;
    let IDUs = req.body.Us;
    connection.query(`INSERT INTO person (NamePerson, Birthday, Phone, Email, ID_User) VALUES ('${NP}', '${Dat}', '${Ph}','${Em}', ${IDUs})`, function (err, sch) {
        res.redirect('person')
    })
});

//изменение персоны
app.post('/UpPers', function (req, res) {
    let NP = req.body.NameP;
    let Dat = req.body.BDay;
    let Ph = req.body.PhoneP;
    let Em = req.body.EmailP;
    let IDUs = req.body.Us;
    let IDPer = req.body.Pr;
    connection.query(`UPDATE person SET NamePerson ='${NP}', Birthday = '${Dat}', Phone = '${Ph}', \
    Email = '${Em}', ID_User = ${IDUs} WHERE IDPerson = ${IDPer} `, function (err, sch) {
        res.redirect('person')
    })
});
//удаление персоны
app.post('/DelPers', function (req, res) {
    let IDPer = req.body.Pr;
    connection.query(`DELETE FROM person WHERE IDPerson = ${IDPer}`, function (err, sch) {
        res.redirect('person')
    })
});

//добавление преподавателя
app.post('/AddTeach',  function (req, res) {
    let IDPer = req.body.NameP;

    connection.query(`INSERT INTO teacher (ID_Person) VALUES (${IDPer})`, function (err, sch) {
        res.redirect('teacher')
    })
});
//удаление преподавателя
app.post('/DelTeach', function (req, res) {
    let IDTeach = req.body.Tr;
    connection.query(`DELETE FROM teacher WHERE IDTeacher = ${IDTeach}`, function (err, sch) {
        res.redirect('teacher')
    })
});

//добавление родителя
app.post('/AddParent', function (req, res) {
    let IDPer = req.body.Pr;
    let Ad = req.body.Address;
    let Com = req.body.Comment;
    connection.query(`INSERT INTO parent  (Address, Comment,ID_Person) VALUES ('${Ad}','${Com}', ${IDPer})`, function (err, sch) {
        res.redirect('parent')
    })
});

//удаление родителя
app.post('/DelParent', function (req, res) {
    let IDPar = req.body.Parent;
    console.log(IDPar)
    connection.query(`DELETE FROM parent WHERE IDParent = '${IDPar}'`, function (err, sch) {
        res.redirect('parent')
    })
});
//удаление родителя
app.post('/DelReq',  function (req, res) {
    let IDReq = req.body.Req;
   
    connection.query(`DELETE FROM request WHERE IDRequest = ${IDReq}`, function (err, sch) {
        res.redirect('request')
    })
});
//изменение родителя
app.post('/UpParent', function (req, res) {
    let IDPer = req.body.Person;
    let Ad = req.body.Address;
    let C = req.body.Comment;
    let IDParent = req.body.Parent;
    
    connection.query(`UPDATE parent SET Address ='${Ad}', Comment = '${C}', ID_Person = ${IDPer} WHERE IDParent = ${IDParent} `, function (err, sch) {
        res.redirect('parent')
    })
});
//добавление ученика
app.post('/AddStud', function (req, res) {

    let IDPar = req.body.Parent;
    let IDPer = req.body.Person;
    let IDSt = req.body.Study;
    connection.query(`INSERT INTO student  (ID_Parent, ID_Person,ID_Study) VALUES (${IDPar},${IDPer}, ${IDSt})`, function (err, sch) {
        res.redirect('student')
    })
});
//удаление ученика
app.post('/DelStud', function (req, res) {
    let IDSt = req.body.Student;
    connection.query(`DELETE FROM student WHERE IDStudent = ${IDSt}`, function (err, sch) {
        res.redirect('student')
    })
});

//Добавление отзыва
app.post('/AddReview', function (req, res) {
    let TextA = req.body.Text;
    let Author = req.body.Author;
    let IDS = req.body.Status;
    connection.query(`INSERT INTO FeedBack(TextFeedBack, Author, ID_StRev) VALUES ('${TextA}', '${Author}', ${IDS})`, function (err, sch) {
        res.redirect('reviews')
    })
});


//Изменение отзыва
app.post('/UPDATEReview', function (req, res) {
    let TextA = req.body.Text;
    let St = req.body.Status;
    let Author = req.body.Author;
    let IDFEED = req.body.FEED;
    let IDS = req.body.Status;
    connection.query(`UPDATE FeedBack SET TextFeedBack = '${TextA}', Author = '${Author}', ID_StRev = ${IDS} WHERE IDFeedBack = ${IDFEED} `, function (err, sch) {
        res.redirect('reviews')
    })
});
//изменение уведомления
app.post('/UpMes',  function(req,res){
    let Txt = req.body.txt;
    let IDMes = req.body.Mes;
    connection.query(`UPDATE message SET TextMessage = '${Txt}' WHERE IDMessage = ${IDMes}`, function(err, sch){
        res.redirect('adminmessage')
    })

})
//удаление уведомления
app.post ('/DelMes',  function(req,res){
    let IDMes = req.body.Mes;
    connection. query(`delete from message where IDMessage = ${IDMes}`, function(err,sch){
        res.redirect('adminmessage')
    })
})
//Удалить отзыв
app.post('/DelReview', function (req, res) {
    let IDFEED = req.body.FEED;
    connection.query(`DELETE FROM Feedback WHERE IDFeedback = ${IDFEED} `, function (err, sch) {
        res.redirect('reviews')
    })
});
//Удалить группы
app.post('/DelGroup', function (req, res) {
    let IDGr = req.body.Group;
    connection.query(`DELETE FROM kgroup WHERE IDGroup= ${IDGr} `, function (err, sch) {
        res.redirect('group')
    })
});

//добавление группы
app.post('/AddGroup',  function (req, res) {

    let Gr = req.body.NameGroup;
    let IDC = req.body.Course;
    let IDSt = req.body.Study;
    connection.query(`INSERT INTO kgroup  (NameGroup, ID_Course,ID_Study) VALUES ('${Gr}',${IDC}, ${IDSt})`, function (err, sch) {
        res.redirect('group')
    })
});

// ученик задачи добавление
app.post('/studtask/AddTaskSt',  function (req, res) {
    let Task = req.body.Task;
    let idstudent = req.body.stud;
    let numst = req.body.num;
    console.log(Task+"  "+numst);
    connection.query(`INSERT INTO todolist(TextList,ID_User) VALUES ('${Task}',${numst}) `, (err, mas) => {
        res.redirect('/studtask/'+idstudent)
    })
});
//ученик удаление задач
app.post('/studtask/delTaskSt', function (req, res) {
    let Task = req.body.ToName;
    let idstudent = req.body.stud;
    connection.query(`DELETE FROM todolist WHERE IDToDoList = ${Task}`)
        res.redirect('/studtask/'+idstudent)
});

//добавить задачу админ
app.post('/AddTask',function(req,res) {
    let Ts = req.body.Task;
    connection.query(`INSERT INTO todolist (TextList, ID_User) values ('${Ts}',15)`, function(err, sch){
        res.redirect('task')
    } )
})

//Удалить задачу админ
app.post('/DelTask', function (req, res) {
    let IDList = req.body.List;
    connection.query(`DELETE FROM todolist WHERE IDToDoList= ${IDList} `, function (err, sch) {
        res.redirect('task')
    })
});
app.listen(3000, function () {
    console.log('work on port 3000')
});