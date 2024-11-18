# bubble_KodiDB_Analysis

### Example-Settings:

        {
            "sql1":
            {
                "active":true,
                "type":"sqllite",
                "filename":"sql1.db"
            },
            "sql2":
            {
                "active":true,
                "type":"sqllite",
                "filename":"sql2.db"
            },
            "program": "tvseries_dbprint",
            "detail_level":1
        }

## Setting-up

Create a "config.json" with the parts shown in the example

### SQL-Settings:

        -----SQL-LITE-----
        "sql1":
        {
            "active":true,
            "type":"sqllite",
            "filename":""
        },

        -----MYSQL-----
        "sql2":
        {   
			"active":true,
			"type":"mysql",
			"host":"",
			"port":3306,
			"username":"",
			"password":"",
			"databasename":""
			
        },
    

### Programs:

        -----Comparing Movies-----(sql1 & sql2)
        "program": movies_comp
            --Detail-level--
            "detail_level":1   (Only shows the name of the movie and on which side it doesn't exist)

        -----Comparing Series-----(sql1 & sql2)
        "program": tvseries_comp
            --Detail-level--
            "detail_level":1   (Only shows the name of the serie and on which side it doesn't exist)
            "detail_level":2   (Compares the amount of episodes and returns the difference if exists + level 1)
        -----Series-Double-Prevention-----(sql1)
         "program": tvseries_doubleprevent
            --Detail-level--
            "detail_level":1   (Only shows the name of the serie that exists 2 times)
        -----Series-Database-Print-----(sql1)
         "program": tvseries_dbprint
            --Detail-level--
            "detail_level":1   (Only shows the show, the amount of seasons and episodes)
	        "detail_level":2   (Prints the show with all the seasons and associated episodes f.e. Season:Episodes)
	        "detail_level":3   (Exports the whole DB as JSON)