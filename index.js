const fs = require('fs');
const path = require('path');
const { createAppHttpHandler, PPServerProxy, PPPassThroughHttpHandler } = require('pms-proxy');

const caPage = fs.readFileSync('ca.html');

const server = new PPServerProxy({
	https: {
		certPath: path.join(__dirname, './certs/ca.pem'),
		keyPath: path.join(__dirname, './certs/ca.key'),
	},
});

// Serve Certificates
const ca = createAppHttpHandler();
ca.get('/', (req, res) => {
	res.status(200).send(caPage.toString());
});
ca.get('/cert/pem', (req, res) => {
	res.status(200).sendFile(path.join(__dirname, './certs/ca.pem'));
});
ca.get('/cert/cer', (req, res) => {
	res.status(200).sendFile(path.join(__dirname, './certs/ca.cer'));
});
ca.get('/cert/p12', (req, res) => {
	res.status(200).sendFile(path.join(__dirname, './certs/ca.p12'));
});
server.addRule()
	.host((host) => host.endsWith('mitm.it'))
	.then(ca);

// Enable r/place
const place = new PPPassThroughHttpHandler();
place.injectBuffer((req, buffer) => {
	const data = JSON.parse(buffer);
	if (data.data === null || data.data === undefined) return { data: JSON.stringify(data) };
	if (data.data.experimentVariants === null || data.data.experimentVariants === undefined) return { data: JSON.stringify(data) };
	data.data.experimentVariants.push({ 'id':'9999', 'name':'place', 'experimentName':'ios_baked_potato', 'version':'1' });
	data.data.experimentVariants.push({ 'id':'9999', 'name':'place', 'experimentName':'android_baked_potato', 'version':'1' });
	return { data: JSON.stringify(data) };
});
server.addRule()
	.host((host) => host === 'gql.reddit.com')
	.then(place);

// Enable cooldown and pinned canvas location
const cooldownAndPin = new PPPassThroughHttpHandler();
cooldownAndPin.injectBuffer((req, buffer) => {
	const urlPath = req.baseUrl + req.path;
	if (urlPath !== '/query') return { data: buffer.toString() };
	if (req.body.query.includes('r/replace:get_user_cooldown') || req.body.query.includes('r\\/replace:get_user_cooldown')) {
		const userAgent = req.headers['user-agent'];
		if (userAgent.includes('2023.12.0') || userAgent.includes('2023.13.0')) return { data: JSON.stringify({ data: { act: { data: [{ __typename: 'GetUserCooldownResponseMessageData', data: { nextAvailablePixelTimestamp: 300 } }] } }, errors: [] }) };
		return { data: JSON.stringify({ data: { act: { data: [{ __typename: 'GetUserCooldownResponseMessageData', data: { nextAvailablePixelTimestamp: new Date().getTime() + 300 * 1000 } }] } }, errors: [] }) };
	}
	if (req.body.query.includes('r/replace:get_subreddits_coordinates') || req.body.query.includes('r\\/replace:get_subreddits_coordinates')) {
		const subredditIDs = req.body.variables.subredditIDs ? req.body.variables.subredditIDs : req.body.variables.subredditIds;
		if (subredditIDs.includes('t5_63awgf')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_63awgf', coordinates: { x: 702, y: 614, z: 1 } }] } }] } }, errors: [] }) };
	}
	return { data: buffer.toString() };
});
server.addRule()
	.host((host) => host === 'gql-realtime-2.reddit.com')
	.then(cooldownAndPin);

server.listen(8080).then(() => {
	console.log('Proxy is listening on port 8080!');
});
