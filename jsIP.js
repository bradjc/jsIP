
var parseIPv4 = function (addr) {
	bytes = addr.split('.');
	if (bytes.length > 4) throw "IPv4 address too long";
	filler = [];
	for (i=0; i<8; i++) { filler.push(0); }
	bytes = new Array().concat(filler.slice(0, (4 - bytes.length)), bytes);

	for (i in bytes) {
		bytes[i] = parseInt(bytes[i]);
	}

	return bytes;
}


IP = function (addr, version) {
//exports.IP = function (addr, version) {

//	if (version == "undefined") {
//		version = 0;
//	}


	// represent IP address as 8 16 bit ints (which are floats in reality)
	var ip = [];
	for (i=0; i<8; i++) { ip.push(0); }

	if (typeof(addr) == 'string') {

		if (addr.substring(0, 2) == '0x') {
			// Hex value as string
			var rest = addr.substring(2);
			for (i=0; i<Math.min(rest.length, 8); i+=4) {
				end = rest.length-i;
				start = Math.max(rest.length-4-i, 0);
				substr = rest.substring(start, end);
				ip[7-(i/4)] = parseInt(substr, 16);
			}

		} else if (addr.indexOf(':') > -1) {
			// IPv6 address
			var index = 0
			var fill_pos
			var items = []

			while (index < addr.length) {
				text = addr.substring(index);
				if (text.substring(0, 2) == '::') {
					if (fill_pos != undefined) {
						//error
						console.log('err');
					}
					fill_pos = items.length;
					index += 2;
					continue;
				}
				pos = text.indexOf(':');
				if (pos == 0) {
					console.log('err 2');
				}
				if (pos != -1) {
					items.push(text.substring(0, pos));
					if (text.substring(pos, pos+2) == '::') {
						index += pos;
					} else {
						index += pos+1;
					}

					if (index == addr.length) {
						console.log('err 3');
					}
				} else {
					items.push(text);
					break
				}
			}
			console.log(items);

			if (items.length > 0 && items[items.length-1].indexOf('.') > -1) {
				// IPv4 address
				if (fill_pos != undefined && !(fill_pos <= items.length-1)) {
					console.log('err 4');
				}
				// FINISH PARSING IPV4 address
				console.log('ipv4: ' + items);
				ipv4 = parseIPv4(items[items.length-1])
				items = new Array().concat(items.slice(0,items.length-1),
				                           [((ipv4[0]<<8) + ipv4[1]).toString(16)],
				                           [((ipv4[2]<<8) + ipv4[3]).toString(16)]);
			}

			if (fill_pos != undefined) {
				diff = 8 - items.length;
				if (diff <= 0) {
					console.log('err 5');
				}
				filler = [];
				for (i=0; i<8; i++) { filler.push(0); }
				items = new Array().concat(items.slice(0, fill_pos),
				                           filler.slice(0, diff),
				                           items.slice(fill_pos, items.length));
				console.log('this items');
				console.log(items);


			}

			if (items.length != 8) {
				console.log('err 6');
			}

			for (i in items) {
				items[i] = parseInt(items[i], 16);
			}
			ip = items;

			console.log(items);
		}

	}
	console.log('ip: ' + ip);

}

IP('0xfffabcde');
IP('::ffff:8a:9c');
IP('67::ffff:8a:9c');
IP('::ffff:192.168.1.1');


