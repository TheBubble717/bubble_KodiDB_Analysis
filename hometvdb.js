var mysql = require('mysql');
const sqlite3 = require('sqlite3').verbose();

class hometvdbclass {
    constructor(credentials){
        this.active = credentials.active;
        this.type = credentials.type;
        this.filename = credentials.filename;

        this.host = credentials.host;
        this.username = credentials.username;
        this.password = credentials.password;
        this.port = credentials.port;
        this.databasename = credentials.databasename;


        this.con=null;
    }
    connect(callback)
    {
        var that = this;
        return new Promise(async (resolve, reject) => {
            if(that.type == "sqllite")
            {
                that.con = new sqlite3.Database(__dirname +`/${that.filename}`, sqlite3.OPEN_READONLY, async function(err)
                {
                    if (err)
                    {
                        console.error(`Error connecting to SQLLITE-Server ${that.filename} - ERROR:${err}`);
                        process.abort();
                    }
                    else
                    {
                        var answer = {success:true, answer: `Connection to SQLLITE-Server ${that.filename} successfull`};
                        if (callback && typeof callback == 'function') {
                            await callback("", answer);
                            resolve();
                        }
                        else {
                            resolve(answer);
                        }
                    }
                });
            }
            else if(that.type == "mysql")
            {
                that.con = mysql.createConnection({
                    host: that.host,
                    user: that.username,
                    password: that.password
                });

                that.con.connect(async function (err) {
                    if (err) {
                        console.error(`Error connecting to MYSQL-Server ${that.host} - ERROR:${err}`);
                        process.abort();
                    }
                    else
                    {
                        that.databasequerryhandler(`use ${that.databasename}`,async function (err, res)
                        {
                            if (err) {
                                console.error(`Error connecting to MYSQL-Server ${that.host} - ERROR:${err}`);
                                process.abort();
                            }
                            else
                            {
                                var answer = {success:true, answer: `Connection to MYSQL-Server ${that.host} successfull`};
                                if (callback && typeof callback == 'function') {
                                    await callback("", answer);
                                    resolve();
                                }
                                else {
                                    resolve(answer);
                                }
                            }
                        });
                    }
                });
            

            }
        });
    }

    databasequerryhandler(querry, callback)
    {
        var that = this;
        return new Promise((resolve, reject) => {
            if(that.type == "sqllite")
            {
                that.con.all(querry, [],async (err,row) => 
                {
                    if (err) {
                        if (callback && typeof callback == 'function') {
                            await callback(err, "");
                            resolve();
                        }
                        else {
                            reject(err);
                        }
                        return;
                    }
                    if (callback && typeof callback == 'function') {
                        await callback("", row);
                        resolve();
                    }
                    else {
                        resolve(row);
                    }
                })
            }
            else if(that.type == "mysql")
            {
                that.con.query(querry, function (err, result) {
                    if (err) {
                       console.log(err);
                        if (callback && typeof callback == 'function') {
                            callback(err, "");
                        }
                        reject(err);
                    }
                    else {
        
                        if (callback && typeof callback == 'function') {
                            callback("", result)
                        }
                        resolve(result);
                    }
                })
            }
        });
    }

    bubble_tvshowdetails(callback) //Gets serien, staffeln and episoden from the file / server and puts them into one array
    {
        var that = this;
        return new Promise(async (resolve, reject) => {

            var serien = await that.databasequerryhandler("select * from tvshow");
            var staffeln = await that.databasequerryhandler("select * from seasons");
            var episoden = await that.databasequerryhandler("select * from episode");
        
            //Serien die Staffeln hinzufügen
            for(let i=0;i<serien.length;i++)
            {
                let staffelneinerserie_0 = staffeln.filter(r => r.idShow === serien[i].idShow) 
                if(staffelneinerserie_0.length)
                {
                    let staffelneinerserie_1 = staffelneinerserie_0.filter(r => r.season >= 1)
                    if(staffelneinerserie_1.length)
                    {
                        serien[i].bubble_staffeldetails = staffelneinerserie_1
                    }
                    else
                    {
                        serien[i].bubble_staffeldetails = {"error":"error",length:"error"}
                    }
                }
            }
        
            //Folgen einer Staffel hinzufügen
            for(let i=0;i<staffeln.length;i++)
            {
                let episodeneinerserie_0 = episoden.filter(r => r.idSeason === staffeln[i].idSeason)
                if(episodeneinerserie_0.length)
                {
                    staffeln[i].bubble_episodendetails = episodeneinerserie_0
                }
                else
                {
                    staffeln[i].bubble_episodendetails = {"error":"error",length:"error"}
                }
            }
        
            ///***///Vorbereitung der Ausgabe///***///
            //Episoden direkt zu der Serie hinzufügen
            for(let i=0;i<serien.length;i++)
            {
                let episodeneinerserie_0 = episoden.filter(r => r.idShow === serien[i].idShow)
                if(episodeneinerserie_0.length)
                {
                    serien[i].bubble_episoden = episodeneinerserie_0
                }
                else
                {
                    serien[i].bubble_episoden = {"error":"error",length:"error"}
                }
            }
            //Alphabetisch nach Seriennamen ordnen
            serien.sort((a, b) => {
                if (true) {
                if (a["c00"] > b["c00"]) {
                    return 1
                } else if (a["c00"] < b["c00"]) {
                    return -1
                } else {
                    return 0
                }
                }
            });

            if (callback && typeof callback == 'function') {
                await callback("", serien);
                resolve();
            }
            else {
                resolve(serien);
            }

        });
    }
}


module.exports.hometvdbclass = hometvdbclass;