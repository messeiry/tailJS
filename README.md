# tailJS

the code below can read a configuration file that contains a list of log files on remote Linux / Unix Servers. we tail remotely those files and when changes happen we use the configuration in the file to to extract notifications parameters from teh log entries or even set default values for different fields.

The Below is a Sample of a configuration file written in JSON formate
{
  "root@10.10.10.50":
  [
    {
      "fileName": "/var/log/NodeJsTest",
      "fileDescription": "the first file",
      "GlobalFilterRegex": ".*?",
      "EventMap":
      [
        {
          "filterName"  : "filter_Error",
          "filterRegex" : "error",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "default:10.10.10.50",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        },
        {
          "filterName"  : "filter_URL",
          "filterRegex" : "url",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "'(.*?)'",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        },
        {
          "filterName"  : "filter_Critical",
          "filterRegex" : "Not Error",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "default:10.10.10.50",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        }
      ]
    },
    {
      "fileName": "/var/log/NodeJsTest2",
      "fileDescription": "the first file",
      "GlobalFilterRegex": ".*?",
      "EventMap":
      [
        {
          "filterName"  : "filter_Error",
          "filterRegex" : "error",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "default:10.10.10.50",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        },
        {
          "filterName"  : "filter_URL",
          "filterRegex" : "url",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "'(.*?)'",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        },
        {
          "filterName"  : "filter_Critical",
          "filterRegex" : "Not Error",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "default:10.10.10.50",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        }
      ]
    }
  ],
  "root@10.10.10.51":
  [
    {
      "fileName": "/var/log/NodeJsTest",
      "fileDescription": "the first file",
      "GlobalFilterRegex": ".*?",
      "EventMap":
      [
        {
          "filterName"  : "filter_Error",
          "filterRegex" : "error",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "default:10.10.10.50",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        },
        {
          "filterName"  : "filter_URL",
          "filterRegex" : "url",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "'(.*?)'",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        },
        {
          "filterName"  : "filter_Critical",
          "filterRegex" : "Not Error",
          "timeStampRegex": "default:now",
          "eventNameRegex": "default:CriticalSymptom",
          "elementNameRegex": "default:10.10.10.50",
          "instanceNameRegex": "default:CRM_ApplicationService",
          "classNameRegex": "default:SoftwareService",
          "severityRegex": "default:Critical"
        }
      ]
    }
  ]

}

for each log file there is GlobalFilterRegex which simply will pass only the notifications that pass the RegEx test.

the Keyword Default means the text after default will be taken as athe default value of the field.

if the default keyword is not  there the code will parse the input based on the Regex value stated in the configuration file.

Evaluate a recived input from Stdout against the aviable filters.
function Evaluatemessage(msg, EventMap, source, childProcessID, serverInProcess)
Note: notifications and events will be created only for the first filter that matches, the rest will be ignored.

Sending Traps is by using the below function:
function sendSNMPTrap(timeStampValue, eventNameValue,elementNameValue,instanceNameValue,classNameValue,severityValue,source,msg, filterName, serverInProcess)



the below commands can be used for troublshooting:
to check the usage of a process :
ps -p 3622 -o %cpu,%mem,cmd


to capture the Dump for the SNMP Traps Recieved :
[root@Smarts102 ~]# tcpdump -i eth3 -n "dst host 10.10.10.50 and dst port 162"


the recieved trap should loop like this in the tcp dump :
09:15:11.720071 IP 10.10.10.134.56824 > 10.10.10.50.snmptrap:  V2Trap(354)  .1.3.6.1.2.1.1.3.0=12689 .1.3.6.1.6.3.1.1.4.1.0=.1.3.6.1.4.1.2000.1 .1.3.6.1.2.1.1.0.0.7.1="11/3/2016, 9:15:13 AM" .1.3.6.1.2.1.1.0.0.7.2="CriticalSymptom" .1.3.6.1.2.1.1.0.0.7.3="url1" .1.3.6.1.2.1.1.0.0.7.4="CRM_ApplicationService" .1.3.6.1.2.1.1.0.0.7.5="SoftwareService" .1.3.6.1.2.1.1.0.0.7.6="default" .1.3.6.1.2.1.1.0.0.7.7="/var/log/NodeJsTest" .1.3.6.1.2.1.1.0.0.7.8="playVideo('url1') BREAK playVideo('url2') BREAK playVideo('url3')"

