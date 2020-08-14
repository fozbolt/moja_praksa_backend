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
app.post('/register', routes.registration)
app.post('/login', routes.login)
app.patch('/register',  routes.changePassword) //register? bolje change_password, ali onda je to nova ruta
app.patch('/journal', routes.submitDiary)
app.post('/application_form', routes.applicationForm)
app.get('/instructions', routes.getInstructions)
app.patch('/instructions', routes.changeInstructions)
app.patch('/template', routes.uploadTemplate)
app.get('/template', routes.getTemplate)

//projects
app.get('/projects', routes.getProjects)
app.post('/projects', routes.addProject)
app.get('/projects/:id', routes.getOneProject)
app.patch('/projects/:id/:update',  routes.changeProjectInfo)
app.delete('/projects/:id/:update',  routes.changeProjectInfo) 
app.post('/chosen_projects', routes.chosenProjects)
app.get('/approved_project', routes.getApprovedProject)
app.get('/check_if_partner', routes.checkIfPartner)


//partners
app.get('/partners', routes.getPartners)
app.get('/partners/:id', routes.getOnePartner)
app.patch('/partners/:id/:update', routes.changePartnerInfo) //promijeniti u 'partner'?
app.delete('/partners/:id/:update', routes.changePartnerInfo)
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