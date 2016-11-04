# tailJS

to check the usage of a process :
ps -p 3622 -o %cpu,%mem,cmd


to capture the Dump for the SNMP Traps Recieved :
[root@Smarts102 ~]# tcpdump -i eth3 -n "dst host 10.10.10.50 and dst port 162"


the recieved trap should loop like this in the tcp dump :
09:15:11.720071 IP 10.10.10.134.56824 > 10.10.10.50.snmptrap:  V2Trap(354)  .1.3.6.1.2.1.1.3.0=12689 .1.3.6.1.6.3.1.1.4.1.0=.1.3.6.1.4.1.2000.1 .1.3.6.1.2.1.1.0.0.7.1="11/3/2016, 9:15:13 AM" .1.3.6.1.2.1.1.0.0.7.2="CriticalSymptom" .1.3.6.1.2.1.1.0.0.7.3="url1" .1.3.6.1.2.1.1.0.0.7.4="CRM_ApplicationService" .1.3.6.1.2.1.1.0.0.7.5="SoftwareService" .1.3.6.1.2.1.1.0.0.7.6="default" .1.3.6.1.2.1.1.0.0.7.7="/var/log/NodeJsTest" .1.3.6.1.2.1.1.0.0.7.8="playVideo('url1') BREAK playVideo('url2') BREAK playVideo('url3')"

