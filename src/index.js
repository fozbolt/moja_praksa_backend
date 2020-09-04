import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import routes from './routes'; 
import cors from 'cors'
import auth from './auth.js'


const app = express() 
const port = process.env.PORT; 

app.use(cors())

app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

//general
app.get('/', routes.home)
app.patch('/', routes.addView)
app.post('/register', routes.registration)
app.post('/login', routes.login)
app.patch('/change_password', [auth.isValidUser], routes.changePassword) 
app.put('/journal', [auth.isValidUser], [auth.isStudent], routes.submitJournal) 
app.post('/application_form', [auth.isValidUser], [auth.isStudent], routes.applicationForm)  
app.get('/instructions', routes.getInstructions) 
app.patch('/instructions', [auth.isValidUser], [auth.isAdmin], routes.changeInstructions) 
app.patch('/template', [auth.isValidUser], [auth.isAdmin], routes.uploadTemplate) 
app.get('/template',  [auth.isValidUser], [auth.isStudent],  routes.getJournalTemplate) 
app.patch('/user', [auth.isValidUser],  routes.changeUserInfo) 
app.patch('/test', [auth.isValidUser],  routes.changeUserInfo) //testni



//students
app.get('/students',  [auth.isValidUser], [auth.isAdmin], routes.getStudents) 
app.get('/journal/:id',  [auth.isValidUser], [auth.isAdmin], routes.getJournal) 
app.get('/approved_project/:id',  [auth.isValidUser], [auth.isStudent], routes.getApprovedProject) 


//projects
app.get('/projects', routes.getProjects)
app.post('/projects', [auth.isValidUser], [auth.isPartnerOrAdmin], routes.addProject) 
app.get('/projects/:id', routes.getOneProject)
app.put('/projects/:id', [auth.isValidUser], [auth.isPartnerOrAdmin], routes.changeProjectInfo) 
app.delete('/projects/:id',  [auth.isValidUser], [auth.isPartnerOrAdmin], routes.changeProjectInfo)  
app.patch('/chosen_projects', [auth.isValidUser], [auth.isStudent], routes.submitChosenProjects) 
app.get('/chosen_projects/:id', [auth.isValidUser], [auth.isStudent], routes.getChosenProjects) 


//partners
app.get('/partners', routes.getPartners)
app.get('/partners/:id', routes.getOnePartner)
app.put('/partners/:id', [auth.isValidUser], [auth.isPartnerOrAdmin], routes.changePartnerInfo) 
app.delete('/partners/:id',  [auth.isValidUser], [auth.isPartnerOrAdmin], routes.changePartnerInfo) 
app.get('/partner_projects/:id', routes.getPartnerProjects)
app.post('/partners', [auth.isValidUser], [auth.isAdmin], routes.createPartner)  
app.get('/check_partner/:id', [auth.isValidUser], [auth.isPartner], routes.checkIfPartner) 


app.listen(port, () => console.log('Found available port and listening'))