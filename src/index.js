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
app.patch('/register', [auth.isValidUser], routes.changePassword) //register? bolje change_password, ali onda je to nova ruta
app.patch('/journal', routes.submitDiary)

//projects
app.get('/projects', routes.getProjects)
app.post('/projects',[auth.isValidUser], [auth.isPartner], routes.addProject)
app.get('/projects/:id', routes.getOneProject)
app.patch('/projects/:id/:update', [auth.isValidUser], [auth.isPartner], routes.changeProjectInfo)
app.delete('/projects/:id/:update', [auth.isValidUser], [auth.isPartner], routes.changeProjectInfo) 
app.post('/chosen_projects', [auth.isValidUser], [auth.isStudent], routes.chosenProjects)


//partners
app.get('/partners', routes.getPartners)
app.get('/partners/:id', routes.getOnePartner)
app.patch('/partners/:id/:update', [auth.isValidUser], [auth.isPartner], routes.changePartnerInfo) //promijeniti u 'partner'?
app.delete('/partners/:id/:update', [auth.isValidUser], [auth.isPartner],  routes.changePartnerInfo)
app.get('/partner_projects/:id', routes.getPartnerProjects)
app.post('/partners', [auth.isValidUser], [auth.isPartner], routes.createPartner) 


app.listen(port, () => console.log(`Slušam na portu ${port}!`))