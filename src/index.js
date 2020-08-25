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
app.patch('/journal', [auth.isValidUser], [auth.isStudent], routes.submitJournal) 
app.post('/application_form', [auth.isValidUser], [auth.isStudent], routes.applicationForm)  
app.get('/instructions', routes.getInstructions) 
app.patch('/instructions', routes.changeInstructions) //[auth.isAdmin]
app.patch('/template', routes.uploadTemplate) //[auth.isAdmin]
app.get('/template', routes.getJournalTemplate)  //  [auth.isValidUser], [auth.isStudent],  vratiti kad se rijesi bug
app.patch('/user', [auth.isValidUser], routes.changeUserInfo) 
app.delete('/user', [auth.isValidUser], routes.changeUserInfo)


//students
//app.get('/students/:id', routes.getOneStudent)
app.get('/students', routes.getStudents) //[auth.isAdmin]
app.get('/journal/:id', routes.getJournal) //[auth.isAdmin]


//projects
app.get('/projects', routes.getProjects)
app.post('/projects', [auth.isValidUser], [auth.isPartner], routes.addProject)
app.get('/projects/:id', routes.getOneProject)
app.put('/projects/:id', [auth.isValidUser], [auth.isPartner], routes.changeProjectInfo) 
app.delete('/projects/:id',  [auth.isValidUser], [auth.isPartner], routes.changeProjectInfo) 
app.patch('/chosen_projects', [auth.isValidUser], [auth.isStudent], routes.submitChosenProjects) 
app.get('/chosen_projects/:id',  routes.getChosenProjects) //tu fali middleweara, staviti naknadno kad stjepan promijeni front


//partners
app.get('/partners', routes.getPartners)
app.get('/partners/:id', routes.getOnePartner)
app.put('/partners/:id', [auth.isValidUser], [auth.isPartner], routes.changePartnerInfo) 
app.delete('/partners/:id', [auth.isValidUser], [auth.isPartner], routes.changePartnerInfo)   
app.get('/partner_projects/:id', routes.getPartnerProjects)
app.post('/partners', [auth.isValidUser], [auth.isPartner], routes.createPartner) //dovrsiti
app.get('/check_partner/:id', routes.checkIfPartner) // [auth.isValidUser], [auth.isPartner] isto naknadno



app.listen(port, () => console.log(`Slušam na portu ${port}!`))