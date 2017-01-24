//  Developed and Designed by : Mohamed ELMesseiry @ 2016
//  m.messeiry@gmail.com

"use strict";

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
each entry is for a server in the format User@ServerIP
then another nested loop for the nested log files within a server. this process is where a process is created to listen to log files.
the command used in listening to processes is the same for all the files.

the following command should return the last changed files however when it's called from ssh directly it's returning an error accessing teh files.
tail -F -n 1 $(ls -t /var/log/NodeJsTest2* | head -n1)
this will be skipped for now. we only need this option in case we need to pass wild card characters to get the lat log.

Note: using * in the fileName is not recommended and most probably will not work, the app is design to tail one single file at a time.
*/




for (let key in conf) {
    log("RemoteServer:   " + key);
    for (let i=0; i < conf[key].length; i++) {
            let itemConf = conf[key][i];

            // Get possible of actions
            var command = conf[key][i]['command'];
            var nixTail = conf[key][i]['nixTail'];
            var nixTailLatest = conf[key][i]['nixTailLatest'];

            // Handle execution to handlers
            if (nixTail) handleNixTail(key, nixTail, itemConf);
            else if(nixTailLatest) handleNixTailLatest(key,  nixTailLatest, itemConf);
            else if(command) handleLinuxCmd(key, command, itemConf);
    }

}

// Hack to keep running forever, this will be enhanced to handle the repition of execution needed for the scripts, so keep it like this for now.
//setTimeout(exitf = function(){ setTimeout(exitf, 99999999999999999); }, 99999999999999999);


/********************************************************************************************************/
/****************************   Tag handlers      *******************************************************/
/********************************************************************************************************/


/******** Nix handlers *******/

function handleLinuxCmd(key, command, itemConf){

    // This is simply here because no one would ever dream that he needs to add this param for it to work.
    if (command.includes("grep")){
        command = command.replace("grep", "grep --line-buffered ");
    }

    // Spawn and listen.
    var commandargs = '';
    log("ssh -t " + key + " " + command + " " + commandargs );
    var child = spawn("ssh",  ["-t", key, command]);
    log("Listening to : " + command + " Process Created with PID: " +  child.pid );

    child.stdout.on('data', (data)=> {
        //log(data);
        var serverInProcess = key;
        var childProcesID = child.pid.toString();
        ParseReceviedData(serverInProcess, command, data, childProcesID, itemConf);
    });

}

function handleNixTail (key, arg, itemConf){
    let command = "tail -F -n 1" + arg;
    handleLinuxCmd(key, command, itemConf);
}

function handleNixTailLatest (key, arg, itemConf){
    let command = "ls -t " + arg + " | head -1 | xargs -I % tail -f -n1000 %"
    handleLinuxCmd(key, command, itemConf);
}


/******** Win handlers *******/

/********************************************************************************************************/
/**************************** DATA Processsing functions ************************************************/
/********************************************************************************************************/


function ParseReceviedData(serverInProcess, command, data, childProcesID, itemConf) {
        let logFormateRegex = itemConf['OutputEntryFormatRegex'];
        let logFormateScope = itemConf['OutputEntryFormatScope'];

        var GlobalFilterRegex = new RegExp(itemConf["GlobalFilterRegex"], "g");
        var EventMap = itemConf["EventMap"];

        // exclude all notification that is not matching the GlobalRegex
        if (GlobalFilterRegex.test(data)) {
            // only executes when a GlobalRegex is matching the data comming.
            //console.log("Recieved Log Message from server matching Global RegEx=" + serverInProcess + "\t processID = " + childProcesID + "\t from logfile:" + command + "\n" + data);

            DetectBatchMessages(data, EventMap, command, childProcesID, serverInProcess, logFormateRegex, logFormateScope);
        }
}

/*
    * DetectBatchMessages is an evaluator that detect batch messages based on a regex, if the log message occures as a result of regex matching multiople times that means its a batch,
    * the regex is different from one log file to another so it needs to be re-evaluated for each case.
    *
 */
