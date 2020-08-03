import connect from './db.js'
import auth from './auth.js'
import { ObjectID } from 'mongodb'
import methods from './methods.js'



let getOneProject = async (req,res) =>{
    //a kad bi bilo ?id=23432 onda dohvacamo s req.query, a url parametre ovako:
    let id = req.params.id

    let db = await connect()

    //findOne ne pretvara rezultate u kursor koji treba pretvoriti u  array
    // u mongu kada pretrazujemo po id-u, moramo omotati s posebnim konstruktorom objectID
    let result = await db.collection("projects").findOne({_id: ObjectID(id)})

    result.id = result._id
    delete result._id

    res.json(result)
}


let getPartnerProjects  = async (req,res) =>{

    let id = req.params.id
    let db = await connect()

    //nađi projekte koje pripadaju određenom poslodavcu
    let find_IDs= await db.collection("partners").find({_id: ObjectID(id)})
    let result =  await find_IDs.toArray()

    let filtered_IDs = result[0].projects

    let cursor2 = await db.collection("projects").find({_id: {$in: filtered_IDs}})
    let finalResult =  await cursor2.toArray()
    
    
    res.send(finalResult)

}


let getOnePartner = async (req,res) =>{
    let id = req.params.id
    let db = await connect()

    let result = await db.collection("partners").findOne({_id: ObjectID(id)})

    result.id = result._id
    delete result._id

    res.json(result)
}


let changePassword = async (req,res) => {
    let data = req.body
    console.log(req.jwt.email)

    //dolazi iz metode verify
    let email = req.jwt.email

    if (data.newPassword && data.oldPassword){
        let result = await auth.changeUserPassword(email, data.oldPassword, data.newPassword)
        

        if (result) {
            res.status(201).send();
        } 
        else {
            res.status(500).json({ error: 'Server error' });
        }
    }

    else{
        res.status(400).json({error : "Invalid input data"})
    }
}


let login = async (req,res) => {
    let user = req.body

    try{
        let result = await auth.authenticateUser(user.email, user.password)
        res.json(result)
    }
    catch(e){
        res.status(401).json({error: e.message})
    }
}


let registration = async (req, res) => { 
    let newUser = req.body;

    try {
        let user = await auth.register(newUser);
        let partner 

        //dodavanje korisnika automatski u partnere čim se registrira
        if (user.accountType === 'Poslodavac') partner = await methods.addPartner(user)


        res.json({status: `user with id ${user._id} added`})

    } catch (e) {
        res.status(500).json({
            error: e.message,
        });
    }
}

let chosenProjects = async (req, res) => {
    let data = req.body
    let db = await connect()

    let result = await db.collection('users').updateOne( { _id: ObjectID(data.user) },{ $set:{ "chosenProjects": data.selection} });
    
    res.json(result)
}



let changeProjectInfo = async (req,res) => {

    let project = req.body 
    delete project.id;

    if (project) project = await methods.mapAttributes(project)
    else         project = {}
    

    project.id = req.params.id;
    project.updateDoc = req.params.update 
    
    let response = await methods.changeInfo(project, 'projects')
    
    res.send(response)
}



let changePartnerInfo = async (req,res) => {
    let partnerInfo = req.body
    delete partnerInfo._id;
    partnerInfo.id = req.params.id;

    response = await methods.changeInfo(partnerInfo, 'partners', false)

    res.send(response)
}



let getProjects = async (req, res) => {
    
    let query = req.query
    let atributi = ["company", "technologies", "location", "project_description"] 

    let result = await methods.search(query, atributi, 'projects')

    res.json(result)
}



let getPartners = async (req, res) => {  
    let query = req.query
    let atributi = ["company", "about_us"] 

    let result = await methods.search(query, atributi, 'partners')

    res.json(result)
}


let addProject = async (req,res) => {

    let projectData = req.body
    delete projectData._id

  
    // uskladiti imena atributa da ne treba toliko mapirati
    let project = await methods.mapAttributes(projectData)

    //slika je hardcodana jer nema bas smisla imati custom sliku projekta
    project.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
    project.partnerID = projectData.partnerID

    try{
        let result = await methods.pushData(project, 'projects')
        res.send(`project with id  ${result} added.`)

    }
    catch(e){
        res.status(500).json({ error: e.message});
    }   
}



//testna
let userProfile = async (req, res) => {
    
    let db = await connect()

    //nacin kako se pristupa podacima u mongu je kursor
    let cursor = await db.collection("users").find();

    let results = await cursor.toArray()

    //console.log(results)
    res.json(results)
}


let  home = async (req, res) => {

    let db = await connect()
    let numberOfDocs = {}

    numberOfDocs.projectsCounter = await db.collection("projects").countDocuments();
    numberOfDocs.partnersCounter = await db.collection("partners").countDocuments();

    res.json(numberOfDocs)
}



export default { home, registration, login, userProfile , getProjects, addProject, getPartnerProjects, chosenProjects,
                 getPartners, changePassword, getOneProject, getOnePartner, changeProjectInfo, changePartnerInfo  } 