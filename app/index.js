/**
 * Created by MANIER HUMBERT SEBAONI on 18/03/2016. les fichiers sont sur 2C.waxo.org
 */

"use strict";
/*Création de la classe rungis dotée d'un horaire de fermeture et d'un horaire d'ouverture
 * on compare l'heure de l'horloge avec ces horaire pour determiner si rungis ouvre ou ferme
 */
class Rungis {
    constructor(horaireMin, horaireMax, evHandler, resolve, reject) {
        this.ouverture = false;
        this.horaireMin = horaireMin;
        this.horaireMax = horaireMax;

        evHour.on('hour', (hour) => {
            if (hour == this.horaireMin) {
                this.ouverture = true;
                console.log('Rungis ouvre');
            }
            if (hour == this.horaireMax) {
                this.ouverture = false;
                console.log('Rungis ferme');
            }
        });

    }

//* retreiveIngredient accepte de fournir les ingredient au restaurants si rungis est ouvert*/
    retrieveIngredient() {
        return new Promise((resolve, reject)=> {
            if (this.ouverture == true) {
                resolve();
            }
            else {
                reject();
            }
        });
    }
}
/* création de la classe resto qui prend en compte un horaire de fermeture et d'ouvertue aleatoire*/
class Resto {
    constructor(evHandler, rungis, Roger, resolve, reject) {
        this.ouverture = false;
        this.ingredient1 = 0;
        this.ingredient2 = 0;
        this.ingredient3 = 0;
        this.horaireMin = Math.round(Math.random() * 24);
        this.horaireMax = Math.round(Math.random() * 24);
        this.score = 0;
        this.service = 0;
        this.rungis = rungis;
        this.Roger = Roger;
        /* meme systeme que pour rungis, on compare les heures d'ouverture et de fermeture avec l'heure de l'horloge*/
        evHandler.on('hour', (hour) => {
            if (hour == this.horaireMin) {
                this.ouverture = true;
                console.log('Resto ouvre');
            }
            if (hour == this.horaireMax) {
                this.ouverture = false;
                console.log('Resto ferme');
            }
        });
        /* Afin de de verifier si le restaurant a toujours des ingrédients en stock, on regarde regulierement pour savoir si on doit lancer la fonction de ravitaillement. Si il faut se
         * ravitailler, on utilise un settimeout et un random pour la durée de ravitaillement*/
        evHandler.on('hour', (hour) => {
            if (this.ingredient1 == 0 && this.ingredient2 == 0 && this.ingredient3 == 0) {
                this.getIngredient().then(() => {
                    setTimeout(() => {
                        console.log('j ai mes ingredients')
                    }, 1500 + Math.round(Math.random() * (11500 - 1500)))
                        .catch(() => {
                            this.getIngredient().then(() => {
                                console.log('le resto a essayé de faire les course mais rungis was closed')
                            })
                        }, 1500 + Math.round(Math.random() * (11500 - 1500)))
                })
            }
        })
    }

    /*lorsque la fonction retrieveIngredient a fonctionné, getIngredient ajoute des ingrédients dans le stock du restaurant au bout d'un temps aléatoire ( le temps d'aller a rungis) */
    getIngredient() {
        return new Promise((resolve, reject) => {
            this.rungis.retrieveIngredient()
                .then(() => {
                    this.ingredient1 += 10;
                    this.ingredient2 += 10;
                    this.ingredient3 += 10;
                    resolve();
                })
                .catch(() => {
                    reject();
                });
        })
    }

    /* fonction receive meal : quand un client est dans un resto, cette fonction est appelée.
     *Elle détermine une recette aléatoire en fonction des ingrédients disponibles et un temps de préparation (service) aléatoire entre 5min et 1h15
     *En fonction du temps de préparation et de l'attente d client, la fonction augmente ou non le score du restaurant.
     *Si le restaurant est fermé, le reject provoque le catch de la fonction orderRecipe
     *On notera aussi qu'il est possible d'avoir des recettes a 0 ingrédients : le client commande juste un verre d'eau (mais ceci n'arrive jamais car le restaurant ferme lorsqu'il n'a plus d'ingrédient*/
    receiveMeal() {
        return new Promise((resolve, reject)=> {
            this.service = 500 + Math.round(Math.random() * (4500));
            if (this.ouverture == true) {
                if (this.ingredient1 != 0) {
                    this.ingredient1 = this.ingredient1 - Math.round(Math.random());
                }
                if (this.ingredient2 != 0) {
                    this.ingredient2 = this.ingredient2 - Math.round(Math.random());
                }
                if (this.ingredient3 != 0) {
                    this.ingredient3 = this.ingredient3 - Math.round(Math.random());
                }
                if (this.service <= this.Roger.faim - 1000) {
                    this.score = this.score + 2;
                }
                if (this.service <= this.Roger.faim - 1000 && this.service <= this.Roger.faim + 500) {
                    this.score = this.score + 1;
                }
                resolve();
                console.log('le score est de : ' + this.score);
            }

            else {
                reject();
            }
        })

    }

}