function DetectBatchMessages(data, EventMap, command, childProcesID, serverInProcess, logFormateRegex, logFormateScope) {

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
                Evaluatemessage(match, EventMap, command, childProcesID, serverInProcess);
            }
            //console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }


}

function Evaluatemessage(msg, EventMap, source, childProcessID, serverInProcess) {
    var instanceNameRegex;
    var severityRegex;
    var classNameRegex;
    var elementNameRegex;
    var filterName;
    var filterRegex;
    var timeStampRegex;
    var eventNameRegex;
    var userDefined1Regex;
    var userDefined2Regex;
    var userDefined3Regex;
    var userDefined4Regex;
    var userDefined5Regex;

    for (var i = 0; i < EventMap.length; i++) {
        filterName = EventMap[i]["filterName"];
        filterRegex = EventMap[i]["filterRegex"];
        timeStampRegex = EventMap[i]["timeStampRegex"];
        eventNameRegex = EventMap[i]["eventNameRegex"];
        elementNameRegex = EventMap[i]["elementNameRegex"];
        instanceNameRegex = EventMap[i]["instanceNameRegex"];
        classNameRegex = EventMap[i]["classNameRegex"];
        severityRegex = EventMap[i]["severityRegex"];

        userDefined1Regex = EventMap[i]["userDefined1Regex"];
        userDefined2Regex = EventMap[i]["userDefined2Regex"];
        userDefined3Regex = EventMap[i]["userDefined3Regex"];
        userDefined4Regex = EventMap[i]["userDefined4Regex"];
        userDefined5Regex = EventMap[i]["userDefined5Regex"];

        var timeStampValue, eventNameValue, elementNameValue, instanceNameValue, classNameValue, severityValue,userDefined1Value, userDefined2Value, userDefined3Value, userDefined4Value, userDefined5Value;

        //log(msg);
        msg = msg.toString().replace(/\n/g, "");

        // if the message is matching the regex then its gonna be parsed and will create a notification
        if (new RegExp(filterRegex).test(msg)) {

            if (timeStampValue === "" || !timeStampRegex) {
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

            if (eventNameValue === "" || !eventNameRegex) {
                eventNameValue = "default";
            } else {
                if (eventNameRegex.startsWith("default:")) {
                    eventNameValue = eventNameRegex.replace("default:", "");
                } else {
                    let match = new RegExp(eventNameRegex, "g").exec(msg);
                    if (match !== null) {
                        eventNameValue = match[1];
                    } else {
                        eventNameValue = "default";
                    }
                }
            }

            if (elementNameValue === "" || !elementNameRegex) {
                elementNameValue = "default";
            } else {
                if (elementNameRegex.startsWith("default:")) {
                    elementNameValue = elementNameRegex.replace("default:", "");
                } else {
                    let match = new RegExp(elementNameRegex, "g").exec(msg);
                    if (match !== null) {
                        elementNameValue = match[1];
                    } else {
                        elementNameValue = "default";
                    }
                }
            }


            if (instanceNameValue === "" || !instanceNameRegex) {
                instanceNameValue = "default";
            } else {
                if (instanceNameRegex.startsWith("default:")) {
                    instanceNameValue = instanceNameRegex.replace("default:", "");
                } else {
                    let match = new RegExp(instanceNameRegex, "g").exec(msg);
                    if (match !== null) {
                        instanceNameValue = match[1];
                    } else {
                        instanceNameValue = "default";
                    }
                }
            }


            if (classNameValue === "" || !classNameRegex) {
                classNameValue = "default";
            } else {
                if (classNameRegex.startsWith("default:")) {
                    classNameValue = classNameRegex.replace("default:", "");
                } else {
                    let match = new RegExp(classNameRegex, "g").exec(msg);
                    if (match !== null) {
                        classNameValue = match[1];
                    } else {
                        classNameValue = "default";
                    }
                }
            }


            if (severityValue === "" || !severityRegex) {
                severityValue = "default";
            } else {
                if (severityRegex.startsWith("default:")) {
                    severityValue = severityRegex.replace("default:", "");
                } else {
                    let match = new RegExp(severityRegex, "g").exec(msg);
                    if (match !== null) {
                        severityValue = match[1];
                    } else {
                        severityValue = "default";
                    }
                }
            }

            // UserDefined vars
            if (userDefined1Value === "" || !userDefined1Regex) {
                userDefined1Value = "default";
            } else {
                if (userDefined1Regex.startsWith("default:")) {
                    userDefined1Value = userDefined1Regex.replace("default:", "");
                } else {
                    let match = new RegExp(userDefined1Regex, "g").exec(msg);
                    if (match !== null) {
                        userDefined1Value = match[1];
                    } else {
                        userDefined1Value = "default";
                    }
                }
            }

            if (userDefined2Value === "" || !userDefined2Regex) {
                userDefined2Value = "default";
            } else {
                if (userDefined2Regex.startsWith("default:")) {
                    userDefined2Value = userDefined2Regex.replace("default:", "");
                } else {
                    let match = new RegExp(userDefined2Regex, "g").exec(msg);
                    if (match !== null) {
                        userDefined2Value = match[1];
                    } else {
                        userDefined2Value = "default";
                    }
                }
            }

            if (userDefined3Value === "" || !userDefined3Regex) {
                userDefined3Value = "default";
            } else {
                if (userDefined3Regex.startsWith("default:")) {
                    userDefined3Value = userDefined3Regex.replace("default:", "");
                } else {
                    let match = new RegExp(userDefined3Regex, "g").exec(msg);
                    if (match !== null) {
                        userDefined3Value = match[1];
                    } else {
                        userDefined3Value = "default";
                    }
                }
            }

            if (userDefined4Value === "" || !userDefined4Regex) {
                userDefined4Value = "default";
            } else {
                if (userDefined4Regex.startsWith("default:")) {
                    userDefined4Value = userDefined4Regex.replace("default:", "");
                } else {
                    let match = new RegExp(userDefined4Regex, "g").exec(msg);
                    if (match !== null) {
                        userDefined4Value = match[1];
                    } else {
                        userDefined4Value = "default";
                    }
                }
            }

            if (userDefined5Value === "" || !userDefined5Regex) {
                userDefined5Value = "default";
            } else {
                if (userDefined5Regex.startsWith("default:")) {
                    userDefined5Value = userDefined5Regex.replace("default:", "");
                } else {
                    let match = new RegExp(userDefined5Regex, "g").exec(msg);
                    if (match !== null) {
                        userDefined5Value = match[1];
                    } else {
                        userDefined5Value = "default";
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
                log("---- UserDefined1: \t" + userDefined1Value);
                log("---- UserDefined2: \t" + userDefined2Value);
                log("---- UserDefined3: \t" + userDefined3Value);
                log("---- UserDefined4: \t" + userDefined4Value);
                log("---- UserDefined5: \t" + userDefined5Value);
                log("\n");
            }
            if (enableTrapSend) {
                sendSNMPTrap(timeStampValue, eventNameValue, elementNameValue, instanceNameValue, classNameValue, severityValue, source, msg, filterName, serverInProcess ,userDefined1Value ,userDefined2Value ,userDefined3Value ,userDefined4Value ,userDefined5Value);


            }


            // the Break is to get the first match in the filters only
            break;

        }


    }
}



function sendSNMPTrap(timeStampValue, eventNameValue,elementNameValue,instanceNameValue,classNameValue,severityValue,source,msg, filterName, serverInProcess, userDefined1Value ,userDefined2Value ,userDefined3Value ,userDefined4Value ,userDefined5Value) {
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
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.11",
            type: snmp.ObjectType.OctetString,
            value: userDefined1Value
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.12",
            type: snmp.ObjectType.OctetString,
            value: userDefined2Value
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.13",
            type: snmp.ObjectType.OctetString,
            value: userDefined3Value
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.14",
            type: snmp.ObjectType.OctetString,
            value: userDefined4Value
        },
        {
            oid: "1.3.6.1.2.1.1.0.0.7.15",
            type: snmp.ObjectType.OctetString,
            value: userDefined5Value
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




