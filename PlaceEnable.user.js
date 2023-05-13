// ==UserScript==
// @name        PlaceEnable
// @description Enables r/place on the reddit desktop client early.
// @version     1.0
// @include     https://www.reddit.com/*
// @include     https://new.reddit.com/*
// @include     https://reddit.com/*
// @author      Mikarific
// @icon        https://garlic-bread.reddit.com/static/assets/img/place-logo.svg
// @run-at      document-start
// @updateURL   https://raw.githubusercontent.com/Mikarific/PlaceProxy/main/PlaceEnable.user.js
// @downloadURL	https://raw.githubusercontent.com/Mikarific/PlaceProxy/main/PlaceEnable.user.js
// ==/UserScript==

let patched = false;
let webpackObj;
const originalDefineProperty = Object.defineProperty;
Object.defineProperty = function(...args) {
	args[2].configurable = true;
	try {
		return originalDefineProperty.apply(this, args);
	} catch {
		return;
	}
};
Object.defineProperty(window, '__LOADABLE_LOADED_CHUNKS__', {
	get() {
		return webpackObj;
	},
	set(windowVal) {
		webpackObj = new Proxy(windowVal, {
			get(obj, prop) {
				return obj[prop];
			},
			set(obj, prop, webpackVal) {
				obj[prop] = webpackVal;
				if (prop === 'push' && !patched) {
					patched = true;

					let wpRequire;
					window.__LOADABLE_LOADED_CHUNKS__.push([[Symbol()], { get: (_m, _, wpRq) => (wpRequire = wpRq) }, [['get']]]);
					const garlicBread = wpRequire.c['./src/reddit/selectors/experiments/garlicBread.ts'];

					const patch = (func, value) => {
						Reflect.defineProperty(garlicBread.exports, func, {
							value: new Proxy(garlicBread.exports[func], {
								apply: () => value,
							}),
							configurable: true,
							writable: true,
						});
					};

					patch('a', true);
					patch('b', 'place');
					patch('c', window.location.pathname === '/r/place/');
				}
				return true;
			},
		});
	},
});
