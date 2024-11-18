const fs = require('fs');
var hometvdbmodule = require("./hometvdb.js")

let rawconfig = fs.readFileSync(__dirname + '/config.json');
let config = JSON.parse(rawconfig)

async function start()
{
    
    var sql1 = new hometvdbmodule.hometvdbclass(config.sql1);
    await sql1.connect().then(function(res){console.log(res.answer)})
    
    var sql2 = new hometvdbmodule.hometvdbclass(config.sql2);
    if(sql2.active == true)
    {  
        await sql2.connect().then(function(res){console.log(res.answer)})
    }
    
    let program = commands[config.program]
    if (commands[config.program]) 
    {
        var output = null;
        if(program.requirements.sql1)
        {
            if(sql1.active)
            {
                if(program.requirements.sql2)
                {
                    if(sql2.active)
                    {
                        output = await program.process(sql1,sql2);
                    }
                    else
                    {
                        console.log("SQL2 required, but not active");
                        process.abort();
                    }
                }
                else
                {
                    output = await program.process(sql1);
                }
            }
            else
            {
                console.log("SQL1 required, but not active");
                process.abort();
            }

        }
        else
        {
            console.log("SQL1.requirement not true, doesnt make sense");
            process.abort();
        }
        await write_to_disk(output).then(function(res){console.log(res)})
    }
    else
    {
        console.log("Program not found!")
        process.abort();
    }
}
start()

