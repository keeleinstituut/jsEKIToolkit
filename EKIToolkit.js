function EKIToolkit() {
	/**
	 * See on EKIToolkit peamoodul, mis moodustab selle liidesed. Avalik
	 * liides on mõeldud kasutajale ja peidetud liides on vaid moodulite 
	 * kommunikatsiooni jaoks.
	 */
	"use strict";

	// Muudame arguments loendi massiiviks args
	var args = Array.prototype.slice.call(arguments),
		// viimane argument on tagasiväljakutse (meie liivakast)
		workspace = args.pop(),
		// vajatud moodulid on võimalik anda nii sõnedena kui ka massiivina
		spec_modules = (args[0] && typeof args[0] === "string") ? args : args[0],
		i;
	
	// Teeme kindlaks, et EKIToolkit on väljakutsutud new operaatoriga
	if (!(this instanceof EKIToolkit)) {
		return new EKIToolkit(spec_modules, workspace);
	}
	
	if (spec_modules === undefined) { spec_modules = []; }
	
	// Avalik liides asub 'this' objektis, kõik ülejäänud (var) on privaatne
	//~ this.modules = modules;
	this.observerList = []; // @todo: ei peaks olema avalik
	
	function notify(event) {
		/**
		 * This is a Mediator that sends messages between all observing
		 * modules. Modules are added with addObserver().
		 * 
		 * @method notify
		 * @for EKIToolkit
		 * @param {object} event The event to be sent
		 * @param {string} event.type The type of the event (required)
		 * @param {object} event.sender The sender who sent the event (implicit)
		 * @param {string} event.message An optional longer message (optional)
		 * @param {object} event.data Any data for the receiver (optional)
		 */
		"use strict";
		
		var event = event; // = typeof event === 'string' ? {type: event} : event,
		i;
		
		for(i=0; i<this.observerList.length; i+=1) { // notify all observers that
			/* if (this.observerList[i].hasOwnProperty('notify') // has notify method
					&& this.observerList[i] !== event.sender ) { */   // is not the sender
				console.log("EKIToolkit: Notify! " + event.type, event);
				console.log(this.observerList[i]);
				if (typeof this.observerList[i] === 'function') {
					this.observerList[i]();
				}
				//~ this.observerList[i].notify(event); // @todo: REKURSIOON!
			/* } */
		}
	}
	
	function addObserver(observer) {
		/**
		 * Adds a module to the observer's list. The module has to implement
		 * a method notify(msg) that will be used by the Mediator.
		 * 
		 * @method addObserver
		 * @for EKIToolkit
		 * @param {Object} observer The observing module
		 */
		"use strict";
		
		var observer = observer || '';
		
		if (this.observerList.indexOf(observer) === -1 && observer !== '') {
			this.observerList.push(observer);
		}
	}
	
	function removeObserver(observer) {
		/**
		 * Removes a module from the observer's list. Usually this is done
		 * in the module's destroy method.
		 * 
		 * @method removeObserver
		 * @for EKIToolkit
		 * @param {Object} observer The observing module to be removed
		 */
		"use strict";
		
		var observer = observer,
		pos;
		
		pos = this.observerList.indexOf(observer);
		if (pos !== -1) {
			this.observerList.splice(pos, 1);
		}
	}
	
	// Avalik liides
	this.addObserver = addObserver;
	this.removeObserver = removeObserver;
	this.notify = notify;
	
	// Käivitame soovitud moodulid
	for (i=0; i<spec_modules.length; i+=1) {
		// kopeeri moodul globaalsesse nimeruumi
		this.modules[spec_modules[i]](this);
		console.log('EKIToolkit: Loaded module: "' + spec_modules[i] + '"');
	}
	

	// Nüüd jooksutame 'töölaua' (ehk saadud tagasiväljakutse)
	if (typeof workspace === 'function') {
		workspace(this);
	}
};

	


