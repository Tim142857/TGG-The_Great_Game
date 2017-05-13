/**
 * AdminController
 *
 * @description :: Server-side logic for managing admins
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var AdminController = {
    insertDefaultMap: function (req, res) {
        BaseMap.create({name: 'Default Map', nbRows: 10, nbColumns: 10}).exec(function (err, baseMap) {
            if (err)console.log(err);

            AdminController.generateCases(function (casesToInsert) {
                BaseCase.create(casesToInsert).exec(function (err, records) {
                    if (err)console.log(err);

                    BaseMap.findOne(1).populate('cases').exec(function (err, map) {
                        if (err)console.log(err);

                        // console.log('length:' + map.cases.length);

                        map.cases.sort(function (a, b) {
                            return a.numCase - b.numCase;
                        });
                        res.redirect('/insertData');
                    });
                });

            });
        });
    },

    generateCases: function (callback) {
        var idBaseMap = 1;
        var height = 10;
        var width = 10;
        var numCase = 1;
        var casesNotTakable = {
            4: 'water',
            14: 'water',
            15: 'water',
            16: 'water',
            24: 'bridge',
            26: 'water',
            34: 'water',
            36: 'bridge',
            41: 'bridge',
            42: 'water',
            43: 'water',
            44: 'water',
            46: 'water',
            54: 'bridge',
            56: 'water',
            64: 'water',
            65: 'bridge',
            66: 'water',
            74: 'water',
            76: 'water',
            77: 'water',
            78: 'bridge',
            79: 'water',
            80: 'water',
            84: 'water',
            85: 'water',
            86: 'water',
            87: 'water',
            97: 'bridge',
            22: 'rock',
            32: 'rock',
            47: 'rock',
            48: 'rock',
            58: 'rock',
            59: 'rock',
            52: 'rock',
            72: 'rock'
        };

        var casesWithAmeliorations = {1: 31, 2: 31, 5: 32, 10: 31, 45: 32, 70: 31, 91: 32, 99: 31, 100: 31};


        var casesToInsert = [];
        var counter = 1;
        for (var x = 0; x < height; x++) {
            for (var y = 0; y < width; y++) {
                var isTakable = 'takable';
                var horizontalBridge = null;
                var amelioration = null;
                for (var key in casesNotTakable) {
                    if (key == numCase) {
                        isTakable = casesNotTakable[key];
                        if (numCase == 24 || numCase == 36 || numCase == 54 || numCase == 97) {
                            horizontalBridge = true;
                        }
                        if (numCase == 41 || numCase == 65 || numCase == 78) {
                            horizontalBridge = false;
                        }
                    }
                }
                for (var key in casesWithAmeliorations) {
                    if (key == numCase) {
                        amelioration = casesWithAmeliorations[key];
                    }
                }
                var params = {
                    id: numCase,
                    baseMap: idBaseMap,
                    numCase: numCase,
                    coordX: x,
                    coordY: y,
                    type: isTakable,
                    horizontalBridge: horizontalBridge,
                    amelioration: amelioration
                };
                casesToInsert.push(params);
                numCase++;
            }
        }
        callback(casesToInsert);
    },

    insertAmeliorations: function (req, res) {
        var typeAmeliorations = [];

        var type1 = {id: 1, name: 'bonusOff', description: "Rend vos unités plus fortes lorsqu'elles attaquent"};
        typeAmeliorations.push(type1);
        var type2 = {id: 2, name: 'bonusDef', description: "Rend vos unités plus fortes lorsqu'elles défendent"};
        typeAmeliorations.push(type2);
        var type3 = {
            id: 3,
            name: 'bonus',
            description: "Rend vos unités plus fortes aussi bien en attaque qu'en défense"
        };
        typeAmeliorations.push(type3);
        var type4 = {id: 4, name: 'bonusReinforcements', description: "Vous gagnez plus de renforts à chaque tour"};
        typeAmeliorations.push(type4);
        var type5 = {id: 5, name: 'bonusProd', description: "Vous produisez plus de ressources à chaque tour"};
        typeAmeliorations.push(type5);
        var type6 = {
            id: 6,
            name: 'bonusRessource',
            description: "Vous gagnez instantanément une quantité de ressources"
        };
        typeAmeliorations.push(type6);

        TypeAmelioration.create(typeAmeliorations).exec(function (err, types) {
            if (err)console.log(err);

            var ameliorationsToInsert = [];

            //Bonus off
            var ameliorationOff1 = {id: 1, delayToUse: 0, manaCost: 1, type: 1, value: 1, level: 1};
            ameliorationsToInsert.push(ameliorationOff1);
            var ameliorationOff2 = {id: 2, delayToUse: 1, manaCost: 2, type: 1, value: 2, level: 2};
            ameliorationsToInsert.push(ameliorationOff2);
            var ameliorationOff3 = {id: 3, delayToUse: 2, manaCost: 4, type: 1, value: 3, level: 3};
            ameliorationsToInsert.push(ameliorationOff3);
            var ameliorationOff4 = {id: 4, delayToUse: 3, manaCost: 7, type: 1, value: 4, level: 4};
            ameliorationsToInsert.push(ameliorationOff4);
            var ameliorationOff5 = {id: 5, delayToUse: 4, manaCost: 10, type: 1, value: 6, level: 5};
            ameliorationsToInsert.push(ameliorationOff5);
            var ameliorationOff6 = {id: 6, delayToUse: 8, manaCost: 25, type: 1, value: 15, level: 6};
            ameliorationsToInsert.push(ameliorationOff6);

            //Bonus def
            var ameliorationDef1 = {
                id: 7, delayToUse: 0, manaCost: 1, type: 2, value: 1, level: 1
            };
            ameliorationsToInsert.push(ameliorationDef1);
            var ameliorationDef2 = {
                id: 8, delayToUse: 1, manaCost: 2, type: 2, value: 2, level: 2
            };
            ameliorationsToInsert.push(ameliorationDef2);
            var ameliorationDef3 = {
                id: 9, delayToUse: 2, manaCost: 4, type: 2, value: 3, level: 3
            };
            ameliorationsToInsert.push(ameliorationDef3);
            var ameliorationDef4 = {
                id: 10, delayToUse: 3, manaCost: 7, type: 2, value: 4, level: 4
            };
            ameliorationsToInsert.push(ameliorationDef4);
            var ameliorationDef5 = {
                id: 11, delayToUse: 4, manaCost: 10, type: 2, value: 6, level: 5
            };
            ameliorationsToInsert.push(ameliorationDef5);
            var ameliorationDef6 = {
                id: 12, delayToUse: 8, manaCost: 25, type: 2, value: 15, level: 6
            };
            ameliorationsToInsert.push(ameliorationDef6);

            //Bonus
            var amelioration1 = {id: 13, delayToUse: 2, manaCost: 2, type: 3, value: 1, level: 1};
            ameliorationsToInsert.push(amelioration1);
            var amelioration2 = {id: 14, delayToUse: 3, manaCost: 4, type: 3, value: 2, level: 2};
            ameliorationsToInsert.push(amelioration2);
            var amelioration3 = {id: 15, delayToUse: 5, manaCost: 8, type: 3, value: 3, level: 3};
            ameliorationsToInsert.push(amelioration3);
            var amelioration4 = {id: 16, delayToUse: 8, manaCost: 14, type: 3, value: 4, level: 4};
            ameliorationsToInsert.push(amelioration4);
            var amelioration5 = {id: 17, delayToUse: 10, manaCost: 20, type: 3, value: 6, level: 5};
            ameliorationsToInsert.push(amelioration5);
            var amelioration6 = {id: 18, delayToUse: 15, manaCost: 50, type: 3, value: 15, level: 6};
            ameliorationsToInsert.push(amelioration6);

            //bonus reinforcements
            var ameliorationReinforcements1 = {id: 19, delayToUse: 0, manaCost: 1, type: 4, value: 10, level: 1};
            ameliorationsToInsert.push(ameliorationReinforcements1);
            var ameliorationReinforcements2 = {id: 20, delayToUse: 1, manaCost: 4, type: 4, value: 20, level: 2};
            ameliorationsToInsert.push(ameliorationReinforcements2);
            var ameliorationReinforcements3 = {id: 21, delayToUse: 2, manaCost: 8, type: 4, value: 30, level: 3};
            ameliorationsToInsert.push(ameliorationReinforcements3);
            var ameliorationReinforcements4 = {id: 22, delayToUse: 3, manaCost: 14, type: 4, value: 40, level: 4};
            ameliorationsToInsert.push(ameliorationReinforcements4);
            var ameliorationReinforcements5 = {id: 23, delayToUse: 4, manaCost: 20, type: 4, value: 60, level: 5};
            ameliorationsToInsert.push(ameliorationReinforcements5);
            var ameliorationReinforcements6 = {
                id: 24,
                delayToUse: 8,
                manaCost: 50,
                type: 4,
                value: 100,
                level: 6
            };
            ameliorationsToInsert.push(ameliorationReinforcements6);

            //bonus prod
            var ameliorationProd1 = {id: 25, delayToUse: 0, manaCost: 1, type: 5, value: 1, level: 1};
            ameliorationsToInsert.push(ameliorationProd1);
            var ameliorationProd2 = {id: 26, delayToUse: 1, manaCost: 2, type: 5, value: 2, level: 2};
            ameliorationsToInsert.push(ameliorationProd2);
            var ameliorationProd3 = {id: 27, delayToUse: 2, manaCost: 4, type: 5, value: 3, level: 3};
            ameliorationsToInsert.push(ameliorationProd3);
            var ameliorationProd4 = {id: 28, delayToUse: 3, manaCost: 7, type: 5, value: 4, level: 4};
            ameliorationsToInsert.push(ameliorationProd4);
            var ameliorationProd5 = {id: 29, delayToUse: 4, manaCost: 10, type: 5, value: 6, level: 5};
            ameliorationsToInsert.push(ameliorationProd5);
            var ameliorationProd6 = {id: 30, delayToUse: 8, manaCost: 25, type: 5, value: 15, level: 6};
            ameliorationsToInsert.push(ameliorationProd6);

            //bonus ressource
            var ameliorationRessource1 = {id: 31, delayToUse: 0, manaCost: 0, type: 6, value: 1, level: 1};
            ameliorationsToInsert.push(ameliorationRessource1);
            var ameliorationRessource2 = {id: 32, delayToUse: 0, manaCost: 0, type: 6, value: 3, level: 2};
            ameliorationsToInsert.push(ameliorationRessource2);
            var ameliorationRessource3 = {id: 33, delayToUse: 0, manaCost: 0, type: 6, value: 8, level: 3};
            ameliorationsToInsert.push(ameliorationRessource3);
            var ameliorationRessource4 = {id: 34, delayToUse: 1, manaCost: 0, type: 6, value: 5, level: 4};
            ameliorationsToInsert.push(ameliorationRessource4);
            var ameliorationRessource5 = {id: 35, delayToUse: 2, manaCost: 0, type: 6, value: 15, level: 5};
            ameliorationsToInsert.push(ameliorationRessource5);
            var ameliorationRessource6 = {id: 36, delayToUse: 3, manaCost: 0, type: 6, value: 30, level: 6};
            ameliorationsToInsert.push(ameliorationRessource6);

            Amelioration.create(ameliorationsToInsert).exec(function (err, records) {
                if (err) {
                    console.log(err);
                }
                res.redirect('/insertData');
            });

        });


    },

};

module.exports = AdminController;

