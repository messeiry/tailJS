/*
APPLICATION NAME:       tailJS
DEVELOLPED BY:          MOHAMED ELMESSEIRY, m.messeiry@gmail.com
APP TRACKING AND URL:   https://github.com/messeiry/tailJS/
ABOUT THE APPLICATION: 
- the application is utilizing the nodejs spawn lib to ssh and tail log files existing at remote locations
- the remote system should have password less authentication with the server executing the script
- the app tails logs and filter based on multiple criteria then use the output to generate SNMP to external system

FEATURES:
- the app gets the latest updated file of a configuration file using ls search criteria
    for example: /var/log/ICMS_ALEPO_PLYS_Alepo_*_.log will refer to /var/log/ICMS_ALEPO_PLYS_Alepo_20161213_.log instead of /var/log/ICMS_ALEPO_PLYS_Alepo_20161212_.log
- the app handels file rotations as long the file stays with the same name.
    note: in case file changes names the file definition in the log file should refelect teh naming criteria and each time the app is executed it will get the latest
- the app handels bulk inserts in log files. where applications that write logs dump multiple log entries at once. for that the log format should be stated in RegEX at conf file
- the app handles multiple lines in the same log entry. for that the log format should be stated in RegEX at conf file.

USEFULL COMMANDS: 
- get the processes running tail to kill for troublshooting purposes:
    ps aux | grep -i "tail" | awk '{print "kill -9 " $2}'
*/

// Includes
var cproc = require('child_process');
var spawn = cproc.spawn;
var snmp = require ("net-snmp");
var fs = require('fs');

// logs to be monitored configuration file
var confFile = fs.readFileSync("conf.json");
var conf = JSON.parse(confFile);

// logging details for console
var enableConsoleLog = true;
var debug = false ;

// SNMP Trap Generator Configurations
var enableTrapSend = true;
var snmpTrapServer = "10.10.10.50";
var snmpCommunity = "public";
var enterpriseOid = "1.3.6.1.4.1.2000.0.0.7.1";
var options = {
    port: 161,
    retries: 1,
    timeout: 5000,
    transport: "udp4",
    trapPort: 162,
    version: snmp.Version2c
};



for (var key in conf) {
	for (var i=0; i < conf[key].length; i++) {
        var conffileName = conf[key][i]['fileName'];
        var fileDescription = conf[key][i]['fileDescription'];
        var logFormateRegex = conf[key][i]['logFormateRegex'];
        var logFormateScope = conf[key][i]['logFormateScope'];
		var GlobalFilterRegex = conf[key][i]['GlobalFilterRegex'];

		var EventMap = conf[key][i]['EventMap'];

        var fileName = "";
        
        if (debug)
        	log("checking file name " + conffileName);

        var checkFile = spawn("ssh", [key, "ls -t "+conffileName+ "| head -n 1"]);

        checkFiles(key, checkFile, logFormateRegex, logFormateScope, conffileName, fileDescription, GlobalFilterRegex, EventMap);


    }
}


function checkFiles(key, checkFile, logFormateRegex, logFormateScope, conffileName, fileDescription, GlobalFilterRegex, EventMap) {
	"use strict";

	checkFile.stderr.on('data', function(data) {
    	if (debug)
      		log('Error finding log file: ' + data);
    })

	checkFile.stdout.on('data', function(data) {
    	fileName = data.toString().replace(/\n/g,"");
		if (enableConsoleLog) {
			log("Connected and Tailing:\t" + key.toString() + "\t" +  fileDescription +  "\t"  + fileName);
		}
      	if (debug)
      		log('log file found: ' + fileName);
      
      // create another spawn for tailing the file
      var child = spawn("ssh",  [key, "tail -F -n 1", fileName]);

      child.stdout.on('data', function(data) { 
		var serverInProcess = child.spawnargs[1].toString();
        var childProcesID = child.pid.toString();
        var fileInProcess = child.spawnargs[3].toString();

        let globalRegex = new RegExp(GlobalFilterRegex, "g");

        if (globalRegex.test(data)) {
        	if (debug)
   		        log("Global filter matched for log::" + "\t" + serverInProcess + "\tPID:" + childProcesID + "\tfileInProcess:" + fileInProcess + "\tExtractedfileName:" + fileName + "\tconffileName:" + conffileName + "\tlogFormateRegex" + logFormateRegex + "\tlogFormateScope:" + logFormateScope + "\tGlobalFilterRegex:" + GlobalFilterRegex + "\tEventMap:" + EventMap);
       			
			DetectBatchMessages(data, EventMap, fileInProcess, childProcesID, serverInProcess, logFormateRegex, logFormateScope);
        } else {
        	if (debug)
        		log("log entry not matching global filter detected");
        }



      });
      

    })
}


