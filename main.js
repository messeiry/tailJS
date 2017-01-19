//  Developed and Designed by : Mohamed ELMesseiry @ 2016
//  m.messeiry@gmail.com

var cproc = require('child_process');
var spawn = cproc.spawn;
var snmp = require ("net-snmp");
var fs = require('fs');

var confFile = fs.readFileSync("conf.json");
var conf = JSON.parse(confFile);


/*
* SNMP Trap Generator
*/
var enableTrapSend = true;
var enableConsoleLog = true;

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

/*
loop for every entry in the conf.json file
each entry is for a server in the foirmate User@ServerIP
then another nested loop for the nested log files within a server. this process is where a process is created to listen to log files.
the command used in listening to processes is the same for all the files.

 tailf -n1  $(ls -t /var/log/NodeJsTest2* | head -n1) | awk '$1=$1' ORS=' ' | grep --line-buffered 'Welcome'
 tailf -n 1 $(ls -t /var/log/NodeJsTest2* | head -n1)

 */

for (var key in conf) {

    //console.log(">>logServer:   " + key);
    for (var i=0; i < conf[key].length; i++) {
        var fileName = conf[key][i]['fileName'];
        var fileDescription = conf[key][i]['fileDescription'];
        var logFormateRegex = conf[key][i]['logFormateRegex'];;
        var commandargs = '';
        var child = spawn("ssh",  [key, "tailf -n 1", fileName ,commandargs]);

        //console.log("Listening to : " + fileName);
        //console.log("Process Created >>" + child.pid);

        ParseRecievedLog(child);

    }

}


function ParseRecievedLog(child){
        child.stdout.on('data', function(data) {

            var serverInProcess = child.spawnargs[1].toString();
            var childProcesID = child.pid.toString();
            var fileInProcess = child.spawnargs[3].toString();

            // loop in all log files of teh same server and stop at the log file where a process id is receiving a message
            for (i=0; i< conf[serverInProcess].length; i++) {
                if (fileInProcess === conf[serverInProcess][i]["fileName"]) {
                    // extract the configuration for mapping the messages in this file

                    var GlobalFilterRegex = new RegExp(conf[serverInProcess][i]["GlobalFilterRegex"], "g");
                    var EventMap =  conf[serverInProcess][i]["EventMap"];

                    // exclude all notification that is not matching the GlobalRegex
                    if (GlobalFilterRegex.test(data)) {
                        // only executes when a GlobalRegex is matching the data comming.
                        //console.log("Recieved Log Message from server matching Global RegEx=" + serverInProcess + "\t processID = " + childProcesID + "\t from logfile:" + fileInProcess + "\n" + data);

                        DetectBatchMessages(data, EventMap, fileInProcess, childProcesID, serverInProcess, logFormateRegex);
                        // Commented to handle multiple lines
                        //Evaluatemessage(data, EventMap, fileInProcess, childProcesID, serverInProcess);
                    }
                }

            }

        });
}



/*
    * DetectBatchMessages is an evaluator that detect batch messages based on a regex, if the log message occures as a result of regex matching multiople times that means its a batch,
    * the regex is different from one log file to another so it needs to be re-evaluated for each case.
    *
 */
function DetectBatchMessages(data, EventMap, fileInProcess, childProcesID, serverInProcess, logFormateRegex) {
    // the below line means we will use strict mode to be able to run es6 js other wise we will have to run the whole app in strict mode like this nodejs --use_strict main.js

    "use strict";
    //var regex = /(\[\w+ \d*, \d{1,4} \d*:\d*:\d* \w+ \w+ \W\w+]) ([^\[]*)/g;
    var regex = new RegExp(logFormateRegex, "g");
    //regex = logFormateRegex;
    //console.log(regex);


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

                log("<--- Notification Recieved ---<");
                log("---- TimeStamp: \t" + timeStampValue);
                log("---- EventName: \t" + eventNameValue);
                log("---- ElementName: \t" + elementNameValue);
                log("---- InstanceName: \t" + instanceNameValue);
                log("---- ClassName: \t" + classNameValue);
                log("---- SeverityName: \t" + severityValue);
                log("---- EventSource: \t" + serverInProcess);
                log("---- filterName: \t" + filterName);
                log("---- logFile: \t" + source);
                log("---- OS Process: \t" + childProcessID);
                log("---- EventText: \t" + msg);
                log("\n");
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
    log("----> SNMP Trap Sent to " + snmpTrapServer);
}



function log(msg) {
    console.log(new Date().toLocaleString() + " : " + msg);
}




