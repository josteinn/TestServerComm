
const crypto = require("crypto");
const secret = "dronningmaudsland"; //must be stored in an env. variable in the finished app

let utils = {};

// ---------------------------------------------
utils.decodeCred = function (credString) {

	let cred = {};

	try {

		let b64String = credString.replace("basic ", ""); // 'am9zdGVpbm46a29uZ29sYXY='	
		let asciiString = Buffer.from(b64String, "base64").toString("ascii"); // 'josteinn:kongolav'	
		cred.username = asciiString.replace(/:.*/, ""); //josteinn	
		cred.password = asciiString.replace(cred.username + ":", ""); //kongolav
		return cred;

	} catch (error) {
		return false;
	}


}

// ---------------------------------------------
utils.createHash = function (password) {

	let hash = {};

	hash.salt = Math.random().toString();
	hash.value = crypto.scryptSync(password, hash.salt, 64).toString("hex");

	return hash;
}

// ---------------------------------------------
utils.verifyPassword = function (pswFromUser, hashFromDB, saltFromDB) {

	hash = crypto.scryptSync(pswFromUser, saltFromDB, 64).toString("hex");

	if (hash == hashFromDB) {
		return true;
	}

	return false;
}

// ---------------------------------------------
utils.createToken = function (username, userID) {

	let part1 = JSON.stringify({ "alg": "HS256", "typ": "JWT" });
	let part2 = JSON.stringify({ "user": username, "userid": userID, "iat": Date.now() });

	let b64Part1 = Buffer.from(part1).toString("base64");
	let b64Part2 = Buffer.from(part2).toString("base64");

	let openPart = b64Part1 + "." + b64Part2;

	let sign = crypto.createHmac("SHA256", secret).update(openPart).digest("base64");

	return openPart + "." + sign;
}

// ---------------------------------------------
utils.verifyToken = function (token) {

	let tokenArr = token.split(".");
	let openPart = tokenArr[0] + "." + tokenArr[1];
	let signToCheck = tokenArr[2];

	let sign = crypto.createHmac("SHA256", secret).update(openPart).digest("base64");

	if (signToCheck != sign) {
		//signature not ok
		return false;
	}

	let payloadTxt = Buffer.from(tokenArr[1], "base64").toString("ascii");
	let payload = JSON.parse(payloadTxt);

	let expireTime = payload.iat + 24 * 60 * 60 * 1000; //time in millisec.
	if (expireTime < Date.now()) {
		//the token has expired
		return false;
	}

	//token ok
	return payload;
}

// ---------------------------------------------
module.exports = utils;