/*
    * DetectBatchMessages is an evaluator that detect batch messages based on a regex, if the log message occures as a result of regex matching multiople times that means its a batch,
    * the regex is different from one log file to another so it needs to be re-evaluated for each case.
    *
 */
function DetectBatchMessages(data, EventMap, fileInProcess, childProcesID, serverInProcess, logFormateRegex, logFormateScope) {
    // the below line means we will use strict mode to be able to run es6 js other wise we will have to run the whole app in strict mode like this nodejs --use_strict main.js
    "use strict";
    //console.log(data.toString());
    //console.log(logFormateRegex);
    //console.log(logFormateScope);

    var regex = new RegExp(logFormateRegex, logFormateScope);

    let m;

    while ((m = regex.exec(data)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            if (groupIndex === 0) {
                //console.log(groupIndex, match);
                Evaluatemessage(match, EventMap, fileInProcess, childProcesID, serverInProcess);
            }
            //console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }


}


function Evaluatemessage(msg, EventMap, source, childProcessID, serverInProcess) {
	
    var instanceNameRegex;
    var severityRegex;
    var severityRegex;
    var classNameRegex;
    var elementNameRegex;
    var filterName;
    var filterRegex;
    var timeStampRegex;
    var eventNameRegex;

    for (var i = 0; i < EventMap.length; i++) {        
        filterName = EventMap[i]["filterName"];
        filterRegex = EventMap[i]["filterRegex"];
        timeStampRegex = EventMap[i]["timeStampRegex"];
        eventNameRegex = EventMap[i]["eventNameRegex"];
        elementNameRegex = EventMap[i]["elementNameRegex"];
        instanceNameRegex = EventMap[i]["instanceNameRegex"];
        classNameRegex = EventMap[i]["classNameRegex"];
        severityRegex = EventMap[i]["severityRegex"];
        var timeStampValue, eventNameValue, elementNameValue, instanceNameValue, classNameValue, severityValue = "";

        msg = msg.toString().replace(/\n/g, "");

        // if the message is matching the regex then its gonna be parsed and will create a notification
        if (new RegExp(filterRegex).test(msg)) {

            if (timeStampValue === "") {
                timeStampValue = new Date().toLocaleString();
            } else {
                if (timeStampRegex.startsWith("default:")) {
                    timeStampValue = new Date().toLocaleString();
                } else {
                    match = new RegExp(timeStampRegex, "g").exec(msg);
                    if (match !== null) {
                        timeStampValue = match[1];
                    } else {
                        timeStampValue = new Date().toLocaleString();
                    }
                }
            }

            if (eventNameValue === "") {
                eventNameValue = "default";
            } else {
                if (eventNameRegex.startsWith("default:")) {
                    eventNameValue = eventNameRegex.replace("default:", "");
                } else {
                    match = new RegExp(eventNameRegex, "g").exec(msg);
                    if (match !== null) {
                        eventNameValue = match[1];
                    } else {
                        eventNameValue = "default";
                    }
                }
            }

            if (elementNameValue === "") {
                elementNameValue = "default";
            } else {
                if (elementNameRegex.startsWith("default:")) {
                    elementNameValue = elementNameRegex.replace("default:", "");
                } else {
                    match = new RegExp(elementNameRegex, "g").exec(msg);
                    if (match !== null) {
                        elementNameValue = match[1];
                    } else {
                        elementNameValue = "default";
                    }
                }
            }


            if (instanceNameValue === "") {
                instanceNameValue = "default";
            } else {
                if (instanceNameRegex.startsWith("default:")) {
                    instanceNameValue = instanceNameRegex.replace("default:", "");
                } else {
                    match = new RegExp(instanceNameRegex, "g").exec(msg);
                    if (match !== null) {
                        instanceNameValue = match[1];
                    } else {
                        instanceNameValue = "default";
                    }
                }
            }


            if (classNameValue === "") {
                classNameValue = "default";
            } else {
                if (classNameRegex.startsWith("default:")) {
                    classNameValue = classNameRegex.replace("default:", "");
                } else {
                    match = new RegExp(classNameRegex, "g").exec(msg);
                    if (match !== null) {
                        classNameValue = match[1];
                    } else {
                        classNameValue = "default";
                    }
                }
            }


            if (severityValue === "") {
                severityValue = "default";
            } else {
                if (severityRegex.startsWith("default:")) {
                    severityValue = severityRegex.replace("default:", "");
                } else {
                    match = new RegExp(severityRegex, "g").exec(msg);
                    if (match !== null) {
                        severityValue = match[1];
                    } else {
                        severityValue = "default";
                    }
                }
            }


            if (enableConsoleLog) {
            	log("Notification Recieved" +"\n"+ "\t TimeStamp: \t" + timeStampValue +"\n"+ "\t EventName: \t" + eventNameValue +"\n"+ "\t ElementName: \t" + elementNameValue +"\n"+ "\t InstanceName: \t" + instanceNameValue +"\n"+ "\t ClassName: \t" + classNameValue +"\n"+ "\t SeverityName: \t" + severityValue +"\n"+ "\t EventSource: \t" + serverInProcess +"\n"+ "\t filterName: \t" + filterName +"\n"+ "\t logFile: \t" + source +"\n"+ "\t OS Process: \t" + childProcessID +"\n"+ "\t EventText: \t" + msg +"\n");
            }
            if (enableTrapSend) {
                sendSNMPTrap(timeStampValue, eventNameValue, elementNameValue, instanceNameValue, classNameValue, severityValue, source, msg, filterName, serverInProcess);
            }


            // the Break is to get the first match in the filters only
            break;

        }


    }
}



function sendSNMPTrap(timeStampValue, eventNameValue,elementNameValue,instanceNameValue,classNameValue,severityValue,source,msg, filterName, serverInProcess) {
    // combining the varbindsl of the trap from JSON array
    var varbinds = [
        {
            oid: "1.3.6.1.2.1.1.0.0.7.1",
            type: snmp.ObjectType.OctetString,
            value: timeStampValue
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.2",
            type: snmp.ObjectType.OctetString,
            value: eventNameValue
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.3",
            type: snmp.ObjectType.OctetString,
            value: elementNameValue
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.4",
            type: snmp.ObjectType.OctetString,
            value: instanceNameValue
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.5",
            type: snmp.ObjectType.OctetString,
            value: classNameValue
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.6",
            type: snmp.ObjectType.OctetString,
            value: severityValue
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.7",
            type: snmp.ObjectType.OctetString,
            value: msg
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.8",
            type: snmp.ObjectType.OctetString,
            value: serverInProcess
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.9",
            type: snmp.ObjectType.OctetString,
            value: filterName
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.10",
            type: snmp.ObjectType.OctetString,
            value: source
        }

    ];



    var session = snmp.createSession(snmpTrapServer,snmpCommunity,options)
    session.trap (enterpriseOid, varbinds,
        function (error) {
            if (error)
                console.error (error);
        });

    if (debug)
    	log("SNMP Trap Sent to " + snmpTrapServer);
}

function log(msg) {
    console.log(new Date().toLocaleString() + " : " + msg);
}



