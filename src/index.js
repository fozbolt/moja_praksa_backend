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
app.get('/secret', [auth.verify],  routes.secret)
app.get('/profile',  routes.userProfile)
app.post('/register',  routes.users)
app.post('/login', routes.login)
app.get('/Projects', routes.getProjects)
app.post('/Projects', routes.postProjects)
app.post('/Partners', routes.postPartners)
app.get('/Partners', routes.getPartners)


app.listen(port, () => console.log(`Slušam na portu ${port}!`))