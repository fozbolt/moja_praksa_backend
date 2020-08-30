import connect from './db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ObjectID } from 'mongodb'
import dotenv from 'dotenv'
dotenv.config();

(async () => {
    let db = await connect();
    let admin = await db.collection("users").findOne({account_type : 'Admin'})

    db.collection('users').createIndex({ email: 1 }, { unique: true });

    if(!admin){

        let adminData = {
            email: 'admin@admin',
            password:  process.env.ADMIN_PASSWORD,
            date_created: Date.now(),
            account_type: 'Admin'
        }
        register(adminData)
        console.log("Admin created")
    }
})();


async function register(userData){

    for (const [key, value] of Object.entries(userData)) {
        if(!value){
          res.json({status: 'Missing data'})
          return
        }
    }

    let db = await connect()

    let partner = {}
    
    let user = {
        email: userData.email,
        password: await bcrypt.hash(userData.password, 8),
        date_created: Date.now(),
    }

    if(userData.account_type == 'Admin') user.accountType = userData.account_type

    if(!user.account_type){

        if(userData.jmbag){
            user.account_type = 'Student',
            user.jmbag = userData.jmbag,
            user.name = userData.name,
            user.surname = userData.surname,
            user.technology = userData.technology
            user.year= userData.year
            user.journalID = false
        } else{
            user.account_type = 'Poslodavac',
            partner.company = userData.name,
            partner.technology= userData.technology,
            partner.adress = userData.adress,
            partner.about_us = userData.about_us,
            partner.date_created = Date.now(),
            partner.contact_email = userData.contact_email,
            partner.contact_number = userData.telephone_number,
            partner.img_url = 'https://images.unsplash.com/photo-1493119508027-2b584f234d6c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80',
            partner.account_type = 'Poslodavac'
        }
    }


    
    try{
        let insertResult = await db.collection('users').insertOne(user);
  
        if(insertResult && insertResult.insertedId){
            delete user.password
            partner.userID = ObjectID(insertResult.insertedId)
            return partner 
        }
    }
    catch(e){
        if (e.name =="MongoError" && e.code == 11000){
            throw new Error("User already exists")
        }
    }   


}

export default {
    
    register,


    async authenticateUser(email,password){
        let db = await connect()
        let user = await db.collection("users").findOne({email : email})

        // provjerava da li je ovaj hesh u bazi izveden iz cistog passworda
        if(user && user.password && (await bcrypt.compare(password, user.password))){
            //šifra za potpisivanje korisnika(kriptografski potpis) vežemo je uz naš backend, s tom šifrom potpisujemo 
            //tokene svih korisnika, kad nam korisnik vraća token provjeravamo da li je on potpisan s našom šifrom
            //naš token sadrži sve podatke o useru
            //password nije potrebno spremati u token jer smo ga već provjerili
            delete user.password
            let token = jwt.sign(user, process.env.JWT_SECRET, {
                algorithm: "HS512",
                expiresIn: "1 week"
            })
            
            user.token = token

            return user 

        }
        else {
            throw new Error('Cannot authenticate')
        }
    },


    async isValidUser(req,res, next){
        
        try{
            let authorization = req.headers.authorization.split(' ')
            let type = authorization[0]
            let token = authorization[1]
         
            if (type != 'Bearer'){
                //console.log('type:' + type)
         
                res.status(401).send()
                return false;
            }
            else {
                //spremati u jwt kljuc podatke u korisniku da se moze na bilo kojem mjestu
                //koristiti ti podaci o korisniku -> da se zna ko salje upit itd
                req.jwt = jwt.verify(token, process.env.JWT_SECRET)
                
                return next()
            }
        }
        catch(e){

            return res.status(401).send()
        }
    },




    async isStudent(req,res, next){
        let accountType = req.jwt.account_type
        
        try{
        
            if (accountType ===  'Student' )  return next() 
            //za rute na kojima je isStudent middleware prisutan, autoriziran je samo student, ali iznimka su donje rute za putanju ... kojoj ima pristup i admin
            else if (accountType ===  'Admin' && (req.route.path =='/chosen_projects' || req.route.path =='/template') && req.route.methods.get == true)  return next() 
            else  {
                res.status(401).send()
                return false
            }
        }
        catch(e){
            return res.status(401).send()
        }
    },



    async isPartner(req,res, next){
        
        let accountType = req.jwt.account_type

        try{
            if (accountType ===  'Poslodavac' )  return next() 
            
            else  {
                res.status(401).send()}
                return false
            }

        catch(e){
            return res.status(401).send()
        }
    },


    async isAdmin(req,res, next){
        let accountType = req.jwt.account_type
        
        try{
            if (accountType ===  'Admin' )  return next() 
            //za rute na kojima je isAdmin middleware prisutan, autoriziran je samo admin, ali iznimka je ruta getStudents za putanju /TableOfStudents kojoj ima pristup i student
            else if(accountType ===  'Student'  && req.route.path =='/students' && req.route.methods.get == true ) return next() 
            
            else  {
                res.status(401).send()}
                return false
            }

        
        catch(e){
            return res.status(401).send()
        }
    },

    
    async isPartnerOrAdmin(req,res, next){
        
        let accountType = req.jwt.account_type
        
        try{
            if (accountType ===  'Admin' || accountType === 'Poslodavac')  return next() 
            
            else  {
                res.status(401).send()}
                return false
            }

        
        catch(e){
            return res.status(401).send()
        }
    },
    


    async changeUserPassword(userData){
        let db = await connect()
 
        let user = await db.collection("users").findOne({email : userData.email})
        

        if (user && user.password && (await bcrypt.compare(userData.oldPassword, user.password))){
            let newPasswordTransformed = await bcrypt.hash(userData.newPassword, 8)

            let result = await db.collection('users').updateOne(
                { _id: user._id },
                {
                    $set: {
                        password: newPasswordTransformed,
                    },
                }
            );
            return result.modifiedCount == 1;
        }
    }

}