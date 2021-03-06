const prettyBytes = require("pretty-bytes");
const shortHash = require("short-hash");
const lodash = require("lodash");

function showDigits(num, digits = 2, alwaysShowDigits = true) {
	let toNum = parseFloat(num);
	if(!alwaysShowDigits && toNum === Math.floor(toNum)) {
		// if a whole number like 0, just show 0 and not 0.00
		return toNum;
	}
	return toNum.toFixed(digits);
}

module.exports = function(eleventyConfig) {
	eleventyConfig.addFilter("shortHash", function(value) {
		return shortHash(value);
	});

	eleventyConfig.addFilter("repeat", function(str, times) {
		let result = '';

		for (let i = 0; i < times; i++) {
			result += str;
		}

		return result;
	});

	eleventyConfig.addFilter("head", function(arr, num) {
		if(num) {
			return arr.slice(0, num);
		}
		return arr;
	});

	eleventyConfig.addFilter("headAndLast", function(arr, num) {
		if(num && num < arr.length) {
			let newArr = arr.slice(0, num);
			newArr.push(arr[arr.length - 1]);
			return newArr;
		}
		return arr;
	});

	eleventyConfig.addFilter("displayUrl", function(url) {
		url = url.replace("https://www.", "");
		url = url.replace("https://", "");
		return url;
	});

	eleventyConfig.addFilter("showDigits", function(num, digits) {
		return showDigits(num, digits, false);
	});

	eleventyConfig.addFilter("displayTime", function(time) {
		let num = parseFloat(time);
		if(num > 1000) {
			return `${showDigits(num / 1000, 2)}s`;
		}
		return `${showDigits(num, 0)}ms`;
	});

	eleventyConfig.addFilter("displayFilesize", function(size) {
		return prettyBytes(size);
	});

	function pad(num) {
		return (num < 10 ? "0" : "") + num;
	}
	eleventyConfig.addFilter("displayDate", function(timestamp) {
		let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
		let date = new Date(timestamp);
		let day = `${months[date.getMonth()]} ${pad(date.getDate())}`;
		return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
	});

	function mapProp(prop, targetObj) {
		if(Array.isArray(prop)) {
			prop =  prop.map(entry => {
				if(entry === ":lastkey") {
					let ret;
					for(let key in targetObj) {
						ret = key;
					}
					return ret;
				}

				return entry;
			});
		}

		return prop;
	}

	// Works with arrays too
	// Sort an object that has `order` props in values.
	// If prop is not passed in, sorts by object keys
	// Returns an array
	eleventyConfig.addFilter("sort", (obj, prop = "___key") => {
		let arr;
		let defaultKey = "___key";
		if(Array.isArray(obj)) {
			arr = obj;
		} else {
			arr = [];

			for(let key in obj) {
				if(prop === defaultKey) {
					obj[key][defaultKey] = key;
				}
				arr.push(obj[key]);
			}
		}

		let sorted = arr.sort((a, b) => {
			let aVal = lodash.get(a, mapProp(prop, a));
			let bVal = lodash.get(b, mapProp(prop, b));
			if(aVal > bVal) {
				return -1;
			}
			if(aVal < bVal) {
				return 1;
			}
			return 0;
		});

		if(!Array.isArray(obj)) {
			if(prop === defaultKey) {
				for(let entry of sorted) {
					delete entry[defaultKey];
				}
			}
		}

		return sorted;
	});

	eleventyConfig.addFilter("getObjectKey", (obj, which = ":first") => {
		let ret;
		let newestTimestamp = 0;
		for(let key in obj) {
			ret = key;
			if(which === ":newest") {
				if(obj[key].timestamp > newestTimestamp) {
					newestTimestamp = obj[key].timestamp;
					ret = key;
				}
			}
			if(which === ":first") {
				return ret;
			}
		}
		return ret;
	});

	eleventyConfig.addFilter("filterToUrls", (obj, urls = []) => {
		let arr = [];
		for(let key in obj) {
			let result;
			for(let filename in obj[key]) {
				result = obj[key][filename];
				break;
			}
			if(urls.indexOf(result.requestedUrl) > -1) {
				arr.push(obj[key]);
			}
		}
		return arr;
	});

	eleventyConfig.addFilter("hundoCount", (entry) => {
		let count = 0;
		if(entry.lighthouse.performance === 1) {
			count++;
		}
		if(entry.lighthouse.accessibility === 1) {
			count++;
		}
		if(entry.lighthouse.bestPractices === 1) {
			count++;
		}
		if(entry.lighthouse.seo === 1) {
			count++;
		}

		return count;
	});

	eleventyConfig.addFilter("lighthouseTotal", (entry) => {
		let total = 0;
		total += entry.lighthouse.performance;
		total += entry.lighthouse.accessibility;
		total += entry.lighthouse.bestPractices;
		total += entry.lighthouse.seo;
		return Math.round(total * 100);
	});

	eleventyConfig.addPassthroughCopy({
		"./node_modules/chartist/dist/chartist.css": "chartist.css",
		"./node_modules/chartist/dist/chartist.js": "chartist.js",
	});
	eleventyConfig.addPassthroughCopy("chart.js");
	eleventyConfig.addTemplateFormats("css");
};
