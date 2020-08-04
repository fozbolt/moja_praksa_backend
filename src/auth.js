import connect from './db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { ObjectID } from 'mongodb'

(async () => {
    let db = await connect();
    db.collection('users').createIndex({ email: 1 }, { unique: true });
})();


export default {
    async register(userData){

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
            date_created: Date.now()
        }


        if(userData.jmbag){
            user.account_type = 'Student',
            user.jmbag = userData.jmbag,
            user.name = userData.name,
            user.surname = userData.surname,
            user.technology = userData.technology
            user.year= userData.year
        } else{
            user.account_type = 'Poslodavac',
            partner.company = userData.name
            partner.technology= userData.technology,
            partner.adress = userData.adress,
            partner.about_us = userData.about_us,
            partner.website = userData.website,
            partner.date_created = Date.now()
            partner.contact_email = userData.contact_email,
            partner.contact_number = userData.telephone_number
            partner.img_url = 'https://images.unsplash.com/photo-1493119508027-2b584f234d6c?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=500&q=80'
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


    },


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

    //ako nam isValidUser prode zovemo next, ako ne prode javljamo gresku
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
                res.locals.account_type = req.jwt.account_type

                return next()
            }
        }
        catch(e){
            return res.status(401).send()
        }
    },



    checkAuthorization = (authorizationTitle, accountType) =>{
        
        if (authorizationTitle ===  'Student' || accountType ===  'Student' ) return true
        else if (authorizationTitle ===  'Poslodavac' || accountType ===  'Poslodavac' ) return true
        else if (authorizationTitle ===  'Admin' || accountType ===  'Admin' ) return true

        else return false

    },


    async isStudent(req,res, next){
        
        let accountType = res.locals.account_type

        try{

            if (checkAuthorization('Student', accountType)){
                return next() 
                
            }
            else {
                res.status(401).send()
                return false;

            }
        }
        catch(e){
            return res.status(401).send()
        }
    },


    async isPartner(req,res, next){
        
        let accountType = res.locals.account_type

        try{
            
            if (accountType ===  'Poslodavac' || accountType ===  'poslodavac' ){
                return next() 
                
            }
            else {
                res.status(401).send()
                return false;

            }
        }
        catch(e){
            return res.status(401).send()
        }
    },

/*
    async isAdmin(req,res, next){
        
        let accountType = res.locals.account_type

        try{
            
            if (accountType ===  'Admin' || accountType ===  'admin' ){
                return next() 
                
            }
            else {
                res.status(401).send()
                return false;

            }
        }
        catch(e){
            return res.status(401).send()
        }
    },
*/

    


    async changeUserPassword(email, oldPassword, newPassword){
        let db = await connect()
        
        let user = await db.collection("users").findOne({email : email})
        

        if (user && user.password && (await bcrypt.compare(oldPassword, user.password))){
            let newPasswordTransformed = await bcrypt.hash(newPassword, 8)

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