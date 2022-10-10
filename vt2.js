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

        // lisätään lisää-nappiin data, jota voi hyödyntää muuallakin
        let nappi = document.getElementById("lisaaRastiNappi");
        nappi.data = data;

        // luodaan mapit, joissa id -> node -parit
        let sarjat = luoMapIdeista(data, "sarja");
        let rastit = luoMapIdeista(data, "rasti");
        // luodaan map, jossa joukkueet nimi -> node -pareina
        let joukkueet = luoJoukkueetMap(data);

        // lisätään kaikki data nappiin...
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
        rastinLisays["lisaaRastiNappi"].addEventListener('click', rastinLisaysTapahtuma);

        // luodaan lomake, jolla voi lisätä XML-rakenteeseen uuden joukkueen
        let joukkueenLisays = document.forms["lisaaJoukkue"];
        luoTyhjaJoukkueenLisays(joukkueenLisays);

        // jäsenkysely-osassa lisää jäsenlomakealueita labeleineen sitä mukaa kun täyttyy
        let jasenet = joukkueenLisays["jasenkysely"].getElementsByTagName("input");
        jasenet[0].addEventListener("input", lisaaUusiTyhjaJasenlabel);

        joukkueenLisays["lisaaJoukkueNappi"].addEventListener('click', joukkueenLisaysTapahtuma);
        joukkueenLisays["muokkaaJoukkuettaNappi"].addEventListener('click', joukkueenMuokkausTapahtuma);

        // luodaan toiminnallisuus joukkueen muokkaamiselle
        // joukkueen nimilinkistä täyttyy joukkueenlisäys-sisällöt ja muuttuu muokkausnappi
        let aelementit = document.getElementsByClassName("joukkueennimi");
        for (let a of aelementit) {
                a.addEventListener("click", joukkueenMuokkausLomake);
        }


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
 * Luo joukkueenlisäys-lomakkeen, jossa tyhjät inputit.
 * Etsii vaihtoehtoiset sarjat ja laittaa niihin radiosarjan, josta vain yksi voi olla valittuna.
 * Luo aluksi kaksi tyhjää joukkueen jäsen-inputtia.
 * @param {Form} formi 
 */
function luoTyhjaJoukkueenLisays(formi) {
        // tyhjentää nimen
        formi["nimi"].value = "";

        // sarjavalintalista radionappeineen
        let sarjat = document.getElementById("lisaaRastiNappi").sarjat;
        sarjat = new Map([...sarjat]
                .sort((a,b) => vertaaKaikkiPienella(a[1].textContent, b[1].textContent)));
        for (let [id,sarja] of sarjat) {
                // luodaan label ja siihen tekstiksi sarjan nimi
                let labeli = document.createElement("label");
                labeli.textContent = sarja.textContent;

                let radionappi = document.createElement("input");
                radionappi.setAttribute("type", "radio");
                radionappi.setAttribute("name", "sarjaradiot");
                radionappi.setAttribute("id", id);
                labeli.appendChild(radionappi);
                formi["sarjakysely"].appendChild(labeli);
        }

        // jäsenluettelon muokkaaminen
        luoKaksiTyhjaaJasenta(formi);
}

/**
 * Luo kaksi tyhjää jäsenlabel + input formin jäsenkyselyyn
 * @param {Form} formi 
 */
