"use strict";
//@ts-check
/* globals reset: true */
/* globals savedata: true */
// voit tutkia käsiteltävää dataa suoraan osoitteesta
// https://appro.mit.jyu.fi/cgi-bin/tiea2120/randomize.cgi
// data muuttuu hieman jokaisella latauskerralla

// jos reset == true, ladataan aina uusi data. jos reset == false, käytetään
// localStorageen tallennettua versiota, jossa näkyvät omat lisäykset
// testaa sovellusta molemmilla arvoilla
// localStoragen voi myös itse tyhjentää Storage-välilehden kautta

reset = true;


// tätä funktiota kutsutaan automaattisesti käsiteltävällä datalla
// älä kutsu tätä itse!
function start(data) {

        // lisätään lisää-nappiin data, jota voi hyödyntää muuallakin
        let nappi = document.getElementById("lisaaRastiNappi");
        nappi.data = data;

        // luodaan mapit, joissa id -> node -parit
        let sarjat = luoMapIdeista(data, "sarja");
        let rastit = luoMapIdeista(data, "rasti");
        // luodaan map, jossa joukkueet nimi -> node -pareina
        let joukkueet = luoJoukkueetMap(data);
        nappi.sarjat = sarjat;
        nappi.rastit = rastit;
        nappi.joukkueet = joukkueet;
        console.log(sarjat);
        console.log(rastit);
        console.log(joukkueet);
        
        // luodaan taulukon sisällöt, jotka järjestyksessä ensin sarjan sitten joukkueennimen mukaan
        let tulostaulukko = document.getElementById("tulokset");
        luoTaulukonRivit(tulostaulukko, sarjat, joukkueet);

        // luodaan lista kaikkien rastien koodeista aakkosjärjestyksessä
        let rastilista = document.getElementById("rastit");
        luoRastilista(rastilista, rastit);



        // luodaan lomake, jolla voi lisätä XML-rakenteeseen uuden rastin
        // documents.forms-rajapinnan kautta
        let rastinLisays = document.forms["lisaaRasti"];

        rastinLisays["lisaaRastiNappi"].addEventListener('click', function() {
                if (tarkistaOikeellisuus(rastit)) {
                        paivitaRastilista(rastilista, rastit);
                        tyhjennaFormi("lisaaRasti");
                }
        });

        // dataa voi tutkia myös osoitteesta: https://appro.mit.jyu.fi/cgi-bin/tiea2120/randomize.cgi
        // huom. datan sisältö muuttuu hieman jokaisella latauskerralla
        // savedata tallentaa datan selaimen LocalStorageen. Tee tämä aina, kun
        // ohjelmasi on muuttanut dataa. Seuraavalla sivun latauskerralla
        // saat käyttöösi muuttamasi datan
        console.log(data.documentElement);
	savedata(data);
}

// ----- OMAT FUNKTIOT -----

/**
 * Luodaan objekti, johon lisätään kyseisellä sanalla etsittyjä
 * nodeja datasta siten, että noden id on objektissa avain ja arvo on viite kyseiseen nodeen
 * Lisää myös viitteen datasta, jotta lisääminen yms. onnistuu muualla helposti
 * @param {XMLDocument} data
 * @param {String} hakusana etsittävän sanan perusteella
 * @return {Object} objekti, jossa kyseisellä sanalla tägätyt nodet 
 */
function luoMapIdeista(data, hakusana) {
        let jutut = new Map();

        // luo id-sisältöisen avaimen jokaisesta lapsesta (eli sarjasta / rastista)
        for (let lapsi of data.documentElement.getElementsByTagName(hakusana)) {
                jutut.set(lapsi.id, lapsi);
        }
        return jutut;
}

/**
 * Luodaan objekti, johon lisätään joukkuenodet datasta siten, että
 * joukkueen nimi on objektissa avain ja arvo on viite kyseiseen nodeen
 * Lisää myös viitteen datasta, jotta lisääminen yms. onnistuu muualla helposti
 * @param {XMLDocument} data
 * @return {Map} objekti, jossa joukkueet nimi -> node -pareina
 */
function luoJoukkueetMap(data) {
        let joukkueet = new Map();
        for (let joukkue of data.documentElement.getElementsByTagName("joukkue")) {
                joukkueet.set(joukkue.lastElementChild.textContent.trim(), joukkue);
        }
        return joukkueet;
}

/**
 * Lisää uusia rivejä taulukkoon siten, että ne ovat järjestyksessä
 * ensisijaisesti sarjan nimen mukaan ja
 * toissijaisesti joukkueen nimen mukaan
 * @param {Node} taulukkonode johon lisätään uusia rivejä
 * @param {Map} sarjat
 * @param {Map} joukkueet
 */
