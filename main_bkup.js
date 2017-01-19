var cproc = require('child_process');
var spawn = cproc.spawn;

var fs = require('fs');
var confFile = fs.readFileSync("conf.json");
var conf = JSON.parse(confFile);

for (var key in conf) {
    console.log(">> " + key);
    for (var i=0; i < conf[key].length; i++) {
        var fileName = conf[key][i]['fileName'];
        var fileDescription = conf[key][i]['fileDescription'];
        var commandargs = "";
        var child = spawn("ssh",  [key, "tail -n 1 -F ", fileName, commandargs]);
        getProcessStdout(child);

    }

}

function getProcessStdout(child) {
    child.stdout.on('data', function(data) {

        console.log(child.pid);

        for (i=0; i< conf[child.spawnargs[1]].length; i++) {

            if (child.spawnargs[3] === conf[child.spawnargs[1]][i]["fileName"]) {
                var filter1 = conf[child.spawnargs[1]][i]["filter1"];
                var timeStampRegex = conf[child.spawnargs[1]][i]["timeStampRegex"];
                var eventNameRegex = conf[child.spawnargs[1]][i]["eventNameRegex"];
                var elementNameRegex = conf[child.spawnargs[1]][i]["elementNameRegex"];
                var instanceNameRegex = conf[child.spawnargs[1]][i]["instanceNameRegex"];
                var classNameRegex = conf[child.spawnargs[1]][i]["classNameRegex"];
                var severityRegex = conf[child.spawnargs[1]][i]["severityRegex"];
                var timeStampValue, eventNameValue, elementNameValue, instanceNameValue, classNameValue, severityValue= "";

                //console.log(filter1);
                var reg = new RegExp(filter1);
                console.log(reg);
                console.log(reg.test(data));
                if (reg.test(data)) {
                    console.log("MATCHED : in : " + child.spawnargs[3] +"\n" + data.toString().split("\n").join(" "));
                } else {
                    console.log("NOT MATCHED : in : "+ child.spawnargs[3] +"---------------------------\n : " + data.toString().split("\n").join(" "));
                }


                /*
                if (data.toString().includes(filter1)) {

                    if (timeStampRegex != "" && timeStampRegex.startsWith("default:")) {
                        timeStampValue =  new Date().toLocaleString();
                    } else {
                        //console.log("Applying regex for timestamp");
                    }

                    if (eventNameRegex != "" && eventNameRegex.startsWith("default:")) {
                        eventNameValue = eventNameRegex.replace("default:","");
                    } else {
                        //console.log(eventNameRegex);
                        var str ="playVideo(url1) BREAK playVideo('url2') BREAK playVideo('url3')";
                        var re = new RegExp(eventNameRegex);

                        eventNameValue = re.exec(data)[1].replace("'",'').replace("'","");

                        //console.log(new RegExp(eventNameRegex).exec(str)[1]);
                    }

                    if (elementNameRegex != "" && elementNameRegex.startsWith("default:")) {
                        elementNameValue = elementNameRegex.replace("default:","");
                    } else {
                        //console.log("Applying regex for timestamp");
                    }

                    if (instanceNameRegex != "" && instanceNameRegex.startsWith("default:")) {
                        instanceNameValue = instanceNameRegex.replace("default:","");
                    } else {
                        //console.log("Applying regex for timestamp");
                    }

                    if (classNameRegex != "" && classNameRegex.startsWith("default:")) {
                        classNameValue = classNameRegex.replace("default:","");
                    } else {
                        //console.log("Applying regex for timestamp");
                    }


                    if (severityRegex != "" && severityRegex.startsWith("default:")) {
                        severityValue = severityRegex.replace("default:","");
                    } else {
                        //console.log("Applying regex for timestamp");
                    }

                    console.log("\nRecieved Log Entry: " + child.pid + ">>" + child.spawnargs[1] + child.spawnargs[3]+ ">> " + data);
                    //console.log("Event Creation:");
                    console.log("--- TimeStamp: " + timeStampValue);
                    console.log("--- EventName: " + eventNameValue);
                    console.log("--- ElementName: " + elementNameValue);
                    console.log("--- InstanceName: " + instanceNameValue);
                    console.log("--- ClassName: " + classNameValue);
                    console.log("--- SeverityName: " + severityValue);
                    console.log("--- EventText: " + data.toString().replace("\n",""));

                }


                */

            }
        }



    });
}











/* NOTES Section */

/*

var str ="playVideo('url1') BREAK playVideo('url2') BREAK playVideo('url3')";

         /('(.*?)')g/
var re = /\('(.*?)'\)/g;
console.log(re.exec(str)[1]);
//while (match = re.exec(str)) {
//    console.log(match[1]);
//}




 {
 "root@10.10.10.50"  : [
 {"fileName": "/var/log/NodeJsTest", "fileDescription" : "the first file"},
 {"fileName": "/var/log/NodeJsTest2", "fileDescription" : "the Second file"}
 ],
 "root@10.10.10.51"  : [
 {"fileName": "/var/log/NodeJsTest", "fileDescription" : "the first file"},
 {"fileName": "/var/log/NodeJsTest2", "fileDescription" : "the Second file"}
 ]
 }

*/

/*
* Basic Program
 var cproc = require('child_process');
 var exec = cproc.exec;
 var spawn = cproc.spawn;

 var command = "ssh";
 var args = ["root@10.10.10.50", "tail -n 1 -F /var/log/NodeJsTest"];
 var child = spawn(command, args);

 child.stdout.on('data', function(data) {
 console.log("DATA >> " + data);
 });



 console.log("---- All Programs Now Listening to Log Files ------");

 child.stderr.on('data', function(data) {
 console.log('stderr: ' + data);
 });

 child.on('close', function(code) {
 console.log('exit code: ' + code);
 process.exit();
 });
*
* */


/*
 var command2 = "ssh";
 var args2 = ["root@10.10.10.50", "tail -n 1 -F /var/log/NodeJsTest2"];
 var child2 = spawn(command2, args2);
 child2.stdout.on('data', function(data2) {
 //console.log('stdout: ' + data);
 console.log('Second File Log: ' + data2);
 });
*/