/*
 * création de la classe client*/
class client {
    constructor(evHandler, resto1, resto2, resolve, reject) {
        console.log('Nouvel objet Client créé');
        this.faim = 1000 + Math.round(Math.random() * 4000 - 1000);
        this.resto1 = resto1;
        this.resto2 = resto2;
        this.zed = 1;
        this.randomize = Math.random();
        evHandler.on('hour', (hour) => {
            if (this.zed == 1) {
                this.restoChoice();
                this.zed = 0;
            }
        })
    }

    /* fonction de choix de resto aleatoire : on fait un random, si la valeur est supérieure a 0,5, on va dans le resto 1 sinon, dans le resto 2*/
    restoChoice() {
        if (this.randomize > 0.5) {
            this.orderRecipe().then(() => {
                    console.log('Roger :Je vais dans resto1')
                })
                .catch(() => {
                    console.log('Roger : j arrive pas a rentrééééééeuu lol')
                });
        }
        else {
            this.orderRecipe2().then(() => {
                    console.log('Roger : je vais dans resto2')
                })
                .catch(() => {
                    console.log('Roger : j arrive pas a rentrer dans resto 2 lol')
                });
        }
    }

    /*Si le client est dans le resto 1, on appelle la fonction receiveMeal. si celle-ci réussit, le client est servi et est supprimé,
     *sinon le client doit aller dans l'autre restaurant après 10 minutes */
    orderRecipe() {
        return new Promise((resolve, reject) => {
            this.resto1.receiveMeal()
                .then(() => {
                    resolve();
                    setTimeout(() => {
                        this.zed = 1;
                        delete Roger();
                        console.log('Roger est mort par la bouffe')
                    }, this.resto1.service);
                })
                .catch(() => {
                    reject();
                    setTimeout(()=> {
                        console.log('Roger attend connement devant le resto fermé'), this.orderRecipe2()
                    }, 1000);
                });
        })
    }

    /*Le client est dans le resto 2, meme fonction qu'au dessus*/
    orderRecipe2() {
        return new Promise((resolve, reject) => {
            this.resto2.receiveMeal()
                .then(() => {
                    resolve();
                    setTimeout(() => {
                        this.zed = 1;
                        console.log('Roger est mort par la bouffe')
                    }, this.resto2.service);
                })
                .catch(() => {
                    reject();
                    setTimeout(()=> {
                        console.log('Roger attend devant le resto fermé comme un con'), this.orderRecipe()
                    }, 1000);
                });
        })
    }
}


/** Main */
const EventEmitter = require('events').EventEmitter;
const evMin = new EventEmitter();
const evHour = new EventEmitter();
const interMin = setInterval(() => evMin.emit('min', (j += 5) % 100), 500);
const interHour = setInterval(() => evHour.emit('hour', i++ % 24), 10000);
let i = 4;
let j = 0;

/** event listener*/
evHour.on('hour', (hour) => console.log('il est ' + hour + 'h'));
evMin.on('min', (min) => console.log('et ' + min + ' minutes'));
setTimeout(() => clearInterval(interHour), 490000);
setTimeout(() => clearInterval(interMin), 100000);
var Roger = new client(evHour, resto1, resto2);
evHour.on('hour', () => {
        if (Math.random() >= 0.7) {
            var Roger = new client(evHour, resto1, resto2);
        }
    }
);

var rungis = new Rungis(5, 14, evHour);
var resto1 = new Resto(evHour, rungis, Roger);
var resto2 = new Resto(evHour, rungis, Roger);

