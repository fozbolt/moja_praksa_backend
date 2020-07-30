import connect from './db'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

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
        
        let user = {
            email: userData.email,
            password: await bcrypt.hash(userData.password, 8),
            name: userData.name,
            registerDate : Date.now()
        }

        if(userData.jmbag){
            user.accountType = 'Student',
            user.JMBAG = userData.jmbag,
            user.surname = userData.surname,
            user.technology = userData.technology
            user.year= userData.year
        } else{
            user.accountType = 'Poslodavac',
            user.technology= userData.technology,
            user.adress = userData.adress,
            user.aboutUS = userData.about_us,
            user.webiste = userData.website,
            user.contactEmail = userData.contact_email,
            user.contactNumber = userData.telephone_number
        }


        try{
            let insertResult = await db.collection('users').insertOne(user);
            if(insertResult && insertResult.insertedId){
                return insertResult.insertedId
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

    //ako nam verify prode zovemo next, ako ne prode javljamo gresku
    async verify(req,res, next){
        try{
            let authorization = req.headers.authorization.split(' ')
            let type = authorization[0]
            let token = authorization[1]
    
            if (type != 'Bearer'){
                console.log('type:' + type)
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