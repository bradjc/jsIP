
jsIP
====

A class for parsing and formatting IPv4 and IPv6 addresses in javascript.

With node.js
------------

````
jsIP = require('jsIP');

ip = jsIP('192.168.1.1');

ip.str();
````


With a Browser
--------------

````
<script src="jsIP-x.x.x.js"></script>
<script>
	var jsIP = require('./jsIP');

	jsIP('7654::6712:98:1').str();
````

API
---
````
str()
fullStr()
pureStr()
hex()


