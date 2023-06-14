const fs = require('fs');
const path = require('path');
const { createAppHttpHandler, PPServerProxy, PPPassThroughHttpHandler } = require('pms-proxy');

const caPage = fs.readFileSync('ca.html');
const notFoundPage = fs.readFileSync('404.html');
const canvas = fs.readFileSync('canvas.html');

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
	if (req.body?.variables?.eventKey === 'place_XZ') {
		return { data: JSON.stringify({
			data: {
				navBarEventCommunityPicker: {
					title: 'r/place communities',
					subtitle: 'Check out some of the communities participating this year',
					icon: {
						url: 'https://i.redd.it/qwqv2vzjbp1b1.png',
					},
					communities: [
						{
							description: null,
							icon: null,
							name: null,
							subreddit: {
								detectedLanguage: 'en',
								id: 't5_8ifl0y',
								isSubscribed: false,
								path: '/r/Save3rdPartyApps/',
								prefixedName: 'r/Save3rdPartyApps',
								publicDescriptionText: 'Reddit\'s recent changes to API pricing threaten to destroy user access to a huge variety of quality-of-life features exclusive to apps like Apollo, Narwhal and Reddit is Fun. We\'re here to stop it.',
								styles: {
									icon: 'https://styles.redditmedia.com/t5_8ifl0y/styles/communityIcon_m5cieh5vqf4b1.jpg',
									legacyIcon: null,
									legacyPrimaryColor: null,
									primaryColor: '#BD5D4F',
								},
							},
						},
						{
							description: null,
							icon: null,
							name: null,
							subreddit: {
								detectedLanguage: 'en',
								id: 't5_63awgf',
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
						},
						{
							description: null,
							icon: null,
							name: null,
							subreddit: {
								detectedLanguage: 'en',
								id: 't5_3ju2f',
								isSubscribed: false,
								path: '/r/osuplace/',
								prefixedName: 'r/osuplace',
								publicDescriptionText: 'The official subreddit of the osu! faction on /r/place!\n\n***\n\n**WE DO NOT USE AUTOMATION**\n\n**WE HAVE NEVER USED IT**\n\n**YOU WILL BE BANNED IF YOU USE BOTS**\n\nWe take pride in legitimately placing every single pixel!\n\nJoin us on [**Discord**](https://discord.gg/NdMsJfCjkN)!\n\n***',
								styles: {
									icon: null,
									legacyIcon: null,
									legacyPrimaryColor: null,
									primaryColor: null,
								},
							},
						},
						{
							description: null,
							icon: null,
							name: null,
							subreddit: {
								detectedLanguage: 'en',
								id: 't5_3deum',
								isSubscribed: false,
								path: '/r/AprilKnights/',
								prefixedName: 'r/AprilKnights',
								publicDescriptionText: '"Ever vigilant, armed with patience and necromancy, the knights stand by."',
								styles: {
									icon: 'https://styles.redditmedia.com/t5_3deum/styles/communityIcon_ltxfnwrbeta81.png',
									legacyIcon: null,
									legacyPrimaryColor: null,
									primaryColor: null,
								},
							},
						},
						{
							description: null,
							icon: null,
							name: null,
							subreddit: {
								detectedLanguage: 'en',
								id: 't5_3jsax',
								isSubscribed: false,
								path: '/r/TheBlueCorner/',
								prefixedName: 'r/TheBlueCorner',
								publicDescriptionText: 'The glorious Blue Corner shall rise again. Join us as we await the return of Reddit\'s April Fool\'s Event this year.',
								styles: {
									icon: 'https://styles.redditmedia.com/t5_3jsax/styles/communityIcon_bpyvma146bra1.png',
									legacyIcon: null,
									legacyPrimaryColor: null,
									primaryColor: null,
								},
							},
						},
					],
				},
			},
		}) };
	}
	return { data: JSON.stringify(data) };
});
server.addRule()
	.host((host) => host === 'gql.reddit.com')
	.then(gql);

// Replace Canvas
const garlicBread = createAppHttpHandler();
garlicBread.get('/embed', (req, res) => {
	res.status(200).send(canvas.toString());
});
server.addRule()
	.host((host) => host.endsWith('garlic-bread.reddit.com'))
	.then(garlicBread);

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

	// Return with subreddit coordinates
	if (req.body.query.includes('r/replace:get_subreddits_coordinates') || req.body.query.includes('r\\/replace:get_subreddits_coordinates')) {
		const subredditIDs = req.body.variables.subredditIDs ? req.body.variables.subredditIDs : req.body.variables.subredditIds;
		if (subredditIDs.includes('t5_8ifl0y')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_8ifl0y', coordinates: { x: 500, y: 500, z: 1 } }] } }] } }, errors: [] }) };
		if (subredditIDs.includes('t5_63awgf')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_63awgf', coordinates: { x: 727, y: 614, z: 1 } }] } }] } }, errors: [] }) };
		if (subredditIDs.includes('t5_3ju2f')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_3ju2f', coordinates: { x: 727, y: 727, z: 1 } }] } }] } }, errors: [] }) };
		if (subredditIDs.includes('t5_3deum')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_3deum', coordinates: { x: 690, y: 733, z: 1 } }] } }] } }, errors: [] }) };
		if (subredditIDs.includes('t5_3jsax')) return { data: JSON.stringify({ data: { act: { data: [{ data: { subredditsCoordinates: [{ subredditID: 't5_3jsax', coordinates: { x: 999, y: 999, z: 1 } }] } }] } }, errors: [] }) };
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

server.listen(61423).then(() => {
	console.log('Proxy is listening on port 61423!');
});