// mitmed väiksed ja kasulikud meetodid
EKIToolkit.prototype.utils = {};
EKIToolkit.prototype.utils.create = function (object) {
	/**
	 * Crockford (2008:22) nimetab seda Object.create(o), mis loob uue
	 * objekti mille prototüübiks on olemasalev objekt 'o'
	 */
	"use strict"; 
	var F = function() {};
	F.prototype = object;
	return new F();
};
EKIToolkit.prototype.utils.simpleTokenizer = function (text) {
	/**
	 *  The tokenizer chunks the text into tokens that are analyzed
	 * by the morphological analyzer. By default the tokenizer
	 * chunks tokens simply by whitespace, but this can be
	 * over-ridden by any function that returns an array of tokens
	 * 
	 * Poolituskohtade reeglid on vastavalt:
	 * - \s+ ehk mistahes tühikute jada
	 * - [\n\r]+ reavahetuste jada (NB! jQuery.text() ei pruugi neid anda)
	 * - [.!?]+ ehk kirjavahemärkide jada
	 */
	 
	 var tokenized_text;
	 tokenized_text = text.trim().split(/\s+|[.!?]+|[\n\r]+/gm);
	 
	 // ... we could for example remove duplicates here ...
	 
	 return tokenized_text;
}
EKIToolkit.prototype.utils.NGrams = function (tekst, n, splitter, normalizeSpace) {
	/**
	 * Lihtne n-grammide koostaja. Sisendiks on tekst, n-grammi pikkus ja
	 * üksustamisreegel.
	 * Vaikimisi on n-grammi pikkus 2 ehk bigramm;
	 * vaikimisi üksustatakse tühemike pealt.
	 * 
	 * NB! tekstist ei koristata kirjavahemärke.
	 */
	var gramm = '', grammid = {}, i = 0;
	
	/* vaikimisi n pikkus on bigrammid */
	if (n === undefined || !(n > 0)) {
			n = 2;
	}
	/* vaikimisi segmendipiiriks on tühemikud */
	if (splitter === undefined) {
			splitter = /\s+/;
	}
	/* üksusta sisestatud tekst */
	tekst = tekst.split(splitter);
	
	/* n-grammista tekst */
	for (i=0; i<tekst.length; i+=1) {
		/* ära ületa tekstipiiri */
		if ((i+n) > tekst.length) {
				break;
		}
		gramm = tekst.slice(i,i+n);
                /* loendi jaoks tekitame grammi jaoks indeksi */
		grammIndeks = gramm.join("");
                /* indeks ei saa algada ega lõppeda tühikuga, seega võime
                 * normaliseerida kõik tühikud mõne muu Unikood märgiga */
                if (normalizeSpace !== undefined) {
                    grammIndeks = grammIndeks.replace(" ", normalizeSpace);
		}
		/* salvesta või tõsta ngrammi esinevus */
		if (!(grammIndeks in grammid)) {
				grammid[grammIndeks] = 1;
		} else {
				grammid[grammIndeks] += 1;
		}
	}
	return grammid;
}


// moodulid registreeritakse praegu prototüüpi otse sisse, kuniks loader töötab
EKIToolkit.prototype.modules = {};
EKIToolkit.prototype.modules.addGenericModuleParts = function(module) {
	/**
	 * See lisab objektile kolm funktsiooni, mis on "kohustuslikud" moodulile.
	 */
	"use strict";
	var sandbox,
		eventConf;
	
	module.init = function(EKI, eventConfig) {
		/**
		 * See on 
		 */
		"use strict";
		
		// lisa moodul observerlistisse
		sandbox = EKI;
		eventConf = eventConfig || {};
		eventConf.sender = this;
		EKI.addObserver(this);
	}
	
	module.notify = function(event) {
		/**
		 * See on 
		 */
		"use strict";
		
		// delegeeri notify meetod EKIToolkit omale
		sandbox.notify(event);
	}
	
	module.destroy = function() {
		/**
		 * See on 
		 */
		"use strict";
		
		// eemalda 'module' mediatori observerlistist
		sandbox.removeObserver(this);
	}
};




