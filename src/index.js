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
app.get('/secret', [auth.verify], routes.secret)
app.get('/profile', routes.userProfile)
app.post('/register', routes.registration)
app.post('/login', routes.login)
app.get('/projects', routes.getProjects)
app.post('/projects', routes.addProject)
app.post('/partners', routes.addPartner)
app.get('/partners', routes.getPartners)
app.patch('/register', [auth.verify], routes.changePassword)
app.get('/projects/:id', routes.getOneProject)
app.get('/partners/:id', routes.getOnePartner)
app.patch('/projects/:id/:update', routes.changeProjectInfo)
app.delete('/projects/:id/:update', routes.changeProjectInfo)
app.patch('/partners/:id', routes.changePartnerInfo)
app.get('/partnerProjects/:id', routes.getPartnerProjects)


app.listen(port, () => console.log(`Slušam na portu ${port}!`))