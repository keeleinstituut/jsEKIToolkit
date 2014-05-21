//~ var EKIToolkit = EKIToolkit || {};
//~ EKIToolkit.prototype = EKIToolkit.prototype || {};
//~ EKIToolkit.prototype.modules = EKIToolkit.prototype.modules || {};

EKIToolkit.prototype.modules.Morph = function(EKI, config) {
	/**
	 * This is the MorphAnalyzer factory
	 */
	"use strict";
	
	// See on moodul, lisame talle üldisi mooduli võimeid (init, destroy, notify)
	EKI.modules.addGenericModuleParts(EKI.modules.Morph);
	
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
			'action':					'analyys',
			'chkTuletusega':	false,
			'chkLiitsqnaga':	true,
			'chkSqnastikuga':	true,
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
			EKI.notify({type: "morph-analysis-ALLREADY-ready"});
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
		EKI.notify({type: "morph-analysis-ready"});
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
	
	
	function getTokenMorphList() {
		/**
		 * Returns the tokenStorage
		 */
		"use strict";
		
		return tokenStorage;
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
	
	
	function formNames(key) {
		/**
		 * simply looks up the key in a list and returns the value or empty
		 * if not found 
		 */
		"use strict";
		 
		var formList = {
			"??":					"määramatu vorm",
			"Fpref":			"prefiks",
			"Ger":				"des-vorm",
			"ID":					"muutumatu sõna (indekl)",
			"Ilyhi":			"muutumatu sõna lühitüvi",
			"IM_sA":			"im-tuletis (ülivõrre)",
			"ImpPrIps":		"käskiva kõneviisi oleviku umbisikuline tegumood",
			"ImpPrN":			"käskiva kõneviisi oleviku isikulise tegumoe eitus",
			"ImpPrPl1":		"käskiva kõneviisi oleviku mitmuse 1.p.",
			"ImpPrPl1N":	"käskiva kõneviisi oleviku mitmuse 1.p. eitus",
			"ImpPrPl2":		"käskiva kõneviisi oleviku mitmuse 2.p.",
			"ImpPrPl2N":	"käskiva kõneviisi oleviku mitmuse 2.p. eitus",
			"ImpPrPs":		"käskiva kõneviisi oleviku isikuline tegumood",
			"ImpPrSg2":		"käskiva kõneviisi oleviku ainsuse 2.p.",
			"ImpPrSg2N":	"käskiva kõneviisi oleviku ainsuse 2.p. eitus",
			"IndIpfIps":	"kindla kõneviisi lihtmineviku umbisikuline tegumood",
			"IndIpfIpsN":	"poldud",
			"IndIpfPl1":	"kindla kõneviisi lihtmineviku mitmuse 1.p.",
			"IndIpfPl2":	"kindla kõneviisi lihtmineviku mitmuse 2.p.",
			"IndIpfPl3":	"kindla kõneviisi lihtmineviku mitmuse 3.p.",
			"IndIpfPsN":	"polnud",
			"IndIpfSg1":	"kindla kõneviisi lihtmineviku ainsuse 1.p.",
			"IndIpfSg2":	"kindla kõneviisi lihtmineviku ainsuse 2.p.",
			"IndIpfSg3":	"kindla kõneviisi lihtmineviku ainsuse 3.p.",
			"IndPrIps":		"kindla kõneviisi oleviku umbisikuline tegumood",
			"IndPrIps_":	"kindla kõneviisi oleviku umbisikuline tegumood (eitusega)",
			"IndPrIpsN":	"polda",
			"IndPrPl1":		"kindla kõneviisi oleviku mitmuse 1.p.",
			"IndPrPl2":		"kindla kõneviisi oleviku mitmuse 2.p.",
			"IndPrPl3":		"kindla kõneviisi oleviku mitmuse 3.p.",
			"IndPrPs_":		"kindla kõneviisi oleviku isikuline tegumood (eitusega)",
			"IndPrPsN":		"pole",
			"IndPrSg1":		"kindla kõneviisi oleviku ainsuse 1.pööre",
			"IndPrSg2":		"kindla kõneviisi oleviku ainsuse 2.p.",
			"IndPrSg3":		"kindla kõneviisi oleviku ainsuse 3.p.",
			"Inf":				"da-infinitiiv e da-tegevusnimi",
			"Ivahe":			"muutumatu sõna vahehäälikuga vorm",
			"JA_vS":			"ja-tuletis (tegijanimi)",
			"KE_dA":			"ke-tuletis",
			"KE_dS":			"ke-tuletis",
			"KENE_dA":		"kene-tuletis",
			"KENE_dS":		"kene-tuletis",
			"KndPrIps":		"tingiva kõneviisi oleviku umbisikuline tegumood",
			"KndPrPl1":		"tingiva kõneviisi oleviku mitmuse 1.p.",
			"KndPrPl2":		"tingiva kõneviisi oleviku mitmuse 2.p.",
			"KndPrPl3":		"tingiva kõneviisi oleviku mitmuse 3.p.",
			"KndPrPs":		"tingiva kõneviisi oleviku isikuline tegumood",
			"KndPrPsN":		"poleks",
			"KndPrSg1":		"tingiva kõneviisi oleviku ainsuse 1.p.",
			"KndPrSg2":		"tingiva kõneviisi oleviku ainsuse 2.p.",
			"KndPtIps":		"tingiva kõneviisi mineviku umbisikuline tegumood",
			"KndPtPl1":		"tingiva kõneviisi mineviku mitmuse 1.p.",
			"KndPtPl2":		"tingiva kõneviisi mineviku mitmuse 2.p.",
			"KndPtPl3":		"tingiva kõneviisi mineviku mitmuse 3.p.",
			"KndPtPs":		"tingiva kõneviisi mineviku isikuline tegumood",
			"KndPtPsN":		"polnuks",
			"KndPtSg1":		"tingiva kõneviisi mineviku ainsuse 1.p.",
			"KndPtSg2":		"tingiva kõneviisi mineviku ainsuse 2.p.",
			"KvtPrIps":		"kaudse kõneviisi oleviku umbisikuline tegumood",
			"KvtPrPs":		"kaudse kõneviisi oleviku isikuline tegumood",
			"KvtPrPsN":		"polevat",
			"KvtPtIps":		"kaudse kõneviisi mineviku umbisikuline tegumood",
			"KvtPtPs":		"kaudse kõneviisi mineviku isikuline tegumood",
			"KvtPtPsN":		"polnuvat",
			"LINE_aA":		"line-tuletis",
			"LT_mD":			"lt-tuletis",
			"M_cA":				"m-tuletis (keskvõrre)",
			"MATA_vA":		"mata-tuletis",
			"MATU_vA":		"matu-tuletis",
			"MINE_vS":		"mine-tuletis (teonimi)",
			"MUS_vS":			"mus-tuletis",
			"NE_aA":			"ne-tuletis",
			"Neg":				"eitus",
			"Nlyhi":			"noomeni lühitüvi",
			"NU_vS":			"nu-tuletis",
			"NUD_vA":			"nud-tuletis",
			"Nvahe":			"noomeni vahehäälikuga vorm",
			"PlAb":				"mitmuse ilmaütlev",
			"PlAbl":			"mitmuse alaltütlev",
			"PlAd":				"mitmuse alalütlev",
			"PlAll":			"mitmuse alaleütlev",
			"PlEl":				"mitmuse seestütlev",
			"PlEs":				"mitmuse olev",
			"PlG":				"mitmuse omastav",
			"PlIll":			"mitmuse sisseütlev",
			"PlIn":				"mitmuse seesütlev",
			"PlKom":			"mitmuse kaasaütlev",
			"PlN":				"mitmuse nimetav",
			"PlP":				"mitmuse osastav",
			"PlTer":			"mitmuse rajav",
			"PlTr":				"mitmuse saav",
			"PtsPrIps":		"oleviku umbisikuline kesksõna e tav-kesksõna",
			"PtsPrPs":		"oleviku isikuline kesksõna e v-kesksõna",
			"PtsPtIps":		"mineviku umbisikuline kesksõna e tud-kesksõna",
			"PtsPtPs":		"mineviku isikuline kesksõna e nud-kesksõna",
			"Qunik":			"seotud / unikaalne tüvi",
			"Rpl":				"vokaalmitmuse tüvi",
			"SgAb":				"ainsuse ilmaütlev",
			"SgAbl":			"ainsuse alaltütlev",
			"SgAd":				"ainsuse alalütlev",
			"SgAdt":			"ainsuse suunduv e lühike sisseütlev",
			"SgAll":			"ainsuse alaleütlev",
			"SgEl":				"ainsuse seestütlev",
			"SgEs":				"ainsuse olev",
			"SgG":				"ainsuse omastav",
			"SgIll":			"ainsuse sisseütlev",
			"SgIn":				"ainsuse seesütlev",
			"SgKom":			"ainsuse kaasaütlev",
			"SgN":				"ainsuse nimetav",
			"SgP":				"ainsuse osastav",
			"SgTer":			"ainsuse rajav",
			"SgTr":				"ainsuse saav",
			"Sup":				"ma-infinitiiv e ma-tegevusnimi",
			"SupAb":			"mata-vorm",
			"SupEl":			"mast-vorm",
			"SupIn":			"mas-vorm",
			"SupIps":			"ma-tegevusnime umbisikuline tegumood",
			"SupTr":			"maks-vorm",
			"TAMATU_vA":	"tamatu-tuletis",
			"TAV_vAS":		"tav-tuletis",
			"TU1_vS":			"tu-tuletis (tegevuse objekt)",
			"TU2_kA":			"tu-tuletis (omadus)",
			"TUD_vA":			"tud-tuletis",
			"US_aS":			"us-tuletis (omadus)",
			"US_vS":			"us-tuletis (tegevus)",
			"V_vA":				"v-tuletis",
			"Vlyhi":			"verbi lühitüvi",
			"Vvahe":			"verbi vahehäälikuga vorm"
		}
		return formList[key] || '';
	}
	
	
	function posNames(key) {
		/** simply looks up the key in a list and returns the value or empty
		 * if not found
		 */
		"use strict";
		 
		var posList = {
			"A": "omadussõna",
			"D": "määrsõna",
			"G": "omastavaline täiend",
			"H": "pärisnimi",
			"I": "hüüdsõna",
			"J": "sidesõna",
			"K": "kaassõna",
			"N": "põhiarvsõna",
			"O": "järgarvsõna",
			"P": "asesõna",
			"S": "nimisõna",
			"V": "tegusõna"
		}
		return posList[key] || key;
	}
	
	
	// Lisame mooduli liidese otse EKIToolkit objekti alla kui 'Morph'
	EKI.Morph = {
		/* this is the public interface */
		setConfig: setConfig,
		emptyTokenStorage: emptyTokenStorage,
		addToken: addToken,
		getTokenMorphList: getTokenMorphList,
		analyze: analyze,
		getPosName: posNames,
		getFormName: formNames,
		cleanToken: cleanToken,
		init:    EKI.modules.Morph.init,
		destroy: EKI.modules.Morph.destroy,
		notify:  EKI.modules.Morph.notify, // @todo: kas see on õige?
	};
	
	EKI.Morph.init(EKI);
};