function luoTaulukonRivit(taulukkonode, sarjat, joukkueet) {
        // järjestää sarjat aakkosjärjestykseen
        // aakkosjärjestykseen esim. 3 < 20 < kissa1
        let sarjaMap = new Map([...sarjat]
                .sort((a,b) => vertaaKaikkiPienella(a[1].textContent, b[1].textContent)));

        let sarjatJaJoukkueet = new Map();
        for (let id of sarjaMap.keys()) {
                sarjatJaJoukkueet.set(id, []);
        }

        // lisätään joukkueiden nimet kunkin sarjan listaan ja vaihdetaan aakkosjärjestykseen
        for (let joukkue of joukkueet.values()) {
                sarjatJaJoukkueet.get(joukkue.getAttribute("sarja")).push(joukkue);
        }

        // aakkostaa joukkuelistat
        for (let joukkue of sarjatJaJoukkueet.values()) {
                aakkosta(joukkue);
        }

        // luodaan uusi rivi taulukkoon
        for (let [sarja, joukkueita] of sarjatJaJoukkueet) {
                for (let joukkue of joukkueita) {
                        taulukkonode.appendChild(luoTaulukonRivi(sarjat.get(sarja).textContent, joukkue));
                }
        }

}

/**
 * Aakkostaa joukkuelistan joukkueen nimien mukaan
 * Joukkuelistassa joukkueiden täytyy olla nodeja
 * @param {Array} joukkuelista 
 */
function aakkosta(joukkuelista) {
        joukkuelista.sort((a,b) => vertaaKaikkiPienella(a.lastElementChild.textContent,
                b.lastElementChild.textContent));
}

/**
 * Luo uuden taulukon rivin, johon lisää sisällöksi
 * 1. sarakkeeseen sarjan nimi
 * 2. sarakkeeseen joukkueen nimi
 * @param {String} sarjannimi 
 * @param {Element} joukkue
 * @returns uusi rivielementti, jossa mukana sarjannimi ja joukkueennimi omina osinaan
 */
function luoTaulukonRivi(sarjannimi, joukkue) {
        let rivi = document.createElement("tr");
        let sarja = document.createElement("td");
        let joukkueTekstit = document.createElement("td");
        let joukkuenimi = document.createElement("a");
        let jasenet = document.createElement("ul");

        sarja.textContent = sarjannimi;

        for (let jasen of joukkue.firstChild.childNodes) {
                let osa = document.createElement("li");
                osa.textContent = jasen.firstChild.textContent;
                jasenet.appendChild(osa);
        }

        joukkuenimi.textContent = joukkue.lastChild.textContent;
        joukkueTekstit.appendChild(joukkuenimi);
        joukkueTekstit.appendChild(jasenet);

        rivi.appendChild(sarja);
        rivi.appendChild(joukkueTekstit);
        return rivi;     
}

/**
 * Lisää rivin jokaisesta rastista aakkosjärjestyksessä koodin mukaan
 * @param {Node} ulnode 
 * @param {Map} rastit
 */
function luoRastilista(ulnode, rastit) {
        let aakkosrastit = [...rastit].sort((a,b) => {
                let akoodi = a[1].getAttribute("koodi");
                let bkoodi = b[1].getAttribute("koodi");
                return vertaaKirjaimetEnnenNumeroita(akoodi,bkoodi);
        });
        for (let rasti of aakkosrastit.values()) {
                let rivi = document.createElement("li");
                rivi.textContent = rasti[1].getAttribute("koodi");
                ulnode.appendChild(rivi);
        }

}

/**
 * Päivittää rastilistan poistamalla ensin kaikki ul:n li:t
 * Luo sitten uuden rastilistan tiedoilla, joissa jotain muutoksia
 * @param {Node} ulnode johon lisätään 
 * @param {Map} rastit 
 */
function paivitaRastilista(ulnode, rastit) {
        while (ulnode.firstChild) {
                ulnode.firstChild.remove();
        }
        luoRastilista(ulnode, rastit);
        savedata(document.getElementById("listaaRastiNappi").data);
}

/**
 * Tarkistaa, onko lomakkeen sisällöt sellaisia että ne voi lähettää
 * Jos ei ole, mitään ei tapahdu
 * Jos on, rasti lisätään listaan, lista päivittyy, sivu päivittyy ja lomake tyhjenee
 * Katsoo myös, ettei tule kahta samalla koodilla varustettua rastia.
 * @param {Map} rastit
 * @return {Boolean} true, jos rasti lisätään, false jos ei
 */
function tarkistaOikeellisuus(rastit) {
        //e.preventDefault();
        // inputtien tekstit
        let lat = document.forms["lisaaRasti"]["lat"].value;
        let lon = document.forms["lisaaRasti"]["lon"].value;
        let koodi = document.forms["lisaaRasti"]["koodi"].value;

        if (koodi.trim() === "" || isNaN(lat)|| isNaN(lon)) {
                return false;
        }

        // tarkistaa onko samanniminen koodi jo olemassa
        for (let rasti of rastit) {
                if (koodi.toLowerCase() === rasti[1].getAttribute("koodi").toLowerCase()) {
                        return false;
                }
        }

        let uusiID = 0;
        for (let id of rastit.keys()) {
                if (uusiID < parseInt(id)) {
                        uusiID = parseInt(id);
                }
        }
        uusiID += 1;

        let rasti = {
                "lat": lat,
                "lon": lon,
                "koodi": koodi,
                "id": String(uusiID)
        };

        lisaaRasti(rasti, rastit);
        return true;
}

