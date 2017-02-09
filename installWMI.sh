#!/bin/bash

# compiles WMIC for linux
# test using :
# wmic --user ./\administrator%P@ssw0rd //10.10.10.9 "SELECT * from Win32_NTLogEvent Where Logfile = 'System' AND (TimeGenerated >= '01/23/2017 11:52:08' AND TimeGenerated <= '01/23/2017 11:52:10')
#apt-get install autoconf
yum install -y autoconf wget bzip2 tar make gcc

cd /usr/src
wget http://www.openvas.org/download/wmi/wmi-1.3.14.tar.bz2
bzip2 -cd wmi-1.3.14.tar.bz2 | tar xf -
cd wmi-1.3.14/
make "CPP=gcc -E -ffreestanding"
cp Samba/source/bin/wmic /usr/local/bin

exit 0
