# jsEKIToolkit

Eesti Keele Instituudi veebiteenuste moodul. EKIToolkit on javaskript moodul, mis võimaldab veebiseppadel integreerida EKI ressursse oma veebilehtedele. Moodul võimaldab lihtsalt:
* teksti lausestada
* sõnu silbitada
* sõnu morfoloogiliselt analüüsida
* sõnade algvormi leida
* (varsti) sõnade kohta otsida informatsiooni e-keelenõust ja sõnastikest

## Kasutamine

EKIToolkiti koodi ei pea allalaadima ja paigaldama vaid on võimalik kasutada kahel viisil, linkida või allalaadida ja paigaldada. Kuna kood on alles arendamisel ja muutlik, on kõige lihtsam koodile linkida. Siis on kindel, et kasutatakse kõige viimast versiooni.
Mõlemal lisamisviisi juhul on EKIToolkiti kood jagatud peamooduliks ja lisamooduliteks. Peamoodulit läheb alati vaja, aga on mõistlik lisada ainult need lisamoodulid, mida parajasti vaja läheb.
Peamoodul asub failis EKIToolkit.js ja lisamoodulid on jagatud vastavalt ülesandele failidesse
* EKIMorphModule.js — sõna morfoloogiline analüüs
* EKIDictModule.js — sõnastikud ja e-keelenõu (tulemas)
* EKISyllModule.js — silbitamine
* EKISentModule.js — lausestamine
* EKIQuantModule.js — sõna algvormi tüve vältemääramine

### Koodi linkimine leheküljelt
jsEKIToolkit kood lingitakse lisades neile lingid leheküljele. Kõik kasutatud moodulid peavad ka olema lisatud.

```HTML
<html>
  <header>
    <script src="http://keelenou.eki.ee/EKIToolkit.js"></script>
    <script src="http://keelenou.eki.ee/EKIMorphModule.js"></script>
  </header>
</html>
```
  
### Koodi allalaadimine ja paigaldamine (ja kaasalöömine)
Koodi kõige kasutuskõlblikum variant asub Master harus ja on allalaaditav paremal nupu alt *Download ZIP*. Oskajad võivad endale kloonida Git koodihoidla. See on sama kood, mida kasutatakse linkides. Arendused on näha teistes harudes. Kui sul on hea idee, mida me võiksime arendada, võta julgelt kontakti! GitHubi veateated (Issues) on ka hea kommunikatsioonikanal.
Kui oskad javaskripti ise koodida, ole julge ja saada parandusi ja lisandusi meile. Meie oleme alles algajad.

## Kuidas alustada ja kasutusnäiteid
Alljärgnev eeldab, et nii EKIToolkit.js kui ka EKIMorphModule.js koodifailid on leheküljele lisatud (kas lingitud või paigaldatud kujul).

```JavaScript
// kasutame morfoloogiamoodulit
EKIToolkit.use('morphology');
// meie kirjutatud kood jooksutatakse n.ö liivakastis, et tagada mängumeeleolu
EKIToolkit.sandbox(function() {
  // analüüsimisek jaoks suvaline tekstijupp
  random_sentence = "Appi appi! kass läks kappi!";
  
  // Enne analüüsi, on teksti vajalik üksustada sõnedeks
  // EKI.utils.simpleTokenizer funktsioon tükeldab sisestatud teksti tühikute
  // juurest, ja tagastab sõnede massiivi. Lihtsustades teeb ta
  // ["Appi", "appi!"] == "Appi appi!".split();
  // utils.SimpleTokenizer funktsioon asub EKIToolkit tuumas, ja on seega
  // alati kättesaadav.
  
  tokenized_sentence = EKI.utils.simpleTokenizer(random_sentence);
  
  for (word in tokenized_sentence) {
    EKI.m.add(word);
  }
  // Kuna analüüsimine toimub pilves ja me ei tea, millal see valmis saab, peame
  // enne analüüsimist ütlema, mida tehakse just siis, kui analüüs valmis saab.
  // Selleks lisame oma funktsiooni – seda me oleksime tavaliselt teinud juba
  // alguses, aga siis ei oleks see näitlikustav kood sama lihtsalt arusaadav olnud :-)
  function do_when_morph_is_done_analyzing() {
    for (word in tokenized_sentence) {
      analysis = EKI.m.analyzedTokens(word);
      document.print('sõne „'+word+'” analüüs on: '+analysis+'<br/><br/>');
    }
  }
  EKI.m.addListener(do_when_morph_is_done_analyzing);
  // Nüüd laseme pilvepäkapikel teostada analüüsi
  EKI.m.analyze();
});
```
