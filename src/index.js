import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes'; 
import cors from 'cors'
import auth from './auth.js'


const app = express() // instanciranje aplikacije
const port = 3000 // port na kojem će web server slušati

app.use(cors())

app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))



app.get('/', routes.home)
app.patch('/', routes.addView)
app.post('/register', routes.registration)
app.post('/login', routes.login)
app.patch('/register', [auth.isValidUser], routes.changePassword) //register? bolje change_password, ali onda je to nova ruta
app.patch('/journal', routes.submitJournal)
app.post('/application_form', routes.applicationForm)
app.get('/instructions', routes.getInstructions)
app.patch('/instructions', routes.changeInstructions)
app.patch('/template', routes.uploadTemplate)
app.get('/template', routes.getTemplate)
app.patch('/user', [auth.isValidUser], routes.changeUserInfo)
app.delete('/user', [auth.isValidUser], routes.changeUserInfo)

//students
//app.get('/students/:id', routes.getOneStudent)
app.get('/students', routes.getStudents)
app.get('/journal/:id', routes.getJournal)

//projects
app.get('/projects', routes.getProjects)
app.post('/projects', routes.addProject)
app.get('/projects/:id', routes.getOneProject)
app.patch('/projects/:id',  routes.changeProjectInfo)
app.delete('/projects/:id',  routes.changeProjectInfo) 
app.post('/chosen_projects', routes.chosenProjects)
app.get('/approved_project', routes.getApprovedProject)
app.get('/check_if_partner', routes.checkIfPartner)


//partners
app.get('/partners', routes.getPartners)
app.get('/partners/:id', routes.getOnePartner)
app.patch('/partners/:id', routes.changePartnerInfo) //promijeniti u 'partner'? i maknuti drugi parametar?
app.delete('/partners/:id', routes.changePartnerInfo)
app.get('/partner_projects/:id', routes.getPartnerProjects)
app.post('/partners',  routes.createPartner) 


// //projects
// app.get('/projects', routes.getProjects)
// app.post('/projects',[auth.isValidUser], [auth.isPartner], routes.addProject)
// app.get('/projects/:id', routes.getOneProject)
// app.patch('/projects/:id/:update', [auth.isValidUser], [auth.isPartner], routes.changeProjectInfo)
// app.delete('/projects/:id/:update', [auth.isValidUser], [auth.isPartner], routes.changeProjectInfo) 
// app.post('/chosen_projects', [auth.isValidUser], [auth.isStudent], routes.chosenProjects)
// app.get('/approved_project', routes.getApprovedProject)


// //partners
// app.get('/partners', routes.getPartners)
// app.get('/partners/:id', routes.getOnePartner)
// app.patch('/partners/:id/:update', [auth.isValidUser], [auth.isPartner], routes.changePartnerInfo) //promijeniti u 'partner'?
// app.delete('/partners/:id/:update', [auth.isValidUser], [auth.isPartner],  routes.changePartnerInfo)
// app.get('/partner_projects/:id', routes.getPartnerProjects)
// app.post('/partners', [auth.isValidUser], [auth.isPartner], routes.createPartner) 


app.listen(port, () => console.log(`Slušam na portu ${port}!`))