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

        // luodaan taulukot, joissa id-avaimella viitteet datan nodeihin
        let sarjat = luoTaulukkoIdeista(data, "sarja");
        let rastit = luoTaulukkoIdeista(data, "rasti");
        
        // dataa voi tutkia myös osoitteesta: https://appro.mit.jyu.fi/cgi-bin/tiea2120/randomize.cgi
        // huom. datan sisältö muuttuu hieman jokaisella latauskerralla
	console.log(data.documentElement);
	console.log(data.documentElement.getElementsByTagName("joukkue"));
        // savedata tallentaa datan selaimen LocalStorageen. Tee tämä aina, kun
        // ohjelmasi on muuttanut dataa. Seuraavalla sivun latauskerralla
        // saat käyttöösi muuttamasi datan
	savedata(data);
}

/**
 * Luodaan objekti, johon lisätään kyseisellä sanalla etsittyjä
 * nodeja datasta siten, että noden id on objektissa avain ja arvo on viite kyseiseen nodeen
 * @param {XMLDocument} data
 * @param {String} sana etsittävän sanan perusteella
 * @return {Object} objekti, jossa kyseisellä sanalla tägätyt nodet 
 */
function luoTaulukkoIdeista(data, sana) {
        let jutut = {};
        for (let lapsi of data.documentElement.getElementsByTagName(sana)) {
                jutut[lapsi.id] = lapsi;
        }
        console.log(jutut);
        return jutut;

}
