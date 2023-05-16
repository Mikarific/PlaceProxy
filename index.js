const fs = require('fs');
const path = require('path');
const { createAppHttpHandler, PPServerProxy, PPPassThroughHttpHandler } = require('pms-proxy');

const caPage = fs.readFileSync('ca.html');
const notFoundPage = fs.readFileSync('404.html');

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

const gql = new PPPassThroughHttpHandler();
gql.injectBuffer((req, buffer) => {
	const data = JSON.parse(buffer);
	// Enable r/place
	if (data.data && data.data.experimentVariants) {
		data.data.experimentVariants.unshift({ 'id':'9999', 'name':'place', 'experimentName':'ios_baked_potato', 'version':'1' });
		data.data.experimentVariants.unshift({ 'id':'9999', 'name':'place', 'experimentName':'android_baked_potato', 'version':'1' });
	}

	// Add r/PlacePride to the "Explore communities" tab.
	if (data.data && data.data.navBarEventCommunityPicker) {
		data.data.navBarEventCommunityPicker.communities.unshift({
			description: null,
			icon: null,
			name: null,
			subreddit: {
				detectedLanguage: 'en',
				id: 't2_dakg11x',
				isSubscribed: false,
				path: '/r/PlacePride/',
				prefixedName: 'r/PlacePride',
				publicDescriptionText: 'Welcome to r/PlacePride! Our discord server can be found at https://discord.gg/MUMhGkK4un. We\'re an r/place faction dedicated to making pride related artwork on the canvas!',
				styles: {
					icon: 'https://styles.redditmedia.com/t5_63awgf/styles/communityIcon_auvdy43krvq81.png',
					legacyIcon: null,
					legacyPrimaryColor: null,
					primaryColor: '#F7A8B8',
				},
			},
		});
	}
	return { data: JSON.stringify(data) };
});
server.addRule()
	.host((host) => host === 'gql.reddit.com')
	.then(gql);

// Enable cooldown and pinned canvas location
const realtimeGQL2 = new PPPassThroughHttpHandler();
realtimeGQL2.injectBuffer((req, buffer) => {
	const urlPath = req.baseUrl + req.path;
	if (urlPath !== '/query') return { data: buffer.toString() };
	// Set cooldown for r/place icon
	if (req.body.query.includes('r/replace:get_user_cooldown') || req.body.query.includes('r\\/replace:get_user_cooldown')) {
		const userAgent = req.headers['user-agent'];
		if (userAgent.includes('2023.12.0') || userAgent.includes('2023.13.0')) return { data: JSON.stringify({ data: { act: { data: [{ __typename: 'GetUserCooldownResponseMessageData', data: { nextAvailablePixelTimestamp: 300 } }] } }, errors: [] }) };
		return { data: JSON.stringify({ data: { act: { data: [{ __typename: 'GetUserCooldownResponseMessageData', data: { nextAvailablePixelTimestamp: new Date().getTime() + 300 * 1000 } }] } }, errors: [] }) };
	}

	// Return with r/PlacePride's coordinates
	if (req.body.query.includes('r/replace:get_subreddits_coordinates') || req.body.query.includes('r\\/replace:get_subreddits_coordinates')) {
		const subredditIDs = req.body.variables.subredditIDs ? req.body.variables.subredditIDs : req.body.variables.subredditIds;
		if (subredditIDs.includes('t5_63awgf')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_63awgf', coordinates: { x: 702, y: 614, z: 1 } }] } }] } }, errors: [] }) };
	}
	return { data: buffer.toString() };
});
server.addRule()
	.host((host) => host === 'gql-realtime-2.reddit.com')
	.then(realtimeGQL2);

const notFound = createAppHttpHandler();
notFound.get('/', (req, res) => {
	res.status(404).send(notFoundPage.toString());
});
server.addRule()
	.host((host) => !host.endsWith('redd.it') && !host.endsWith('redditstatic.com') && !host.endsWith('reddit.com') && !host.endsWith('redditmedia.com') && !host.endsWith('snooguts.net') && !host.endsWith('mitm.it'))
	.then(notFound);

server.listen(8080).then(() => {
	console.log('Proxy is listening on port 8080!');
});
