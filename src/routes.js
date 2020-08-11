import connect from './db.js'
import auth from './auth.js'
import { ObjectID } from 'mongodb'
import methods from './methods.js'


export default {

    //refaktorirati
    async submitDiary (req,res) {
        let userID = req.body.user_id
        let user = {}
        user.journal = req.body.journal
        

        let db = await connect()
        let result

        try{
            result = await db.collection('users').updateOne( { _id: ObjectID(userID) },{ $set: user });       
        }
        
        catch(e){
            console.log(e)
        }

        if (result.modifiedCount == 1)  return 'success'
        else return 'fail'

    },


    async getOneProject (req,res) {
        //a kad bi bilo ?id=23432 onda dohvacamo s req.query, a url parametre ovako:
        let id = req.params.id

        let db = await connect()

        //findOne ne pretvara rezultate u kursor koji treba pretvoriti u  array
        // u mongu kada pretrazujemo po id-u, moramo omotati s posebnim konstruktorom objectID
        let result = await db.collection("projects").findOne({_id: ObjectID(id)})

        result.id = result._id
        delete result._id

        res.json(result)
},


    async getPartnerProjects (req,res) {

        let partnerID = req.params.id
        let db = await connect()

        //nađi projekte koje pripadaju određenom poslodavcu
        /*
        let find_IDs= await db.collection("partners").find({_id: ObjectID(id)})
        let result =  await find_IDs.toArray()

        let filtered_IDs = result[0].projects

        let cursor2 = await db.collection("projects").find({_id: {$in: filtered_IDs}})
        let finalResult =  await cursor2.toArray()
        */
        let cursor= await db.collection("projects").find({partnerID: ObjectID(partnerID)})

        let results =  await cursor.toArray()
        
        res.send(results)

},


    async getOnePartner (req,res) {

        let id = req.params.id
        let db = await connect()

        let result = await db.collection("partners").findOne({_id: ObjectID(id)})

        result.id = result._id
        delete result._id

        res.json(result)
},



    async changePassword (req,res) {
        let data = req.body
        
        //dolazi iz metode isValidUser
        let email = req.jwt.email

        if (data.newPassword && data.oldPassword){
            let result = await auth.changeUserPassword(email, data.oldPassword, data.newPassword)
            

            if (result) {
                res.status(201).send({status: 'Success'});
            } 
            else {
                res.status(500).json({ error: 'Server error' });
            }
        }

        else{
            res.status(400).json({error : "Invalid input data"})
        }
},


    async login(req,res) {
        let user = req.body

        try{
            let result = await auth.authenticateUser(user.email, user.password)
            res.json(result)
        }
        catch(e){
            res.status(401).json({error: e.message})
        }
},


    async registration (req, res) { 
        let newUser = req.body;

        try {
            let partner = await auth.register(newUser);
            let result 

            //dodavanje korisnika automatski u partnere čim se registrira
            if (newUser.account_type === ('poslodavac' || 'Poslodavac'))    result = await methods.addPartner(partner)

            res.json({status: `user with id ${result} added`})

        } catch (e) {
            res.status(500).json({
                error: e.message,
            });
        }
},


    async chosenProjects (req, res)  {
        let data = req.body
        let db = await connect()

        let result = await db.collection('users').updateOne( { _id: ObjectID(data.user) },{ $set:{ "chosenProjects": data.selection} });
        
        res.json(result)
},


    async changeProjectInfo (req, res)  {

        let project = req.body 
        delete project.id;

        //ako nema podataka u body, znači da se traži delete pa inicijaliziramo prazan objekt u koji stavljamo jedino podatke potrebne za delete, inače ide update
        if (project) project = await methods.mapAttributes(project)
        else         project = {}

        // if (!project) project = {}       --varijanta bez mapiranja ako su nazivi atributa isti pa ne treba mapirati
        

        project.id = req.params.id;
        project.updateDoc = req.params.update 
        
        let response = await methods.changeInfo(project, 'projects')
        
        res.send(response)
},



    async changePartnerInfo (req, res)  {
        let partnerInfo = req.body
        delete partnerInfo._id;
        partnerInfo.id = req.params.id;
        partnerInfo.updateDoc = req.params.update 


        response = await methods.changeInfo(partnerInfo, 'partners')

        res.send(response)
},



async getProjects (req, res)  {
    
    let query = req.query
    let atributi = ["company", "technologies", "location", "project_description"] 

    let result = await methods.search(query, atributi, 'projects')

    res.json(result)
},



    async getPartners (req, res) {

        let query = req.query
        let atributi = ["company", "about_us"] 

        let result = await methods.search(query, atributi, 'partners')

        res.json(result)
},


    async addProject (req, res)  {

        let projectData = req.body
        
        // pušteno ovako u slučaju da se imena atributa razlikuju pa je lakše promijeniti, ali za sada ne treba
        let project = await methods.mapAttributes(projectData)
        
        //slika je hardcodana jer nema bas smisla imati custom sliku projekta
        project.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
        project.userID = projectData.userID
        

        try{
            
            let result = await methods.pushData(project, 'projects')
            
            res.send(`project with id  ${result} added.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },



    async createPartner (req, res)  {
        console.log('tu samm')
        let partnerData = req.body
        
        // ako će trebati kad stjepan implementira
        //let project = await methods.mapAttributes(projectData)
        
        //dok stjepan ne implementira ce biti ovako hardcodano
        partnerData.img_url = "https://images.unsplash.com/photo-1504610926078-a1611febcad3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
        
        //za raspoznavanje koji partneri su se sami kreirali, a koji ne
        partnerData.created_by_admin = true
        

        try{
            
            let partnerID = await methods.pushData(partnerData, 'partners')
            
            
            res.send(`partner with id  ${partnerID} added.`)

        }
        catch(e){
            res.status(500).json({ error: e.message});
        }   
    },



//testna

    async userProfile (req, res)  {
        
        let db = await connect()

        //nacin kako se pristupa podacima u mongu je kursor
        let cursor = await db.collection("users").find();

        let results = await cursor.toArray()

        //console.log(results)
        res.json(results)
},


    async home (req, res)  {

        let db = await connect()
        let numberOfDocs = {}

        numberOfDocs.projectsCounter = await db.collection("projects").countDocuments();
        numberOfDocs.partnersCounter = await db.collection("partners").countDocuments();

        res.json(numberOfDocs)
    }


} 