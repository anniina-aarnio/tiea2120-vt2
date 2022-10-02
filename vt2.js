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
        luoTaulukonRivit(sarjat, joukkueet);
        // luodaan lista kaikkien rastien koodeista aakkosjärjestyksessä

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

function luoTaulukonRivit(sarjat, joukkueet) {
        // järjestä sarjat aakkosjärjestykseen
        let sarjalista = [];
        for (let sarja of sarjat.values()) {
                console.log(sarja);
                let nro = sarja.getAttribute("kesto");
                sarjalista.push(nro + "h");
        }
        sarjalista.sort(vertaaKaikkiPienella);


        console.log(sarjalista);
        // järjestä joukkueet aakkosjärjestykseen

        // luo
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
 * Vertaa kahta annettua merkkijonoa:
 * kirjaimet tulevat ennen numeroita, isoilla ja pienillä kirjaimilla ei väliä
 * @param {String} a 
 * @param {String} b 
 * @returns -1 jos a ensin, 1 jos b ensin ja 0 jos samat
 */
function vertaaKirjaimetEnnenNumeroita(a, b) {
        // onko kirjaimia alussa

        // kaikki pieniksi kirjaimiksi + trim
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