function luoKaksiTyhjaaJasenta(formi) {
        for (let i = 0; i < 2; i++) {
                let labeli = document.createElement("label");
                labeli.textContent = "Jäsen " + (i+1);
                let inputti = document.createElement("input");
                inputti.setAttribute("type", "text");
                inputti.addEventListener("input", lisaaUusiTyhjaJasenlabel);
                inputti.setAttribute("id", "Jäsen " + (i+1));
                formi["jasenkysely"].appendChild(labeli).appendChild(inputti);
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
        joukkuenimi.setAttribute("href", "#joukkueOtsikko");
        joukkuenimi.setAttribute("class", "joukkueennimi");
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
        let data = document.getElementById("lisaaRastiNappi").data;
        savedata(data);
}

/**
 * Kun painetaan "lisää rasti" -nappia, event (e) tapahtuu
 * tämän alla olevien käskyjen mukaisesti.
 * Käy läpi syötteen oikeellisuuden, ja jos kaikki on kunnossa,
 * päivittää rastilistan ja tyhjentää formin.
 * @param {Event} e tapahtuma
 */
function rastinLisaysTapahtuma(e) {
        e.preventDefault();
        let rastit = document.getElementById("lisaaRastiNappi").rastit;
        if (tarkistaRastinOikeellisuus(rastit)) {
                paivitaRastilista(document.getElementById("rastit"), rastit);
                tyhjennaFormi("lisaaRasti");
        }
}

/**
 * Kun painetaan "lisää joukkue" -nappia, event(e) tapahtuu
 * alla olevien käskyjen mukaisesti.
 * Käy läpi syötteen oikeellisuuden, ja jos kaikki on kunnossa,
 * päivittää joukkuelistan ja tyhjentää formin.
 * @param {Event} e 
 */
function joukkueenLisaysTapahtuma(e) {
        let joukkueet = document.getElementById("lisaaRastiNappi").joukkueet;



        if (tarkistaJoukkueenOikeellisuus(document.forms["lisaaJoukkue"], true)) {
                paivitaJoukkuelista();
                tyhjennaFormi("lisaaJoukkue");
        }
}

/**
 * Jos klikkaa joukkueen nimeä taulukosta, tullaan tähän tapahtumaan
 * Hakee oikean joukkueen eventin perusteella
 * ja täyttää lomakkeen tiedot joukkueen tiedoilla
 * (joukkueen nimi, sarja ja jäsenet)
 * Muuttaa "Lisää joukkue"-napin "Muokkaa joukkuetta"-napiksi
 * @param {Event} e 
 */
function joukkueenMuokkausLomake(e) {
        // tyhjennetään formi
        tyhjennaFormi("lisaaJoukkue");

        // haetaan muokattava formi
        let formi = document.forms["lisaaJoukkue"];

        // hae oikea joukkue
        let joukkueet = document.getElementById("lisaaRastiNappi").joukkueet;
        let joukkueennimi = e.originalTarget.textContent.trim();
        let joukkue = joukkueet.get(joukkueennimi);

        // joukkueen nimi nimeksi
        formi["nimi"].value = joukkueennimi;

        // etsitään oikea sarja valituksi ID:n mukaan
        let radiot = formi["sarjakysely"].getElementsByTagName("label");
        for (let radio of radiot) {
                let radioID = radio.firstElementChild.getAttribute("id");
                let joukkueenSarjaID = joukkue.getAttribute("sarja");
                if (radioID === joukkueenSarjaID) {
                        radio.firstElementChild.checked = true;
                        break;
                }
        }

        let i = 0;
        // täytetään jäsenet oikeilla tiedoilla TODO jos lomakkeessa jätetty 2 jäsentä niin tulee 1 tyhjä alkuun
        for (let jasen of joukkue.firstChild.childNodes) {
                let labeli = document.createElement("label");
                labeli.textContent = "Jäsen " + (i+1);
                let inputti = document.createElement("input");
                inputti.setAttribute("type", "text");
                inputti.addEventListener("input", lisaaUusiTyhjaJasenlabel);
                inputti.value = jasen.textContent;
                i++;
                formi["jasenkysely"].appendChild(labeli).appendChild(inputti);
        }

        // lisätään yksi tyhjä jäsenlabel
        let labeli = document.createElement("label");
        labeli.textContent = "Jäsen " + (i+1);
        let inputti = document.createElement("input");
        inputti.setAttribute("type", "text");
        inputti.addEventListener("input", lisaaUusiTyhjaJasenlabel);
        formi["jasenkysely"].appendChild(labeli).appendChild(inputti);

        // tarkistetaan onko "muokkaa joukkuetta"-nappi piilossa
        let nappi = formi["joukkueenKaikkiTiedot"].lastElementChild;
        if (nappi.className == "piilossa") {
                muutaNapinNakyvyys(nappi);
        }
        nappi.joukkue = joukkue;
}

/** 
 * Kun painetaan "muokkaa joukkuetta" -nappia, event(e) tapahtuu
 * alla olevien käskyjen mukaisesti.
 * Tarkistaa onko nimi sama kuin ennen, tai jos nimeä on muokattu
 * tarkistaa että toista samannimistä joukkuetta ei ole
 * Käy läpi syötteen oikeellisuuden, ja jos kaikki on kunnossa,
 * päivittää joukkueen tiedot, joukkuelistan ja tyhjentää formin.
 * @param {Event} e 
 */
function joukkueenMuokkausTapahtuma(e) {
        // laitetaan joukkuenoden viite talteen nappiin
        let joukkue = document.forms["lisaaJoukkue"]["joukkueenKaikkiTiedot"].lastElementChild.joukkue;
        
        if (tarkistaJoukkueenOikeellisuus(document.forms["lisaaJoukkue"], false)) {
                paivitaJoukkuelista();
                tyhjennaFormi("lisaaJoukkue");
                muutaNapinNakyvyys(document.forms["lisaaJoukkue"]["joukkueenKaikkiTiedot"].lastElementChild);
        }
}

/**
 * Muutetaan annettu nappi piiloon ja vaihdetaan toinen napin näkyvyys tilalle
 * Annetaan input-nappi, joka on joko "lisaaJoukkueNappi" tai "muokkaaJoukkuettaNappi"
 * @param {Input} nappi 
 */
function muutaNapinNakyvyys(nappi) {
        if (nappi.id == "lisaaJoukkueNappi") {
                nappi.removeAttribute("class");
                nappi.nextElementSibling.className = "piilossa";
        } else {
                nappi.removeAttribute("class");
                nappi.previousElementSibling.className = "piilossa";
        }
}

/**
 * Päivittää joukkueen tiedot tulostaulukkoon.
 */
function paivitaJoukkuelista() {
        let taulukko = document.getElementById("tulokset");
        let joukkueet = document.getElementById("lisaaRastiNappi").joukkueet;

        // ensin tyhjennä taulukko
        tyhjennaTaulukko(taulukko);
        
        // luo uusi taulukko
        luoTaulukonRivit(taulukko, document.getElementById("lisaaRastiNappi").sarjat, joukkueet);
}

/**
 * Tyhjentää taulukosta kaikki elementit paitsi otsikon ja otsikkorivin
 * @param {Table} taulukko 
 */
function tyhjennaTaulukko(taulukko) {
        let rivit = taulukko.getElementsByTagName("tr");
        for (let rivi of rivit) {
                if (rivi.firstElementChild.getAttribute("tag") == "th") {
                        continue;
                }
                rivi.remove();
        }
}

/** 
 * Tarkistaa, onko lomakkeen sisällöt sellaisia että ne voi lähettää.
 * Jos ei ole, mitään ei tapahdu
 * Jos on, luo uuden rastin, lisätään mappiin ja annetaan kutsuvalle
 * funktiolle lupa päivittää rastilista ja tyhjentää lomake.
 * Tarkistettavat asiat:
 * - lat ja lon ovat liukulukuja
 * - ei kahta samalla koodilla varustettua rastia
 * @param {Map} rastit
 * @return {Boolean} true, jos rasti lisätään, false jos ei
 */
function tarkistaRastinOikeellisuus(rastit) {
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
 * Tarkistaa, onko lomakkeen sisällöt sellaisia, että ne voi lähettää.
 * Jos ei ole, mitään ei tapahdu.
 * Jos sisällöt sopivia ja luodaanUusiJoukkue = true:
 * luodaan uusi joukkue, lisätään mappiin ja annetaan kutsuvalle
 * funktiolle lupa päivittää joukkuelista ja tyhjentää lomake.
 * Tarkistettavat asiat:
 * - joukkueen nimi
 * - jäseniä on vähintään kaksi
 * - joukkueen sarja on valittu
 * - tyhjiä jäsenkenttiä ei huomioida
 * Lisää joukkueen tietoihin myös
 * - rastileimaukset (oletuksena tyhjä)
 * - leimaustavan (oletuksena kaikilla GPS indeksinä merkittynä)
 * - aika (oletuksena 00:00:00)
 * - matka (oletuksena 0)
 * - pisteet (oletuksena 0)
 * Jos sisällöt sopivia ja luodaanUusiJoukkue = false:
 * päivitetään vanhan joukkueen tiedot uusiin, tallennetaan data ja
 * annetaan kutsuvalle funktiolle lupa päivittää joukkuelista ja tyhjentää lomake
 * @param {Form} formi 
 * @param {Boolean} luodaanUusiJoukkue true,jos kyseessä uuden joukkueen, false jos vanhan muokkaaminen
 * @return {Boolean} true, jos sopiva joukkue, false jos ei
 */
function tarkistaJoukkueenOikeellisuus(formi, luodaanUusiJoukkue) {


        // sarjan haku ja tarkistus että 1 valittu ja se löytyy myös datasta
        let sarjaID = "";

        let inputit = formi["sarjakysely"].getElementsByTagName("input");
        console.log(inputit);
        for (let input of inputit) {

                if (input.checked) {
                        sarjaID = input.getAttribute("id");
                        console.log("sarjaid " + sarjaID);
                }
        }
        if (sarjaID == "") {
                return false;
        }
                
        // jäsenien haku, tarkistus että väh. 2 kpl, kaikki eri nimisiä keskenään
        let jasenet = [];
        let forminJasenet = formi["jasenkysely"].elements;

        for (let jasen of forminJasenet) {
                if (jasen.value.trim() != "") {
                        jasenet.push(jasen.value.trim());
                } 
        }
        // jos jäseniä alle 2
        if (jasenet.length < 2) {
                return false;
        }
        // jos kaksi samannimistä jäsentä
        for (let i = 0; i < jasenet.length - 1; i++) {
                for (let j = 1; j < jasenet.length; j++) {
                        if (jasenet[i].toUpperCase() == jasenet[j].toUpperCase()) {
                                return false;
                        }
                }
        }

        // tarkista nimen oikeellisuus
        let formissaNimi = document.forms["lisaaJoukkue"]["nimi"].value.trim().toUpperCase();

        // kaikki kunnossa joten voidaan luoda uusi joukkue ja lisätä se joukkueisiin ja dataan
        // tai muokata vanhaa joukkuetta ja muuttaa se joukkueisiin ja dataan
        let joukkueet = document.getElementById("lisaaRastiNappi").joukkueet;
        let data = document.getElementById("lisaaRastiNappi").data;
        if (luodaanUusiJoukkue) {
                // tarkistaa nimen oikeellisuuden
                let formissaNimi = document.forms["lisaaJoukkue"]["nimi"].value.trim().toUpperCase();
                 if (formissaNimi == "" || !onkoUniikkiJoukkueennimi(formissaNimi)) {
                        return false;
                }
                // nyt kaikki kunnossa joten:
                // luo uusi joukkue
                let uusiJoukkue = data.createElement("joukkue");
                uusiJoukkue.setAttribute("aika", "00:00:00");
                uusiJoukkue.setAttribute("pisteet", "0");
                uusiJoukkue.setAttribute("matka", "0");
                uusiJoukkue.setAttribute("sarja", sarjaID);
                console.log(uusiJoukkue);

                let jasenetdataan = data.createElement("jasenet");


                let rastileimaukset = data.createElement("rastileimaukset");


                let leimaustapa = data.createElement("leimaustapa");


                let nimi = data.createElement("nimi");
        } else {
                // muokattava joukkue
                let joukkue = document.forms["lisaaJoukkue"]["joukkueenKaikkiTiedot"].lastElementChild.joukkue;
                // jos nimi on muutettu ja ei ole uniikki tai tyhjä
                if (formissaNimi != joukkue.childNodes[3].textContent.trim().toUpperCase()) {
                        if (formissaNimi == "") {
                                return false;
                        }
                        if (!onkoUniikkiJoukkueennimi(formissaNimi)) {
                                return false;
                        }
                }

                // joukkueen muutokset
        }

        
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
 * Jos kyseessä on joukkueenlisäysformi, poistaa kaikki labelit
 * @param {String} forminID formin id
 */
function tyhjennaFormi(forminID) {
        document.forms[forminID].reset();
        // TODO TÄMÄ EI TOIMI OIKEIN
        if (document.forms[forminID]["jasenkysely"]) {
                // TODO jos jättää 2 jäljelle niin muokkaajoukkuetta ei toimi
                let labelit = document.forms[forminID]["jasenkysely"].children;
                for (let i = labelit.length-1; i >= 0; i--) {
                        labelit[i].remove();
                }


        }
}

/**
 * Lisää uusia jäsenlabeleita jäsenkyselyyn siten, että
 * aina on yksi tyhjä input
 * Jos välistä tyhjentää inputteja, ei lisää uutta tyhjää
 * alimmaksi, mutta jos muut on täytettyjä,
 * lisää uuden laatikon
 * @param {Event} e 
 */
function lisaaUusiTyhjaJasenlabel(e) {
        let tyhja = false;

        // tämä ilmeisesti rikkoo, kun formin sisällä otetaan tägejä...
        let formi = document.forms["lisaaJoukkue"]["jasenkysely"];
        let inputit = formi.getElementsByTagName("input");

        // käydään läpi kaikki input-kentät viimeisestä ensimmäiseen
        for (let i = inputit.length-1; i >- 1; i--) {
                let input = inputit[i];

                // jos on tyhjä ja on jo aiemmin löydetty tyhjä niin poistetaan
                if (input.value.trim() == "" && tyhja && inputit.length > 2) {
                        inputit[i].parentNode.remove();
                }

                // onko tyhjä?
                if (input.value.trim() == "") {
                        tyhja = true;
                }

        }

        // jos ei ollut tyhjiä kenttiä, lisätään yksi
        if (!tyhja) {
                let labeli = document.createElement("label");
                labeli.textContent = "Jäsen";
                let inputti = document.createElement("input");
                inputti.setAttribute("type", "text");
                inputti.addEventListener("input", lisaaUusiTyhjaJasenlabel);
                formi.appendChild(labeli).appendChild(inputti);
        }

        // jäsenien numerointi
        for (let i=0; i < inputit.length; i++) {
                let label = inputit[i].parentNode;
                label.firstChild.nodeValue = "Jäsen " + (i+1);
                label.lastChild.setAttribute("id", "Jäsen " + (i+1));
        }
}



// ----- OMAT APUFUNKTIOT mm. vertailuun-----

/**
 * Vertailee nimeä jo olevassa oleviin joukkueiden nimiin
 * muuttaen molemmat uppercaseksi ja trimiä hyödyntämällä
 * Palauttaa totuusarvon sen mukaan, onko nimi uniikki vai ei
 * @param {String} nimi jota verrataan joukkueessa oleviin nimiin
 * @return {Boolean} true jos on uniikki, false jos nimi on jo jollakin joukkueella
 */
function onkoUniikkiJoukkueennimi(nimi) {
        let verrattava = nimi.trim().toUpperCase();
        let joukkueennimet = document.getElementById("lisaaRastiNappi").joukkueet;
        for (let jnimi of joukkueennimet.keys()) {
                if (verrattava === jnimi.trim().toUpperCase()) {
                        return false;
                }
        }
        return true;
}

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
