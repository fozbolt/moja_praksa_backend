//modul za pristup bazi
import mongo from 'mongodb'
import dotenv from 'dotenv'
dotenv.config();



let connection_string = 'mongodb+srv://admin:admin@fo-cluster.b1r2g.mongodb.net/moja_praksa?retryWrites=true&w=majority'


//služi za pristup prema bazi na navedenom frameworku
let client = new mongo.MongoClient(connection_string,{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

let db = null;

//nakon spajanja vraćamo dobivenu instancu baze ostalim modulima koji to trebaju
//exportamo asinkronu funkciju koja ne prima ni jedan parametar

// eksportamo Promise koji resolva na konekciju
export default () => {
    return new Promise((resolve, reject) => {
        // ako smo inicijalizirali bazu i klijent je još uvijek spojen
        if (db && client.isConnected()) {
            resolve(db);
        } else {
            client.connect((err) => {
                if (err) {
                    reject('Error with connecting to database' + err);
                } else {
                    
                    db = client.db('moja_praksa');
            
                    let admin = db.collection("users").findOne({account_type : 'Admin'})
                     
                    if(!admin){

                        
                        db.collection('users').createIndex({ email: 1 }, { unique: true });

                        let adminData = {
                            email: userData.email,
                            password:  process.env.ADMIN_PASSWORD,
                            date_created: Date.now()
                        }

                        register(adminData)
                    }
                    
                    console.log('Database connected successfully!');
                    resolve(db);
                }
            });
        }
    });
};