/**
 * Luo rasti-elementin annetun rasti-objektin tiedoilla
 * ja lisää sen dataan.
 * Olettaa, että rasti on oikeaa muotoa, eli
 * {"lat": float, "lon": float, "koodi": rastinkoodinimi}
 * @param {Object} rasti 
 * @param {Map} rastit
 */
function lisaaRasti(rasti, rastit) {
        // viite datasta talteen käyttöä varten
        let data = document.getElementById("lisaaRastiNappi").data;

        let uusirasti = data.createElement("rasti");
        uusirasti.setAttribute("id", rasti.id);
        uusirasti.setAttribute("koodi", rasti.koodi);
        uusirasti.setAttribute("lat", rasti.lat);
        uusirasti.setAttribute("lon", rasti.lon);

        let paikka = data.getElementsByTagName("rastit");
        paikka[0].appendChild(uusirasti);

        rastit = rastit.set(rasti.id, uusirasti);
}

/**
 * Onnistuneen lisäyksen jälkeen tyhjentää formin input-text-laatikot
 * @param {String} forminID formin id
 */
function tyhjennaFormi(forminID) {
        let elementit = document.forms[forminID].elements;

        for (let e of elementit) {
                if (e.nodeName === "input" && e.type === "text") {
                        e.value = "";
                }
        }
        console.log(elementit);
}

// ----- OMAT APUFUNKTIOT mm. vertailuun-----

/**
 * Vertaa kahta annettua merkkijonoa:
 * - muuntaa kaikki pieniksi kirjaimiksi ja vertaa sen jälkeen
 * - ottaa huomioon, jos alussa on numeroita, että ne tulevat numerojärjestykseen
 * - ei ota huomioon keskellä olevia numeroita numeroina vaan merkkeinä
 * esim. 2h < 4h < 20h < Kissa < kissab = KiSsAB
 * @param {String} a 
 * @param {String} b
 * @return -1 jos a ensin, 1 jos b ensin, 0 jos samat 
 */
function vertaaKaikkiPienella(a, b) {

        // muutetaan kaikki kirjaimet pieniksi + whitespacet pois alusta ja lopusta
        let aa = a.toLowerCase().trim();
        let bb = b.toLowerCase().trim();
        
        // jos numeroita alussa
        if (alkaakoNumerolla(aa)) {
                // jos myös b:llä numeroita alussa
                if (alkaakoNumerolla(bb)) {
                        // muodostetaan numerot
                        let aalku = parseInt(aa);
                        let balku = parseInt(bb);

                        // jos numerot erisuuret
                        if (aalku != balku) {
                                return aalku-balku;
                        }
                }
                // jos vain a:lla numeroita alussa
                else {
                        return -1;
                }
        }

        // vertaa pelkkiä kirjainmerkkijonoja toisiinsa
        if (aa < bb) {
                return -1;
        } else if (bb < aa) {
                return 1;
        }
        return 0;
}

/**
 * Käy läpi merkkijonon, ja katsoo onko se vain numeroita
 * Alussa täytyy olla "-" 0-1 kertaa
 * Sitten jokin numero 0-9 vähintään kerran
 * Kunnes päättyy ($)
 * 
 * @param {String} value 
 * @returns true jos on vain numeroita, false jos ei ole
 */
function isNumeric(value) {
        return /^-{0,1}\d+$/.test(value);
}

/**
 * Ottaa parametrikseen yhden String:n ja tarkistaa, alkaako numerolla.
 * @param {String} testattava
 * @returns {Boolean} true jos String alkaa numerolla, false jos ei
 */
function alkaakoNumerolla(testattava) {
        return /^\d/.test(testattava);
}

/**
 * Tarkistaa onko merkkijonon alku kirjaimia
 * @param {String} testattava 
 */
function alkaakoKirjaimella(testattava) {
        return /^\D/.test(testattava);
}
 
/**
 * Ottaa parametrikseen kaksi merkkijonoa ja vertaa niitä keskenään.
 * Numeroilla alkavat merkkijonot ovat kirjaimilla alkavien jälkeen.
 * Isoilla ja pienillä kirjaimilla ei ole järjestämisessä merkitystä.
 * @param {String} a 
 * @param {String} b 
 * @returns {Number} palauttaa -1 jos a tulee taulukkoon ensin, 1 jos b ja 0 jos sama nimi
 */
function vertaaKirjaimetEnnenNumeroita(a, b) {

        // kaikki pieniksi kirjaimiksi
        let aa = a.trim().toLowerCase();
        let bb = b.trim().toLowerCase();

        // alkaako a kirjaimella
        if (alkaakoKirjaimella(aa)) {
                // alkaako myös b kirjaimella
                if (alkaakoKirjaimella(bb)) {
                        if (aa < bb) {
                                return -1;
                        }
                        if (bb < aa) {
                                return 1;
                        }
                        return 0;
                }
                // a alkoi, b ei joten a ensin
                return -1;
        }

        // a ei alkanut kirjaimella, alkaako b
        if (alkaakoKirjaimella(bb)) {
                return 1;
        }

        return vertaaKaikkiPienella(aa, bb);
}
