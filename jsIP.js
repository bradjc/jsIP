var compactIPv4 = function (bytes) {
	return [(bytes[0]<<8) + bytes[1], (bytes[2]<<8) + bytes[3]];
}

var parseIPv4 = function (addr_str) {
	bytes = addr_str.split('.');
	if (bytes.length > 4) throw "IPv4 address too long";
	filler = [];
	for (i=0; i<8; i++) { filler.push(0); }
	bytes = new Array().concat(filler.slice(0, (4 - bytes.length)), bytes);
	for (i in bytes) {
		bytes[i] = parseInt(bytes[i]);
		if (bytes[i] > 255) throw 'IPv4 Error: section too large';
	}
	return bytes;
}

var parseIPv6 = function (addr_str) {
	// IPv6 address
	var index    = 0
	var items    = []
	var fill_pos = undefined

	while (index < addr_str.length) {
		text = addr_str.substring(index);
		if (text.substring(0, 2) == '::') {
			if (fill_pos != undefined) throw "IPv6 Error: can't have two '::'";
			fill_pos = items.length;
			index    += 2;
			continue;
		}
		pos = text.indexOf(':');
		if (pos == 0) throw "IPv6 Error: missing ':'";
		if (pos != -1) {
			items.push(text.substring(0, pos));
			if (text.substring(pos, pos+2) == '::') {
				index += pos;
			} else {
				index += pos+1;
			}

			if (index == addr_str.length) throw "IPv6 Error: Invalid";
		} else {
			items.push(text);
			break
		}
	}

	if (items.length > 0 && items[items.length-1].indexOf('.') > -1) {
		// IPv4 address
		if (fill_pos != undefined && !(fill_pos <= items.length-1)) {
			throw "IPv6 Error: invalid IPv4 representation";
		}
		ipv4  = parseIPv4(items[items.length-1])
		items = new Array().concat(items.slice(0,items.length-1),
		                           [((ipv4[0]<<8) + ipv4[1]).toString(16)],
		                           [((ipv4[2]<<8) + ipv4[3]).toString(16)]);
	}

	if (fill_pos != undefined) {
		diff = 8 - items.length;
		if (diff <= 0) throw "IPv6 Error: found '::' but no sections skipped";
		filler = [];
		for (i=0; i<8; i++) { filler.push(0); }
		items = new Array().concat(items.slice(0, fill_pos),
		                           filler.slice(0, diff),
		                           items.slice(fill_pos, items.length));
	}

	if (items.length != 8) throw "IPv6 Error: too short";

	for (i in items) {
		items[i] = parseInt(items[i], 16);
	}

	return items;
}

var printIPv4_helper = function (ip) {
	bytes = []
	bytes.push(ip[6]>>8);
	bytes.push(ip[6]&0xff);
	bytes.push(ip[7]>>8);
	bytes.push(ip[7]&0xff);
	return bytes;
}

var printIPv4 = function (ip) {
	return printIPv4_helper(ip).join('.');
}

var printFullIPv4 = function (ip) {
	bytes = printIPv4_helper(ip);
	out   = [];
	for (b in bytes) {
		val = bytes[b].toString();
		while (val.length < 3) {
			val = '0' + val;
		}
		out.push(val);
	}
	return out.join('.');
}

var printFullIPv6 = function (ip) {
	out = []
	for (i in ip) {
		val = ip[i].toString(16);
		while (val.length < 4) {
			val = '0' + val;
		}
		out.push(val);
	}
	return out.join(':');
}

var printNormalIPv6 = function (ip) {
	out = []
	for (i in ip) {
		out.push(ip[i].toString(16));
	}
	return out.join(':');
}

var printCompressedIPv6 = function (ip, start, skip) {
	out = []
	end = start + skip;
	for (i in ip) {
		if (i < start || i >= end) {
			out.push(ip[i].toString(16));
		} else if (i == start) {
			out.push(':');
		}
	}
	return out.join(':').replace(':::', '::');
}


IP = function (addr, version) {
	if (!(this instanceof IP)) return new IP(addr, version);

	var self = this;

	if (version == "undefined") {
		self.version = 0;
	}


	// represent IP address as 8 16 bit ints (which are floats in reality)
	self.ip = [];
	for (i=0; i<8; i++) { self.ip.push(0); }

	if (typeof(addr) == 'string') {

		if (addr.substring(0, 2) == '0x') {
			// Hex value as string
			var rest = addr.substring(2);
			for (i=0; i<Math.min(rest.length, 32); i+=4) {
				end = rest.length-i;
				start = Math.max(rest.length-4-i, 0);
				substr = rest.substring(start, end);
				self.ip[7-(i/4)] = parseInt(substr, 16);
			}
			self.version = 6;

		} else if (addr.indexOf(':') > -1) {
			self.ip = parseIPv6(addr);
			self.version = 6;
		} else if (addr.indexOf('.') > -1) {
			v4 = compactIPv4(parseIPv4(addr));
			self.ip[6] = v4[0];
			self.ip[7] = v4[1];
			self.version = 4;
		}

	}

	self.str = function () {
		if (self.version == 4) {
			return printIPv4(self.ip);

		} else if (self.version == 6) {

			if (self.ip[0] == 0 &&
			    self.ip[1] == 0 &&
			    self.ip[2] == 0 &&
			    self.ip[3] == 0 &&
			    self.ip[4] == 0 &&
			    self.ip[5] == 0xffff) {
				// ipv4 address as ipv6 address
				return "::ffff:" + printIPv4(self.ip);

			} else {
				long_run       = 0;
				long_run_start = -1;
				run            = 0;
				run_start      = -1;
				for (i=0; i<9; i++) {
					if (i<8 && self.ip[i] == 0) {
						run++;
						if (run_start == -1) {
							run_start = i;
						}
					} else {
						if (run > long_run) {
							long_run       = run;
							long_run_start = run_start;
						}
						run       = 0;
						run_start = -1;
					}
				}
				return printCompressedIPv6(self.ip, long_run_start, long_run);

			}


		}
	}

	self.fullStr = function () {
		if (self.version == 4) {
			return printFullIPv4(self.ip);

		} else if (self.version == 6) {
			if (self.ip[0] == 0 &&
			    self.ip[1] == 0 &&
			    self.ip[2] == 0 &&
			    self.ip[3] == 0 &&
			    self.ip[4] == 0 &&
			    self.ip[5] == 0xffff) {
				// ipv4 address as ipv6 address
				return "0000:0000:0000:0000:0000:ffff:" + printFullIPv4(self.ip);

			} else {
				return printFullIPv6(self.ip);

			}
		}
	}

}

module.exports = IP;

/*
console.log(IP('67::ffff:8a:9c').str());
console.log(IP('67:ffff:8a:9c::5').str());
console.log(IP('0xffff8dd46ef5').str());
console.log(IP('::ffff:192.168.1.1').str());
console.log(IP('192.255.9.10').str());

console.log(IP('67::ffff:8a:9c').fullStr());
console.log(IP('67:ffff:8a:9c::5').fullStr());
console.log(IP('0xffff8dd46ef5').fullStr());
console.log(IP('::ffff:192.168.1.1').fullStr());
console.log(IP('192.255.9.10').fullStr());

*/
