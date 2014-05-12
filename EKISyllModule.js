
EKIToolkit.prototype.modules.Hyphenate = function(EKI, config) {
	/**
	 * This is the Hyphenate factory
	 */
	"use strict";
	
	// See on moodul, lisame talle üldisi mooduli võimeid (init, destroy, notify)
	EKI.modules.addGenericModuleParts(EKI.modules.Hyphenate);
	
	/* observerList contains callbacks to launch after analysis */
	//~ var observerList = [],
		/* holds the set of morphologically analyzed tokens */
	var tokenStorage = {},
		/* holds up to JSONBatchsize tokens to be sent to analysis */
		analyzeBatch = [],
		/* holds tokens sent, but whose analysis hasn't been registered yet */
		tokensWaitingForAnalysis = [],
		/* holds the config */
		config = config || {
			'action':					'silbitus',
			'JSONBatchsize':	100,
			'JSONRetries':		3
		};
	
	/* *************************************************************** */
	
	function addToken(token) {
		/**
		 * Adds the token to be analyzed
		 * returns true if token was added
		 * returns false if token was '' or allready present
		 */
		"use strict";
		
		/* kuna EKI morfoloogia analüüsija sisendiks on ainult eesti tähed,
		 * koristame kõik ülejäänud ära */
		var token = cleanToken(token);

		if ((token == '') || // don't accept empty tokens, nor
			  (token in tokenStorage) || // tokens allready analyzed, nor
			  (analyzeBatch.indexOf(token) != -1) || // tokens allready in the batch, nor
			  (tokensWaitingForAnalysis.indexOf(token) != -1)) { // tokens waiting for analysis
					return false;
		}
		// analyzeBatch automatiseerib analüüsimise kindlate portsude kaupa
		analyzeBatch.push(token);
		// kui ports on täis, saadetakse see serverile analüüsimiseks
		if (analyzeBatch.length >= config.JSONBatchsize) {
			analyze();
		}
		return true;
	}
	
	
	function cleanToken(token) {
		/**
		 * for now simply remove all non-estonian characters and make it
		 * lowercased.
		 */
		"use strict";
		
		var token = token || '';
		var nonChars = /[^abcdefghijklmnopqrsšzžtuvwõäöüxy]/ig;
		
		token = token.replace(nonChars, '');
		token = token.trim().toLocaleLowerCase();
		return token;
	}
	
	
	function analyze() {
		/** Sends all unanalyzed tokens to the server to be analyzed.
		 * Analysis is done using the current config
		 */
		"use strict";
		
		// see if we need to analyze anything
		if (analyzeBatch.length > 0) {
			tokensWaitingForAnalysis = tokensWaitingForAnalysis.concat(analyzeBatch);
			EKIMorfservJSONRequest(analyzeBatch);
			analyzeBatch = [];
		} else {
			// otherwise just notify the subscribed observers directly
			EKI.notify({type: "hyphenate-analysis-ALLREADY-ready"});
		}
	}
	
	
	function onJSONReplySUCCESS(data, textStatus, jqXHR) {
		/** This function is called on a positive reply from the server. It
		 * adds the analysises to the tokenStorage and notifies all 
		 * observers.
		 */
		"use strict";
		 
		// extend tokenStorage @todo: remove jQuery
		jQuery.extend(tokenStorage, data); // @todo: should be able for in loop
	
		// remove all the tokens that have been successfully analyzed from
		// the tokensWaitingForAnalysis
		tokensWaitingForAnalysis = tokensWaitingForAnalysis.filter(
			function (token) {
				return !(token in tokenStorage);
			});
		
		// @todo: notifyObservers only if the tokenStorage changed it's state
		//~ notifyObservers();
		EKI.notify({type: "hyphenate-analysis-ready"});
	}
	
	
	function onJSONReplyERROR(jqXHR, textStatus, ex) {
		/** This function is called on a negative reply from the serve. It
		 * tries 3 times to re-analyze before giving up.
		 * @todo: NOT IMPLEMENTED!
		 */
		"use strict";
		
		// @todo: should we try re-analyze only previously sent tokens, or
		//        all un-analyzed tokens?
		//        is it possible to get the sent batch from this JSON?
		//~ console.log(textStatus + "," + ex + "," + jqXHR.responseText);
		console.log('EKIToolkit: JSON ERROR ' + textStatus);
	}
	
	
	function emptyTokenStorage() {
		/**
		 * Simply empties the tokenStorage
		 */
		"use strict";
		
		tokenStorage = {};
	}
	
	
	function getTokenStorage() {
		/**
		 * Returns the tokenStorage
		 */
		"use strict";
		
		return tokenStorage;
	}
	
	
	function getTokenAnalysis (token) {
		/**
		 * Returns the analysis data from tokenStorage or undefined.
		 */
		var ret;
		if (token in tokenStorage) {
			return tokenStorage[token];
		} else {
			return undefined;
		}
	}
	
	
	function EKIMorfservJSONRequest(tokens) {
		/**
		 * HIDDEN simple approach to Elgar's service
		 */
		"use strict";
		
		config['sone'] = tokens;
		
		jQuery.ajax({
			type: "POST",
			async: true,
			url: 'http://artur.eki.ee/morfserv/DataService.ashx',
			contentType: 'application/json; charset=utf-8',
			dataType: "json",
			data: JSON.stringify(config),
			timeout: 2000,
			success: onJSONReplySUCCESS,
			error: onJSONReplyERROR 
		});
	}
	
	
	function setConfig(confKey, confValue) {
		/**
		 * Sets the config according to newConfig object. Available variables:
		 * - useCompoundDetection
		 * - useDictionary
		 * - useDerivationGuessing
		 */
		"use strict";
		
		// @todo: we should do error checking that throws something!
		config[confKey] = confValue;
	}
	
	
	// Lisame mooduli liidese otse EKIToolkit objekti alla kui 'Morph'
	EKI.Hyphenate = {
		/* this is the public interface */
		setConfig: setConfig,
		addToken: addToken,
		analyze: analyze,
		getTokenStorage: getTokenStorage,
		getTokenAnalysis: getTokenAnalysis,
		emptyTokenStorage: emptyTokenStorage,
		cleanToken: cleanToken,
		init:    EKI.modules.Hyphenate.init,
		destroy: EKI.modules.Hyphenate.destroy,
		notify:  EKI.modules.Hyphenate.notify, // @todo: kas see on õige?
	};
	
	EKI.Hyphenate.init(EKI);
};