var commands = 
{
    "tvseries_comp":
    {
        requirements:{"sql1":true,"sql2":true},
        process:async function(sql1,sql2,callback)
        {
            return new Promise(async (resolve, reject) => {
            var series1 = await sql1.bubble_tvshowdetails();
            console.log("Bubble_TVShowDetails loaded for SQL1");
            var series2 = await sql2.bubble_tvshowdetails();
            console.log("Bubble_TVShowDetails loaded for SQL2");
            
            var show_differences = [];
            var episoden_differences = [];
        
        
            for(let i=0;i< series2.length;i++)
            {
                let diff = series1.filter(r => r.c00 === series2[i].c00)
                if(!diff.length)
                {
                    show_differences.push({"show":series2[i].c00,"not_found_in":"sql1"});
                }
                else
                {
                    if(series2[i].bubble_episoden.length !== diff[0].bubble_episoden.length)
                    {
                        episoden_differences.push({"show":series2[i].c00,"episoden_amount_sql1":diff[0].bubble_episoden.length,"episoden_amount_sql2":series2[i].bubble_episoden.length});
                    }
                }
            }
            for(let i=0;i< series1.length;i++)
            {
                let diff = series2.filter(r => r.c00 === series1[i].c00)
                if(!diff.length)
                {
                    show_differences.push({"show":series1[i].c00,"not_found_in":"sql2"});
                }
                else
                {
                    if(series1[i].bubble_episoden.length !== diff[0].bubble_episoden.length)
                    {
                        episoden_differences.push({"show":series1[i].c00,"episoden_amount_sql2":diff[0].bubble_episoden.length,"episoden_amount_sql1":series1[i].bubble_episoden.length});
                    }
                }
            }
            


        
            var ausgabe = "";
            if(config.detail_level == 1)
            {
                for(let i=0;i< show_differences.length;i++)
                {
                    ausgabe += `${show_differences[i].show}  ;;  ${show_differences[i].not_found_in}  ;;\n`
                }
            }
            else if(config.detail_level == 2)
            {
                for(let i=0;i< show_differences.length;i++)
                {
                    ausgabe += `${show_differences[i].show}  ;;  ${show_differences[i].not_found_in}  ;;\n`
                }
                ausgabe += "####################################################\n"

                var episoden_differences_without_doubles = []
                for(let i=0;i< episoden_differences.length;i++)
                {
                    let doubles = episoden_differences_without_doubles.filter(r => r.show === episoden_differences[i].show)
                    if(!doubles.length)
                    {
                        episoden_differences_without_doubles.push(episoden_differences[i])
                    }

                }
                for(let i=0;i< episoden_differences_without_doubles.length;i++)
                {
                    ausgabe += `${episoden_differences_without_doubles[i].show}  ;;  SQL1:${episoden_differences_without_doubles[i].episoden_amount_sql1}  ;; SQL2:${episoden_differences_without_doubles[i].episoden_amount_sql2}  ;;\n`
                }
            }
            else
            {
                console.log("Unknown Detail_Level!")
                process.abort();
            }


            if (callback && typeof callback == 'function') {
                await callback("", ausgabe);
                resolve();
            }
            else {
                resolve(ausgabe);
            }
        });
        }
    },
    "movies_comp":
    {
        requirements:{"sql1":true,"sql2":true},
        process:async function(sql1,sql2,callback)
        {
            return new Promise(async (resolve, reject) => {
            var movies1 = await sql1.databasequerryhandler("select * from movie");
            console.log("Movies loaded for SQL1");
            var movies2 = await sql2.databasequerryhandler("select * from movie");
            console.log("Movies loaded for SQL2");
        
            var movies_differences = [];
            for(let i=0;i< movies2.length;i++)
            {
                let diff = movies1.filter(r => r.c00 === movies2[i].c00)
                if(!diff.length)
                {
                    movies_differences.push({"movie":movies2[i].c00,"not_found_in":"sql1"});
                }
            }
            for(let i=0;i< movies1.length;i++)
            {
                let diff = movies2.filter(r => r.c00 === movies1[i].c00)
                if(!diff.length)
                {
                    movies_differences.push({"movie":movies1[i].c00,"not_found_in":"sql2"});
                }
            }
        
            var ausgabe = "";
            if(config.detail_level == 1)
            {
                for(let i=0;i< movies_differences.length;i++)
                {
                    ausgabe += `${movies_differences[i].movie}  ;;  ${movies_differences[i].not_found_in}  ;;\n`
                }
            }
            else
            {
                console.log("Unknown Detail_Level!")
                process.abort();
            }

            if (callback && typeof callback == 'function') {
                await callback("", ausgabe);
                resolve();
            }
            else {
                resolve(ausgabe);
            }
        });
        }
    },
    "tvseries_doubleprevent":
    {
        requirements:{"sql1":true,"sql2":false},
        process:async function(sql1,callback)
        {
            return new Promise(async (resolve, reject) => {
            var series1 = await sql1.bubble_tvshowdetails();
            console.log("Bubble_TVShowDetails loaded for SQL1");
        
            var doubles = []
            for(let i=0;i<series1.length;i++) 
            {
                let double_prevention = series1.filter(r => r.c00 === series1[i].c00)
                if(double_prevention.length > 1)
                {
                    let alreadyinlist = doubles.filter(r => r.c00 === double_prevention[0].c00)
                    if(!alreadyinlist.length)
                    {
                        doubles.push(double_prevention[0])
                    }
                }
            }
        
            var ausgabe = "";
            if(config.detail_level == 1)
            {
                for(let i=0;i< doubles.length;i++)
                {
                    ausgabe += `${doubles[i].c00}  ;;\n`
                }
            }
            else
            {
                console.log("Unknown Detail_Level!")
                process.abort();
            }

            if (callback && typeof callback == 'function') {
                await callback("", ausgabe);
                resolve();
            }
            else {
                resolve(ausgabe);
            }
        });

        }
    },
    "tvseries_dbprint":
    {
        requirements:{"sql1":true,"sql2":false},
        process:async function(sql1,callback)
        {
            return new Promise(async (resolve, reject) => {
            var series1 = await sql1.bubble_tvshowdetails();
            console.log("Bubble_TVShowDetails loaded for SQL1");
        
            ///***///Ausgabe///***///
            var ausgabe = ""
            if(config.detail_level == 1)
            {
                for(let i=0;i<series1.length;i++)
                {
                    ausgabe += `${series1[i].c00} ;; ${series1[i].bubble_staffeldetails.length} Staffeln ;; ${series1[i].bubble_episoden.length} Folgen ;;\n`
                    
                }
            }
            else if(config.detail_level == 2)
            {
                for(let i=0;i<series1.length;i++)
                {
                    ausgabe += `${series1[i].c00} ;; ${series1[i].bubble_staffeldetails.length} Staffeln ;;`
                    for(let u=0;u < series1[i].bubble_staffeldetails.length;u++)
                    {
                        let test = series1[i].bubble_staffeldetails[u].bubble_episodendetails
                        let test2 = series1[i].bubble_staffeldetails[u].bubble_episodendetails.length
                        ausgabe += ` S${series1[i].bubble_staffeldetails[u].season}:${series1[i].bubble_staffeldetails[u].bubble_episodendetails.length} `
                    }
                    ausgabe +=`;; ${series1[i].bubble_episoden.length} Folgen ;;\n`
                    
                }
            }
            else if(config.detail_level == 3)
            {
                ausgabe = JSON.stringify(series1)
            }

            if (callback && typeof callback == 'function') {
                await callback("", ausgabe);
                resolve();
            }
            else {
                resolve(ausgabe);
            }
        });
        
        }

        
    }

}

async function write_to_disk(text,callback)
{
    return new Promise(async (resolve, reject) => {
        fs.writeFile("series.txt", text, null,async function(err,res)
        {
            if(err)
            {
                console.log("Error happened writing to file " + err)
                if (callback && typeof callback == 'function') {
                    await callback(err, "");
                    resolve();
                }
                else {
                    reject(err);
                }
                return;
            }
            else
            {
                if (callback && typeof callback == 'function') {
                    await callback("", "Writing successfull");
                    resolve();
                }
                else {
                    resolve("Writing successfull");
                }
                return;
            }
    });
    });
}