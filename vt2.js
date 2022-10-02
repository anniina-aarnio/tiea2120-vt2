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

reset = false;

// tätä funktiota kutsutaan automaattisesti käsiteltävällä datalla
// älä kutsu tätä itse!
function start(data) {

        // luodaan mapit, joissa id -> node -parit
        let sarjat = luoMapIdeista(data, "sarja");
        let rastit = luoMapIdeista(data, "rasti");
        // luodaan map, jossa joukkueet nimi -> node -pareina
        let joukkueet = luoJoukkueetMap(data);
        console.log(sarjat);
        console.log(rastit);
        console.log(joukkueet);
        
        // luodaan taulukon sisällöt, jotka järjestyksessä ensin sarjan sitten joukkueennimen mukaan
        let tulostaulukko = document.getElementById("tulokset");
        luoTaulukonRivit(tulostaulukko, sarjat, joukkueet);

        // luodaan lista kaikkien rastien koodeista aakkosjärjestyksessä
        let lista = document.getElementById("rastit");
        luoRastilista(lista, rastit);

        // luodaan lomake, jolla voi lisätä XML-rakenteeseen uuden rastin
        // documents.forms-rajapinnan kautta

        // dataa voi tutkia myös osoitteesta: https://appro.mit.jyu.fi/cgi-bin/tiea2120/randomize.cgi
        // huom. datan sisältö muuttuu hieman jokaisella latauskerralla
        // savedata tallentaa datan selaimen LocalStorageen. Tee tämä aina, kun
        // ohjelmasi on muuttanut dataa. Seuraavalla sivun latauskerralla
        // saat käyttöösi muuttamasi datan
	savedata(data);
}

// ----- OMAT FUNKTIOT -----

/**
 * Luodaan objekti, johon lisätään kyseisellä sanalla etsittyjä
 * nodeja datasta siten, että noden id on objektissa avain ja arvo on viite kyseiseen nodeen
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
        for (let [nimi, joukkue] of joukkueet) {
                sarjatJaJoukkueet.get(joukkue.getAttribute("sarja")).push(nimi);
                sarjatJaJoukkueet.get(joukkue.getAttribute("sarja")).sort(vertaaKaikkiPienella);
        }

        console.log(sarjatJaJoukkueet);

        // luodaan uusi rivi taulukkoon
        for (let [sarja, joukkueita] of sarjatJaJoukkueet) {
                for (let joukkue of joukkueita) {
                        taulukkonode.appendChild(
                                luoTaulukonRivi(sarjat.get(sarja).textContent, joukkue));
                }
        }

}

/**
 * Luo uuden taulukon rivin, johon lisää sisällöksi
 * 1. sarakkeeseen sarjan nimi
 * 2. sarakkeeseen joukkueen nimi
 * @param {String} sarjannimi 
 * @param {String} joukkueennimi 
 * @returns uusi rivielementti, jossa mukana sarjannimi ja joukkueennimi omina osinaan
 */
function luoTaulukonRivi(sarjannimi, joukkueennimi) {
        let rivi = document.createElement("tr");
        let sarja = document.createElement("td");
        let joukkue = document.createElement("td");

        sarja.textContent = sarjannimi;
        joukkue.textContent = joukkueennimi;

        rivi.appendChild(sarja);
        rivi.appendChild(joukkue);
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
        console.log(aakkosrastit);
        for (let rasti of aakkosrastit.values()) {
                let rivi = document.createElement("li");
                rivi.textContent = rasti[1].getAttribute("koodi");
                ulnode.appendChild(rivi);
        }

}

// ----- OMAT APUFUNKTIOT -----

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
        return /^[a-z]/.test(testattava);
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

        console.log(aa, bb);
        // alkaako a kirjaimella
        if (alkaakoKirjaimella(aa)) {
                // alkaako myös b kirjaimella
                if (alkaakoKirjaimella(bb)) {
                        return aa-bb;
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