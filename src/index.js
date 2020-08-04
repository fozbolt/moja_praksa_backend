import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import routes from './routes'; 
import cors from 'cors'
import auth from './auth.js'


const app = express() // instanciranje aplikacije
const port = 3000 // port na kojem će web server slušati

app.use(cors())
app.use(express.json())


app.get('/', routes.home)
app.get('/profile', routes.userProfile)
app.post('/register', routes.registration)
app.post('/login', routes.login)
app.patch('/register', [auth.isValidUser], routes.changePassword) //register? bolje change_password, ali onda je to nova ruta

//projects
app.get('/projects', routes.getProjects)
app.post('/projects', routes.addProject)
app.get('/projects/:id', routes.getOneProject)
app.patch('/projects/:id/:update', routes.changeProjectInfo)
app.delete('/projects/:id/:update', routes.changeProjectInfo)
app.post('/chosen_projects', [auth.isValidUser], [auth.isStudent], routes.chosenProjects)


//partners
app.get('/partners', routes.getPartners)
app.get('/partners/:id', routes.getOnePartner)
app.patch('/partners/:id/:update', routes.changePartnerInfo) //promijeniti u 'partner'?
app.delete('/partners/:id/:update', routes.changePartnerInfo)
app.get('/partner_projects/:id', routes.getPartnerProjects)
app.post('/partners', routes.createPartner)


app.listen(port, () => console.log(`Slušam na portu ${port}!`))